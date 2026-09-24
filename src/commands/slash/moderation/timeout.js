import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import chalk from 'chalk';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('⏰ Aplicar timeout a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('Usuario a aplicar timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duracion')
                .setDescription('Duración en minutos (1-40320 = 28 días)')
                .setMinValue(1)
                .setMaxValue(40320)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setDescription('Razón del timeout')
                .setMaxLength(512))
        .addBooleanOption(option =>
            option.setName('silencioso')
                .setDescription('No enviar mensaje de confirmación público')),

    async execute(interaction) {
        // Verificar permisos de moderación
        if (!interaction.client.validateModerationPermissions(interaction, 'timeout')) {
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
        const duration = interaction.options.getInteger('duracion');
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
                const selfTimeoutEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes aplicarte timeout a ti mismo.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [selfTimeoutEmbed], ephemeral: true });
            }

            if (targetUser.id === interaction.client.user.id) {
                const botTimeoutEmbed = new EmbedBuilder()
                    .setTitle('❌ Acción No Permitida')
                    .setDescription('No puedes aplicar timeout al bot.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [botTimeoutEmbed], ephemeral: true });
            }

            // Verificar jerarquía de roles
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                const hierarchyEmbed = new EmbedBuilder()
                    .setTitle('❌ Jerarquía Insuficiente')
                    .setDescription('No puedes aplicar timeout a un usuario con un rol igual o superior al tuyo.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [hierarchyEmbed], ephemeral: true });
            }

            if (targetMember.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                const botHierarchyEmbed = new EmbedBuilder()
                    .setTitle('❌ Bot Sin Jerarquía')
                    .setDescription('El bot no puede aplicar timeout a este usuario debido a la jerarquía de roles.')
                    .setColor(0xff0000)
                    .setTimestamp();

                return interaction.reply({ embeds: [botHierarchyEmbed], ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: silent });

            // Calcular tiempo de timeout
            const timeoutDuration = duration * 60 * 1000; // Convertir minutos a milisegundos
            const timeoutUntil = new Date(Date.now() + timeoutDuration);

            // Intentar enviar mensaje privado al usuario
            let dmSent = false;
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('⏰ Has recibido un timeout')
                    .setDescription(`Has recibido un timeout en el servidor **${interaction.guild.name}**.`)
                    .addFields([
                        { name: '📋 Razón', value: reason, inline: false },
                        { name: '⏰ Duración', value: `${duration} minutos`, inline: true },
                        { name: '📅 Hasta', value: timeoutUntil.toLocaleString('es-ES'), inline: true },
                        { name: '👨‍💼 Moderador', value: interaction.user.username, inline: true }
                    ])
                    .setColor(0xffa500)
                    .setTimestamp()
                    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() });

                await targetUser.send({ embeds: [dmEmbed] });
                dmSent = true;
            } catch (error) {
                console.log(chalk.yellow(`⚠️ No se pudo enviar DM a ${targetUser.username}`));
            }

            // Aplicar timeout
            await targetMember.timeout(timeoutDuration, `${reason} | Moderador: ${interaction.user.username} (${interaction.user.id})`);

            // Crear embed de confirmación
            const successEmbed = new EmbedBuilder()
                .setTitle('⏰ Timeout Aplicado')
                .setDescription(`${targetUser} ha recibido un timeout exitosamente.`)
                .addFields([
                    { name: '👤 Usuario', value: `${targetUser.username} (${targetUser.tag})`, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '👨‍💼 Moderador', value: `${interaction.user} (${interaction.user.username})`, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '⏰ Duración', value: `${duration} minutos`, inline: true },
                    { name: '📅 Hasta', value: timeoutUntil.toLocaleString('es-ES'), inline: true },
                    { name: '💬 DM enviado', value: dmSent ? '✅ Sí' : '❌ No', inline: true }
                ])
                .setColor(0xffa500)
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: `Acción realizada por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [successEmbed] });

            // Registrar la acción en logs
            if (interaction.client.logModerationAction) {
                interaction.client.logModerationAction({
                    action: `Timeout aplicado a usuario: ${targetUser.username}`,
                    user: interaction.user,
                    guild: interaction.guild,
                    details: {
                        targetUser: {
                            id: targetUser.id,
                            username: targetUser.username,
                            tag: targetUser.tag
                        },
                        reason: reason,
                        duration: duration,
                        timeoutUntil: timeoutUntil.toISOString(),
                        dmSent: dmSent
                    },
                    success: true
                });
            }

            // Log en consola
            console.log(chalk.yellow(`⏰ ${targetUser.username} recibió timeout de ${duration}min en ${interaction.guild.name} por ${interaction.user.username}`));

        } catch (error) {
            console.error(chalk.red('❌ Error ejecutando timeout:'), error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error al Aplicar Timeout')
                .setDescription('Ocurrió un error al intentar aplicar timeout al usuario.')
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
                    action: `Error en timeout de usuario: ${targetUser.username}`,
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
