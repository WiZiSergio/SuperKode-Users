import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import chalk from 'chalk';

export default {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('✅ Quitar advertencia a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario al que quitar advertencia')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('warning_id')
                .setDescription('ID específico del warning a quitar')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón para quitar la advertencia')
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'unwarn')) {
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
        const warningId = interaction.options.getString('warning_id');
        const reason = interaction.options.getString('razon') || 'No se especificó razón';
        const silent = interaction.options.getBoolean('silencioso') || false;

        try {
            await interaction.deferReply({ ephemeral: silent });

            // Obtener base de datos de warnings
            const dbManager = interaction.client.dbManager;
            dbManager.createDatabase('warnings', []);
            const allWarnings = dbManager.getAllRecords('warnings');

            // Filtrar warnings del usuario en este servidor
            const userWarnings = allWarnings.filter(w => 
                w.userId === targetUser.id && 
                w.guildId === interaction.guild.id && 
                w.active === true
            );

            if (userWarnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Sin Advertencias')
                    .setDescription(`${targetUser} no tiene advertencias activas en este servidor.`)
                    .setColor(0xffa500)
                    .setTimestamp();

                return interaction.editReply({ embeds: [noWarningsEmbed] });
            }

            let warningToRemove;

            // Si se especificó un ID de warning, buscar ese específico
            if (warningId) {
                warningToRemove = userWarnings.find(w => w.id === warningId);
                
                if (!warningToRemove) {
                    const warningNotFoundEmbed = new EmbedBuilder()
                        .setTitle('❌ Warning No Encontrado')
                        .setDescription(`No se encontró un warning con ID \`${warningId}\` para ${targetUser} en este servidor.`)
                        .addFields([
                            { 
                                name: '💡 IDs disponibles', 
                                value: userWarnings.length > 0 ? 
                                    userWarnings.map(w => `\`${w.id}\` - ${w.reason.substring(0, 50)}${w.reason.length > 50 ? '...' : ''}`).join('\n') :
                                    'No hay warnings activos',
                                inline: false 
                            }
                        ])
                        .setColor(0xff0000)
                        .setTimestamp();

                    return interaction.editReply({ embeds: [warningNotFoundEmbed] });
                }
            } else {
                // Si no se especificó ID, quitar el warning más reciente
                warningToRemove = userWarnings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            }

            // Marcar el warning como inactivo en lugar de eliminarlo
            const warningIndex = allWarnings.findIndex(w => w.id === warningToRemove.id);
            allWarnings[warningIndex].active = false;
            allWarnings[warningIndex].removedBy = interaction.user.id;
            allWarnings[warningIndex].removedByUsername = interaction.user.username;
            allWarnings[warningIndex].removedAt = new Date().toISOString();
            allWarnings[warningIndex].removedDate = new Date().toLocaleString('es-ES');
            allWarnings[warningIndex].removeReason = reason;

            // Guardar cambios en la base de datos
            dbManager.writeDatabase('warnings', allWarnings);

            // Calcular warnings restantes
            const remainingWarnings = userWarnings.length - 1;

            // Intentar enviar mensaje privado al usuario
            let dmSent = false;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('✅ Advertencia Removida')
                    .setDescription(`Una de tus advertencias en el servidor **${interaction.guild.name}** ha sido removida.`)
                    .addFields([
                        { name: '📋 Warning removido', value: warningToRemove.reason, inline: false },
                        { name: '📋 Razón de remoción', value: reason, inline: false },
                        { name: '👨‍💼 Removido por', value: interaction.user.username, inline: true },
                        { name: '📅 Fecha original', value: warningToRemove.date, inline: true },
                        { name: '📅 Fecha de remoción', value: new Date().toLocaleString('es-ES'), inline: true },
                        { name: '📊 Advertencias restantes', value: `${remainingWarnings}`, inline: true }
                    ])
                    .setColor(0x00ff00)
                    .setTimestamp()
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                await targetUser.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch (error) {
                console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
            }

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Advertencia Removida')
                .setDescription(`Se ha removido exitosamente una advertencia de ${targetUser}.`)
                .addFields([
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '👨‍💼 Removido por', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '🔢 Warning ID', value: warningToRemove.id, inline: true },
                    { name: '📊 Advertencias restantes', value: `${remainingWarnings}`, inline: true },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true },
                    { name: '📋 Warning removido', value: warningToRemove.reason, inline: false },
                    { name: '📋 Razón de remoción', value: reason, inline: false },
                    { name: '📅 Warning original', value: warningToRemove.date, inline: true },
                    { name: '📅 Removido el', value: new Date().toLocaleString('es-ES'), inline: true }
                ])
                .setColor(0x00ff00)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Warning removido de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        warningId: warningToRemove.id,
                        originalReason: warningToRemove.reason,
                        removeReason: reason,
                        remainingWarnings: remainingWarnings,
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.green(`✅ Warning removido de ${targetUser.username} en ${interaction.guild.name} por ${interaction.user.username} (Restantes: ${remainingWarnings})`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando unwarn:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Quitar Advertencia')
                .setDescription('Ocurrió un error al intentar quitar la advertencia del usuario.')
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
                    action: `Error en unwarn de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        warningId: warningId,
                        error: error.message
                    },
                    success: false
                });
            }
        }
    }
};
