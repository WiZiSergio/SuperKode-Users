const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cases')
        .setDescription('📋 Ver historial de moderación de un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario del que ver el historial')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('limite')
                .setDescription('Número máximo de casos a mostrar (1-20)')
                .setMinValue(1)
                .setMaxValue(20))
        .addBooleanOption(option =>
            option.setName('solo_activos')
                .setDescription('Mostrar solo casos activos (warnings no removidos)'))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('Mostrar respuesta solo para ti')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'cases')) {
            const noPermEmbed = new EmbedBuilder()
                .setTitle('❌ Sin Permisos')
                .setDescription('No tienes permisos para usar este comando.\n\n' +
                               '**Permisos requeridos:**\n' +
                               '• Ser moderador configurado\n' +
                               '• Tener permisos de `Moderar Miembros`\n' +
                               '• Ser administrador del servidor')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const limit = interaction.options.getInteger('limite') || 10;
        const onlyActive = interaction.options.getBoolean('solo_activos') || false;
        const silent = interaction.options.getBoolean('silencioso') || false;

        try {
            await interaction.deferReply({ ephemeral: silent });

            const dbManager = interaction.client.dbManager;
            
            // Obtener warnings
            dbManager.createDatabase('warnings', []);
            const allWarnings = dbManager.getAllRecords('warnings');
            let userWarnings = allWarnings.filter(w => 
                w.userId === targetUser.id && 
                w.guildId === interaction.guild.id
            );

            // Filtrar solo activos si se especifica
            if (onlyActive) {
                userWarnings = userWarnings.filter(w => w.active === true);
            }

            // Obtener logs de moderación del sistema de logs
            const moderationLogs = [];
            try {
                const logDatabases = ['mod', 'databasereload']; // Agregar más bases de datos de logs si existen
                
                for (const dbName of logDatabases) {
                    try {
                        const logs = dbManager.getAllRecords(dbName);
                        const userLogs = logs.filter(log => 
                            log.user && log.user.id === targetUser.id &&
                            log.guild && log.guild.id === interaction.guild.id &&
                            log.category === 'moderation'
                        );
                        moderationLogs.push(...userLogs);
                    } catch (error) {
                        // Base de datos no existe o está vacía
                    }
                }
            } catch (error) {
                console.log(chalk.yellow('⚠️ No se pudieron obtener logs de moderación'));
            }

            // Combinar todos los casos y ordenar por fecha
            const allCases = [];

            // Agregar warnings
            userWarnings.forEach(warning => {
                allCases.push({
                    type: 'warning',
                    id: warning.id,
                    action: warning.active ? 'Warning aplicado' : 'Warning removido',
                    reason: warning.active ? warning.reason : `${warning.reason} (Removido: ${warning.removeReason || 'Sin razón'})`,
                    moderator: warning.active ? warning.moderatorUsername : warning.removedByUsername || warning.moderatorUsername,
                    date: warning.active ? warning.date : warning.removedDate || warning.date,
                    timestamp: warning.active ? warning.timestamp : warning.removedAt || warning.timestamp,
                    active: warning.active,
                    emoji: warning.active ? '⚠️' : '✅',
                    color: warning.active ? 0xffa500 : 0x00ff00
                });
            });

            // Agregar logs de moderación
            moderationLogs.forEach(log => {
                let actionType = 'unknown';
                let emoji = '📋';
                let color = 0x0099ff;

                if (log.action.includes('ban')) {
                    actionType = log.action.includes('unban') ? 'unban' : 'ban';
                    emoji = log.action.includes('unban') ? '🔓' : '🔨';
                    color = log.action.includes('unban') ? 0x00ff00 : 0xff0000;
                } else if (log.action.includes('kick')) {
                    actionType = 'kick';
                    emoji = '👢';
                    color = 0xffa500;
                } else if (log.action.includes('timeout')) {
                    actionType = log.action.includes('removido') ? 'untimeout' : 'timeout';
                    emoji = '⏰';
                    color = log.action.includes('removido') ? 0x00ff00 : 0xffa500;
                }

                allCases.push({
                    type: actionType,
                    id: log.id || Date.now().toString(),
                    action: log.action,
                    reason: log.details?.reason || 'No especificada',
                    moderator: log.user?.username || 'Desconocido',
                    date: new Date(log.timestamp).toLocaleString('es-ES'),
                    timestamp: log.timestamp,
                    active: true,
                    emoji: emoji,
                    color: color
                });
            });

            // Ordenar por fecha (más reciente primero) y limitar
            allCases.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const limitedCases = allCases.slice(0, limit);

            // Crear embed principal
            const casesEmbed = new EmbedBuilder()
                .setTitle(`📋 Historial de Moderación - ${targetUser.username}`)
                .setDescription(`Historial de acciones de moderación para ${targetUser}`)
                .setColor(0x0099ff)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp();

            if (limitedCases.length === 0) {
                casesEmbed.addFields([
                    {
                        name: '📭 Sin Historial',
                        value: onlyActive ? 
                            'Este usuario no tiene casos activos de moderación.' :
                            'Este usuario no tiene historial de moderación.',
                        inline: false
                    }
                ]);
            } else {
                // Agregar casos al embed
                const casesText = limitedCases.map((case_, index) => {
                    const status = case_.active ? '' : ' (Inactivo)';
                    return `**${index + 1}.** ${case_.emoji} **${case_.action}**${status}\n` +
                           `   └ **Razón:** ${case_.reason}\n` +
                           `   └ **Moderador:** ${case_.moderator}\n` +
                           `   └ **Fecha:** ${case_.date}`;
                }).join('\n\n');

                // Dividir en chunks si es muy largo
                if (casesText.length > 1024) {
                    const chunks = [];
                    let currentChunk = '';
                    const cases = casesText.split('\n\n');
                    
                    for (const case_ of cases) {
                        if ((currentChunk + case_).length > 1000) {
                            chunks.push(currentChunk);
                            currentChunk = case_;
                        } else {
                            currentChunk += (currentChunk ? '\n\n' : '') + case_;
                        }
                    }
                    if (currentChunk) chunks.push(currentChunk);

                    chunks.forEach((chunk, index) => {
                        casesEmbed.addFields([
                            {
                                name: index === 0 ? `📋 Casos (${limitedCases.length}/${allCases.length})` : `📋 Casos (continuación ${index + 1})`,
                                value: chunk,
                                inline: false
                            }
                        ]);
                    });
                } else {
                    casesEmbed.addFields([
                        {
                            name: `📋 Casos (${limitedCases.length}/${allCases.length})`,
                            value: casesText,
                            inline: false
                        }
                    ]);
                }

                // Estadísticas
                const activeWarnings = userWarnings.filter(w => w.active).length;
                const totalWarnings = userWarnings.length;
                const otherActions = allCases.filter(c => c.type !== 'warning').length;

                casesEmbed.addFields([
                    {
                        name: '📊 Estadísticas',
                        value: `**Advertencias activas:** ${activeWarnings}\n` +
                               `**Total advertencias:** ${totalWarnings}\n` +
                               `**Otras acciones:** ${otherActions}\n` +
                               `**Total casos:** ${allCases.length}`,
                        inline: true
                    },
                    {
                        name: '🔍 Filtros Aplicados',
                        value: `**Límite:** ${limit}\n` +
                               `**Solo activos:** ${onlyActive ? 'Sí' : 'No'}\n` +
                               `**Servidor:** ${interaction.guild.name}`,
                        inline: true
                    }
                ]);
            }

            // Footer con información adicional
            casesEmbed.setFooter({
                text: `Consultado por ${interaction.user.username} | Página 1`,
                iconURL: interaction.user.displayAvatarURL()
            });

            await interaction.editReply({ embeds: [casesEmbed] });

            // Log de la consulta
            console.log(chalk.cyan(`📋 Historial de ${targetUser.username} consultado por ${interaction.user.username} en ${interaction.guild.name}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando cases:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Obtener Historial')
                .setDescription('Ocurrió un error al intentar obtener el historial de moderación.')
                .addFields([
                    { name: '🚨 Error', value: `\`\`\`${error.message}\`\`\`` }
                ])
                .setColor(0xff0000)
                .setTimestamp();

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [errorEmbed] });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
