import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import chalk from 'chalk';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('⚠️ Advertir a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a advertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón de la advertencia')
                .setRequired(true)
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'warn')) {
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
        const reason = interaction.options.getString('razon');
        const silent = interaction.options.getBoolean('silencioso') || false;

        try {
            // Verificar si el usuario está en el servidor
            const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            
            if (!targetMember) {
                const notInServerEmbed = new EmbedBuilder()
                    .setTitle('❌ Usuario No Encontrado')
                    .setDescription(`${targetUser} no está en este servidor.`)
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [notInServerEmbed], ephemeral: true });
            }

            // Verificaciones de seguridad
            if (targetUser.id === interaction.user.id) {
                const selfWarnEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes advertirte a ti mismo.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [selfWarnEmbed], ephemeral: true });
            }

            if (targetUser.id === interaction.client.user.id) {
                const botWarnEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes advertir al bot.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [botWarnEmbed], ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: silent });

            // Crear base de datos de warnings si no existe
            const dbManager = interaction.client.dbManager;
            dbManager.createDatabase('warnings', []);

            // Obtener warnings existentes del usuario
            const allWarnings = dbManager.getAllRecords('warnings');
            const userWarnings = allWarnings.filter(w => w.userId === targetUser.id && w.guildId === interaction.guild.id);

            // Crear nuevo warning
            const newWarning = {
                id: Date.now().toString(),
                userId: targetUser.id,
                username: targetUser.username,
                userTag: targetUser.tag,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name,
                moderatorId: interaction.user.id,
                moderatorUsername: interaction.user.username,
                reason: reason,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleString('es-ES'),
                active: true
            };

            // Guardar warning en la base de datos
            allWarnings.push(newWarning);
            dbManager.writeDatabase('warnings', allWarnings);

            // Intentar enviar mensaje privado al usuario
            let dmSent = false;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Has recibido una advertencia')
                    .setDescription(`Has recibido una advertencia en el servidor **${interaction.guild.name}**.`)
                    .addFields([
                        { name: '📋 Razón', value: reason, inline: false },
                        { name: '👨‍💼 Moderador', value: interaction.user.username, inline: true },
                        { name: '📅 Fecha', value: newWarning.date, inline: true },
                        { name: '🔢 Total de advertencias', value: `${userWarnings.length + 1}`, inline: true },
                        { name: '💡 Información', value: 'Las advertencias quedan registradas en tu historial. Evita acumular más para no recibir sanciones mayores.', inline: false }
                    ])
                    .setColor(0xffa500)
                    .setTimestamp()
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                await targetUser.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch (error) {
                console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
            }

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('⚠️ Advertencia Aplicada')
                .setDescription(`${targetUser} ha recibido una advertencia exitosamente.`)
                .addFields([
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🔢 Warning ID', value: newWarning.id, inline: true },
                    { name: '📊 Total advertencias', value: `${userWarnings.length + 1}`, inline: true },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true },
                    { name: '📅 Fecha', value: newWarning.date, inline: false }
                ])
                .setColor(0xffa500)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Warning aplicado a usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        warningId: newWarning.id,
                        totalWarnings: userWarnings.length + 1,
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.yellow(`⚠️ ${targetUser.username} recibió warning en ${interaction.guild.name} por ${interaction.user.username} (Total: ${userWarnings.length + 1})`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando warn:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Aplicar Advertencia')
                .setDescription('Ocurrió un error al intentar aplicar la advertencia al usuario.')
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

            // Registrar error en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Error en warning de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        error: error.message
                    },
                    success: false
                });
            }
        }
    }
};
