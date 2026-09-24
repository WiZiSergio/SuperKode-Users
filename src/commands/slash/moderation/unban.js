import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import chalk from 'chalk';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('🔓 Desbanear un usuario del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('usuario')
                .setDescription('ID del usuario a desbanear')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del desbaneo')
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'unban')) {
            const noPermEmbed = new EmbedBuilder()
                .setTitle('❌ Sin Permisos')
                .setDescription('No tienes permisos para usar este comando.\n\n' +
                               '**Permisos requeridos:**\n' +
                               '• Ser moderador configurado\n' +
                               '• Tener permisos de `Banear Miembros`\n' +
                               '• Ser administrador del servidor')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            const botNoPermEmbed = new EmbedBuilder()
                .setTitle('❌ Bot Sin Permisos')
                .setDescription('El bot no tiene permisos para desbanear miembros en este servidor.')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [botNoPermEmbed], ephemeral: true });
        }

        const userId = interaction.options.getString('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó razón';
        const silent = interaction.options.getBoolean('silencioso') || false;

        try {
            await interaction.deferReply({ ephemeral: silent });

            // Verificar si el usuario está baneado
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(userId);
            
            if (!bannedUser) {
                const notBannedEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Usuario No Baneado')
                    .setDescription(`El usuario con ID \`${userId}\` no está baneado en este servidor.`)
                    .setColor(0xffa500)
                    .setTimestamp();

                return interaction.editReply({ embeds: [notBannedEmbed] });
            }

            // Ejecutar el desbaneo
            await interaction.guild.members.unban(userId, `${reason} | Moderador: ${interaction.user.username} (${interaction.user.id})`);

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('🔓 Usuario Desbaneado')
                .setDescription(`<@${userId}> ha sido desbaneado exitosamente del servidor.`)
                .addFields([
                    { name: '👤 Usuario', value: `${bannedUser.user.username} (${bannedUser.user.tag})`, inline: true },
                    { name: '🆔 ID', value: userId, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '📋 Razón del ban original', value: bannedUser.reason || 'No especificada', inline: false },
                    { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true }
                ])
                .setColor(0x00ff00)
                .setThumbnail(bannedUser.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Unban de usuario: ${bannedUser.user.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: userId,
                            username: bannedUser.user.username,
                            tag: bannedUser.user.tag
                        },
                        reason: reason,
                        originalBanReason: bannedUser.reason
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.green(`🔓 ${bannedUser.user.username} desbaneado de ${interaction.guild.name} por ${interaction.user.username}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando unban:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Desbanear')
                .setDescription('Ocurrió un error al intentar desbanear al usuario.')
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
                    action: `Error en unban de usuario: ${userId}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUserId: userId,
                        error: error.message
                    },
                    success: false
                });
            }
        }
    }
};
