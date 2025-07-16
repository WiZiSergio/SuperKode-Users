const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 Expulsar un usuario del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a expulsar')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón de la expulsión')
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'kick')) {
            const noPermEmbed = new EmbedBuilder()
                .setTitle('❌ Sin Permisos')
                .setDescription('No tienes permisos para usar este comando.\n\n' +
                               '**Permisos requeridos:**\n' +
                               '• Ser moderador configurado\n' +
                               '• Tener permisos de `Expulsar Miembros`\n' +
                               '• Ser administrador del servidor')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        // Verificar permisos del bot
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            const botNoPermEmbed = new EmbedBuilder()
                .setTitle('❌ Bot Sin Permisos')
                .setDescription('El bot no tiene permisos para expulsar miembros en este servidor.')
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

            // Verificaciones de seguridad
            if (targetUser.id === interaction.user.id) {
                const selfKickEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes expulsarte a ti mismo.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [selfKickEmbed], ephemeral: true });
            }

            if (targetUser.id === interaction.client.user.id) {
                const botKickEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes expulsar al bot.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [botKickEmbed], ephemeral: true });
            }

            // Verificar jerarquía de roles
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const hierarchyEmbed = new EmbedBuilder()
                    .setTitle('❌ Jerarquía Insuficiente')
                    .setDescription('No puedes expulsar a un usuario con un rol igual o superior al tuyo.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [hierarchyEmbed], ephemeral: true });
            }

            if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                const botHierarchyEmbed = new EmbedBuilder()
                    .setTitle('❌ Bot Sin Jerarquía')
                    .setDescription('El bot no puede expulsar a este usuario debido a la jerarquía de roles.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [botHierarchyEmbed], ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: silent });

            // Intentar enviar mensaje privado al usuario antes de la expulsión
            let dmSent = false;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('👢 Has sido expulsado')
                    .setDescription(`Has sido expulsado del servidor **${interaction.guild.name}**.`)
                    .addFields([
                        { name: '📋 Razón', value: reason, inline: false },
                        { name: '👨‍💼 Moderador', value: interaction.user.username, inline: true },
                        { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true },
                        { name: '💡 Información', value: 'Puedes volver a unirte al servidor si tienes una invitación válida.', inline: false }
                    ])
                    .setColor(0xffa500)
                    .setTimestamp()
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                await targetUser.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch (error) {
                console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
            }

            // Ejecutar la expulsión
            await targetMember.kick(`${reason} | Moderador: ${interaction.user.username} (${interaction.user.id})`);

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('👢 Usuario Expulsado')
                .setDescription(`${targetUser} ha sido expulsado exitosamente del servidor.`)
                .addFields([
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true },
                    { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true },
                    { name: '💡 Nota', value: 'El usuario puede volver a unirse con una invitación válida.', inline: false }
                ])
                .setColor(0xffa500)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Kick de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.yellow(`👢 ${targetUser.username} expulsado de ${interaction.guild.name} por ${interaction.user.username}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando kick:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Expulsar')
                .setDescription('Ocurrió un error al intentar expulsar al usuario.')
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
                    action: `Error en kick de usuario: ${targetUser.username}`,
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
