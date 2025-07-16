const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('⏰ Quitar timeout a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a quitar timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón para quitar el timeout')
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'untimeout')) {
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

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            const botNoPermEmbed = new EmbedBuilder()
                .setTitle('❌ Bot Sin Permisos')
                .setDescription('El bot no tiene permisos para moderar miembros en este servidor.')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [botNoPermEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || 'No se especificó razón';
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

            // Verificar si el usuario tiene timeout
            if (!targetMember.communicationDisabledUntil || targetMember.communicationDisabledUntil < new Date()) {
                const noTimeoutEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Usuario Sin Timeout')
                    .setDescription(`${targetUser} no tiene timeout activo.`)
                    .setColor(0xffa500)
                    .setTimestamp();

                return interaction.reply({ embeds: [noTimeoutEmbed], ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: silent });

            // Guardar información del timeout actual
            const timeoutUntil = targetMember.communicationDisabledUntil;
            const remainingTime = Math.ceil((timeoutUntil - new Date()) / (1000 * 60)); // minutos restantes

            // Intentar enviar mensaje privado al usuario
            let dmSent = false;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('✅ Timeout Removido')
                    .setDescription(`Tu timeout en el servidor **${interaction.guild.name}** ha sido removido.`)
                    .addFields([
                        { name: '📋 Razón', value: reason, inline: false },
                        { name: '⏰ Tiempo restante que tenías', value: `${remainingTime} minutos`, inline: true },
                        { name: '👨‍💼 Moderador', value: interaction.user.username, inline: true },
                        { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true }
                    ])
                    .setColor(0x00ff00)
                    .setTimestamp()
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                await targetUser.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch (error) {
                console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
            }

            // Quitar timeout
            await targetMember.timeout(null, `${reason} | Moderador: ${interaction.user.username} (${interaction.user.id})`);

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Timeout Removido')
                .setDescription(`El timeout de ${targetUser} ha sido removido exitosamente.`)
                .addFields([
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '⏰ Tiempo restante que tenía', value: `${remainingTime} minutos`, inline: true },
                    { name: '📅 Timeout original hasta', value: timeoutUntil.toLocaleString('es-ES'), inline: true },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true }
                ])
                .setColor(0x00ff00)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Timeout removido de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        remainingTime: remainingTime,
                        originalTimeoutUntil: timeoutUntil.toISOString(),
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.green(`✅ Timeout removido de ${targetUser.username} en ${interaction.guild.name} por ${interaction.user.username}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando untimeout:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Quitar Timeout')
                .setDescription('Ocurrió un error al intentar quitar el timeout al usuario.')
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
                    action: `Error en untimeout de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        error: error.message
                    },
                    success: false
                });
            }
        }
    }
};
