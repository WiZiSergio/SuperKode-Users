const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const chalk = require('chalk');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 Banear un usuario del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a banear')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('ID del usuario a banear (alternativa a usuario)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del baneo')
                .setMaxLength(512))
        .addIntegerOption(option =>
            option.setName('dias')
                .setDescription('Días de mensajes a eliminar (0-7)')
                .setMinValue(0)
                .setMaxValue(7))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'ban')) {
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
                .setDescription('El bot no tiene permisos para banear miembros en este servidor.')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [botNoPermEmbed], ephemeral: true });
        }

        const targetUser = interaction.options.getUser('usuario');
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('razon') || 'No se especificó razón';
        const deleteMessageDays = interaction.options.getInteger('dias') || 0;
        const silent = interaction.options.getBoolean('silencioso') || false;

        // Verificar que se proporcionó usuario o ID
        if (!targetUser && !userId) {
            const noTargetEmbed = new EmbedBuilder()
                .setTitle('❌ Parámetro Requerido')
                .setDescription('Debes especificar un usuario o un ID de usuario para banear.')
                .addFields([
                    { name: '💡 Uso', value: '• Usa el parámetro `usuario` para seleccionar un usuario\n• O usa `user_id` para especificar un ID de usuario', inline: false }
                ])
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [noTargetEmbed], ephemeral: true });
        }

        // Si se proporcionó tanto usuario como ID, dar prioridad al usuario
        let finalTargetUser = targetUser;
        let finalUserId = targetUser ? targetUser.id : userId;

        // Si solo se proporcionó ID, intentar obtener el usuario
        if (!targetUser && userId) {
            try {
                finalTargetUser = await interaction.client.users.fetch(userId);
                finalUserId = userId;
            } catch (error) {
                const invalidIdEmbed = new EmbedBuilder()
                    .setTitle('❌ ID Inválido')
                    .setDescription(`No se pudo encontrar un usuario con el ID: \`${userId}\``)
                    .addFields([
                        { name: '💡 Verificar', value: 'Asegúrate de que el ID sea correcto y que el usuario exista en Discord.', inline: false }
                    ])
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [invalidIdEmbed], ephemeral: true });
            }
        }

        try {
            // Verificar si el usuario está en el servidor
            const targetMember = await interaction.guild.members.fetch(finalUserId).catch(() => null);

            // Verificar si el usuario ya está baneado
            const banList = await interaction.guild.bans.fetch();
            const existingBan = banList.get(finalUserId);
            
            if (existingBan) {
                const alreadyBannedEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Usuario Ya Baneado')
                    .setDescription(`${finalTargetUser} ya está baneado de este servidor.`)
                    .addFields([
                        { name: '📋 Razón actual', value: existingBan.reason || 'No especificada', inline: false }
                    ])
                    .setColor(0xffa500)
                    .setTimestamp();

                return interaction.reply({ embeds: [alreadyBannedEmbed], ephemeral: true });
            }

            // Verificaciones de seguridad si el usuario está en el servidor
            if (targetMember) {
                // No se puede banear a sí mismo
                if (finalUserId === interaction.user.id) {
                    const selfBanEmbed = new EmbedBuilder()
                        .setTitle('❌ Acción No Permitida')
                        .setDescription('No puedes banearte a ti mismo.')
                        .setColor(0xff0000)
                        .setTimestamp();

                    return interaction.reply({ embeds: [selfBanEmbed], ephemeral: true });
                }

                // No se puede banear al bot
                if (finalUserId === interaction.client.user.id) {
                    const botBanEmbed = new EmbedBuilder()
                        .setTitle('❌ Acción No Permitida')
                        .setDescription('No puedes banear al bot.')
                        .setColor(0xff0000)
                        .setTimestamp();

                    return interaction.reply({ embeds: [botBanEmbed], ephemeral: true });
                }

                // Verificar jerarquía de roles
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    const hierarchyEmbed = new EmbedBuilder()
                        .setTitle('❌ Jerarquía Insuficiente')
                        .setDescription('No puedes banear a un usuario con un rol igual o superior al tuyo.')
                        .setColor(0xff0000)
                        .setTimestamp();

                    return interaction.reply({ embeds: [hierarchyEmbed], ephemeral: true });
                }

                // Verificar si el bot puede banear al usuario
                if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                    const botHierarchyEmbed = new EmbedBuilder()
                        .setTitle('❌ Bot Sin Jerarquía')
                        .setDescription('El bot no puede banear a este usuario debido a la jerarquía de roles.')
                        .setColor(0xff0000)
                        .setTimestamp();

                    return interaction.reply({ embeds: [botHierarchyEmbed], ephemeral: true });
                }
            }

            await interaction.deferReply({ ephemeral: silent });

            // Intentar enviar mensaje privado al usuario antes del baneo
            let dmSent = false;
            if (targetMember) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🔨 Has sido baneado')
                        .setDescription(`Has sido baneado del servidor **${interaction.guild.name}**.`)
                        .addFields([
                            { name: '📋 Razón', value: reason, inline: false },
                            { name: '👨‍💼 Moderador', value: interaction.user.username, inline: true },
                            { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true }
                        ])
                        .setColor(0xff0000)
                        .setTimestamp()
                        .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                    await targetUser.send({ embeds: [dmEmbed] });
                    dmSent = true;
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
                }
            }

            // Ejecutar el baneo
            await interaction.guild.members.ban(finalUserId, {
                deleteMessageDays: deleteMessageDays,
                reason: `${reason} | Moderador: ${interaction.user.username} (${interaction.user.id})`
            });

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('🔨 Usuario Baneado')
                .setDescription(`${finalTargetUser} ha sido baneado exitosamente del servidor.`)
                .addFields([
                    { name: '👤 Usuario', value: `${finalTargetUser.username} (${finalTargetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: finalUserId, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🗑️ Mensajes eliminados', value: `${deleteMessageDays} días`, inline: true },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true },
                    { name: '📅 Fecha', value: new Date().toLocaleString('es-ES'), inline: true }
                ])
                .setColor(0xff0000)
                .setThumbnail(finalTargetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Ban de usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        deleteMessageDays: deleteMessageDays,
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.red(`🔨 ${targetUser.username} baneado de ${interaction.guild.name} por ${interaction.user.username}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando ban:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Banear')
                .setDescription('Ocurrió un error al intentar banear al usuario.')
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
                    action: `Error en ban de usuario: ${targetUser.username}`,
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
