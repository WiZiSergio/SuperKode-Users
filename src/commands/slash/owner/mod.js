import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import chalk from 'chalk';
import { isOwner } from '../../../structure/config/configowner/owner.js';
import { loadConfig } from '../../../structure/loadfolders.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('🛡️ Gestión de moderadores y roles de moderación')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-user')
                .setDescription('➕ Añadir usuario como moderador')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a añadir como moderador')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-user')
                .setDescription('➖ Quitar usuario de moderadores')
                .addUserOption(option =>
                    option.setName('usuario')
                        .setDescription('Usuario a quitar de moderadores')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add-role')
                .setDescription('➕ Añadir rol de moderación')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol a añadir como moderador')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove-role')
                .setDescription('➖ Quitar rol de moderación')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Rol a quitar de moderación')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 Ver lista de moderadores y roles')),

    async execute(interaction) {
        const config = loadConfig();

        if (!isOwner(interaction.user.id, config.clientId)) {
            const noPermEmbed = new EmbedBuilder()
                .setTitle('❌ Sin Permisos')
                .setDescription('Solo los propietarios del bot pueden usar este comando.')
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [noPermEmbed], ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const dbManager = interaction.client.dbManager;

        // Crear base de datos si no existe
        dbManager.createDatabase('mod', {
            users: [],
            roles: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });

        try {
            switch (subcommand) {
                case 'add-user':
                    await this.handleAddUser(interaction, dbManager);
                    break;
                case 'remove-user':
                    await this.handleRemoveUser(interaction, dbManager);
                    break;
                case 'add-role':
                    await this.handleAddRole(interaction, dbManager);
                    break;
                case 'remove-role':
                    await this.handleRemoveRole(interaction, dbManager);
                    break;
                case 'list':
                    await this.handleList(interaction, dbManager);
                    break;
                default:
                    throw new Error(`Subcomando no reconocido: ${subcommand}`);
            }
        } catch (error) {
            console.error(chalk.red('❌ Error en comando mod:'), error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error')
                .setDescription('Ocurrió un error al ejecutar el comando.')
                .setColor(0xff0000)
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },

    /**
     * Maneja la adición de un usuario como moderador
     */
    async handleAddUser(interaction, dbManager) {
        await interaction.deferReply();

        const user = interaction.options.getUser('usuario');
        const modData = dbManager.getAllRecords('mod')[0] || { users: [], roles: [] };

        // Verificar si el usuario ya es moderador
        const existingUser = modData.users.find(u => u.id === user.id);
        if (existingUser) {
            const alreadyModEmbed = new EmbedBuilder()
                .setTitle('⚠️ Usuario ya es Moderador')
                .setDescription(`${user} ya está en la lista de moderadores.`)
                .addFields([
                    { name: '📅 Añadido', value: existingUser.addedAt, inline: true },
                    { name: '👤 Añadido por', value: `<@${existingUser.addedBy}>`, inline: true }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            return interaction.editReply({ embeds: [alreadyModEmbed] });
        }

        // Añadir usuario
        const newUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            tag: user.tag,
            addedAt: new Date().toLocaleString('es-ES'),
            addedBy: interaction.user.id,
            addedByUsername: interaction.user.username
        };

        modData.users.push(newUser);
        modData.lastUpdated = new Date().toISOString();

        // Guardar en base de datos
        dbManager.writeDatabase('mod', [modData]);

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Usuario Añadido como Moderador')
            .setDescription(`${user} ha sido añadido exitosamente a la lista de moderadores.`)
            .addFields([
                { name: '👤 Usuario', value: `${user.displayName || user.username} (${user.tag})`, inline: true },
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Añadido', value: newUser.addedAt, inline: true },
                { name: '👨‍💼 Añadido por', value: interaction.user.username, inline: true },
                { name: '📊 Total Moderadores', value: `${modData.users.length} usuarios`, inline: true }
            ])
            .setColor(0x00ff00)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        // Log de la acción
        console.log(chalk.green(`✅ Usuario ${user.username} añadido como moderador por ${interaction.user.username}`));
    },

    /**
     * Maneja la eliminación de un usuario de moderadores
     */
    async handleRemoveUser(interaction, dbManager) {
        await interaction.deferReply();

        const user = interaction.options.getUser('usuario');
        const modData = dbManager.getAllRecords('mod')[0] || { users: [], roles: [] };

        // Verificar si el usuario es moderador
        const userIndex = modData.users.findIndex(u => u.id === user.id);
        if (userIndex === -1) {
            const notModEmbed = new EmbedBuilder()
                .setTitle('⚠️ Usuario no es Moderador')
                .setDescription(`${user} no está en la lista de moderadores.`)
                .setColor(0xffa500)
                .setTimestamp();

            return interaction.editReply({ embeds: [notModEmbed] });
        }

        // Remover usuario
        const removedUser = modData.users.splice(userIndex, 1)[0];
        modData.lastUpdated = new Date().toISOString();

        // Guardar en base de datos
        dbManager.writeDatabase('mod', [modData]);

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Usuario Removido de Moderadores')
            .setDescription(`${user} ha sido removido exitosamente de la lista de moderadores.`)
            .addFields([
                { name: '👤 Usuario', value: `${user.displayName || user.username} (${user.tag})`, inline: true },
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Era moderador desde', value: removedUser.addedAt, inline: true },
                { name: '👨‍💼 Removido por', value: interaction.user.username, inline: true },
                { name: '📊 Total Moderadores', value: `${modData.users.length} usuarios`, inline: true }
            ])
            .setColor(0xff6b6b)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        // Log de la acción
        console.log(chalk.yellow(`➖ Usuario ${user.username} removido de moderadores por ${interaction.user.username}`));
    },

    /**
     * Maneja la adición de un rol de moderación
     */
    async handleAddRole(interaction, dbManager) {
        await interaction.deferReply();

        const role = interaction.options.getRole('rol');
        const modData = dbManager.getAllRecords('mod')[0] || { users: [], roles: [] };

        // Verificar si el rol ya es de moderación
        const existingRole = modData.roles.find(r => r.id === role.id);
        if (existingRole) {
            const alreadyModEmbed = new EmbedBuilder()
                .setTitle('⚠️ Rol ya es de Moderación')
                .setDescription(`${role} ya está en la lista de roles de moderación.`)
                .addFields([
                    { name: '📅 Añadido', value: existingRole.addedAt, inline: true },
                    { name: '👤 Añadido por', value: `<@${existingRole.addedBy}>`, inline: true }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            return interaction.editReply({ embeds: [alreadyModEmbed] });
        }

        // Añadir rol
        const newRole = {
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position,
            memberCount: role.members.size,
            addedAt: new Date().toLocaleString('es-ES'),
            addedBy: interaction.user.id,
            addedByUsername: interaction.user.username
        };

        modData.roles.push(newRole);
        modData.lastUpdated = new Date().toISOString();

        // Guardar en base de datos
        dbManager.writeDatabase('mod', [modData]);

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Rol Añadido como Moderación')
            .setDescription(`${role} ha sido añadido exitosamente a los roles de moderación.`)
            .addFields([
                { name: '🎭 Rol', value: role.name, inline: true },
                { name: '🆔 ID', value: role.id, inline: true },
                { name: '🎨 Color', value: role.hexColor || '#000000', inline: true },
                { name: '👥 Miembros', value: `${role.members.size} usuarios`, inline: true },
                { name: '📅 Añadido', value: newRole.addedAt, inline: true },
                { name: '👨‍💼 Añadido por', value: interaction.user.username, inline: true },
                { name: '📊 Total Roles', value: `${modData.roles.length} roles`, inline: true }
            ])
            .setColor(role.color || 0x00ff00)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        // Log de la acción
        console.log(chalk.green(`✅ Rol ${role.name} añadido como moderación por ${interaction.user.username}`));
    },

    /**
     * Maneja la eliminación de un rol de moderación
     */
    async handleRemoveRole(interaction, dbManager) {
        await interaction.deferReply();

        const role = interaction.options.getRole('rol');
        const modData = dbManager.getAllRecords('mod')[0] || { users: [], roles: [] };

        // Verificar si el rol es de moderación
        const roleIndex = modData.roles.findIndex(r => r.id === role.id);
        if (roleIndex === -1) {
            const notModEmbed = new EmbedBuilder()
                .setTitle('⚠️ Rol no es de Moderación')
                .setDescription(`${role} no está en la lista de roles de moderación.`)
                .setColor(0xffa500)
                .setTimestamp();

            return interaction.editReply({ embeds: [notModEmbed] });
        }

        // Remover rol
        const removedRole = modData.roles.splice(roleIndex, 1)[0];
        modData.lastUpdated = new Date().toISOString();

        // Guardar en base de datos
        dbManager.writeDatabase('mod', [modData]);

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Rol Removido de Moderación')
            .setDescription(`${role} ha sido removido exitosamente de los roles de moderación.`)
            .addFields([
                { name: '🎭 Rol', value: role.name, inline: true },
                { name: '🆔 ID', value: role.id, inline: true },
                { name: '🎨 Color', value: role.hexColor || '#000000', inline: true },
                { name: '👥 Miembros', value: `${role.members.size} usuarios`, inline: true },
                { name: '📅 Era moderación desde', value: removedRole.addedAt, inline: true },
                { name: '👨‍💼 Removido por', value: interaction.user.username, inline: true },
                { name: '📊 Total Roles', value: `${modData.roles.length} roles`, inline: true }
            ])
            .setColor(role.color || 0xff6b6b)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        // Log de la acción
        console.log(chalk.yellow(`➖ Rol ${role.name} removido de moderación por ${interaction.user.username}`));
    },

    /**
     * Maneja la visualización de la lista de moderadores y roles
     */
    async handleList(interaction, dbManager) {
        await interaction.deferReply();

        const modData = dbManager.getAllRecords('mod')[0] || { users: [], roles: [] };

        // Crear embed principal
        const listEmbed = new EmbedBuilder()
            .setTitle('📋 Lista de Moderadores y Roles')
            .setDescription('Lista completa de usuarios y roles con permisos de moderación.')
            .setColor(0x0099ff)
            .setTimestamp();

        // Añadir información de usuarios moderadores
        if (modData.users && modData.users.length > 0) {
            const usersList = modData.users.map((user, index) => {
                return `**${index + 1}.** <@${user.id}> (${user.username})\n` +
                       `   └ 📅 Desde: ${user.addedAt}`;
            }).join('\n\n');

            listEmbed.addFields([
                {
                    name: `👥 Usuarios Moderadores (${modData.users.length})`,
                    value: usersList.length > 1024 ? usersList.substring(0, 1021) + '...' : usersList,
                    inline: false
                }
            ]);
        } else {
            listEmbed.addFields([
                {
                    name: '👥 Usuarios Moderadores (0)',
                    value: '```\nNo hay usuarios moderadores configurados.\n```',
                    inline: false
                }
            ]);
        }

        // Añadir información de roles de moderación
        if (modData.roles && modData.roles.length > 0) {
            const rolesList = modData.roles.map((role, index) => {
                return `**${index + 1}.** <@&${role.id}> (${role.name})\n` +
                       `   └ 👥 ${role.memberCount} miembros | 📅 Desde: ${role.addedAt}`;
            }).join('\n\n');

            listEmbed.addFields([
                {
                    name: `🎭 Roles de Moderación (${modData.roles.length})`,
                    value: rolesList.length > 1024 ? rolesList.substring(0, 1021) + '...' : rolesList,
                    inline: false
                }
            ]);
        } else {
            listEmbed.addFields([
                {
                    name: '🎭 Roles de Moderación (0)',
                    value: '```\nNo hay roles de moderación configurados.\n```',
                    inline: false
                }
            ]);
        }

        // Añadir información adicional
        const totalMods = (modData.users?.length || 0) + (modData.roles?.length || 0);
        listEmbed.addFields([
            {
                name: '📊 Estadísticas',
                value: `**Total de moderadores:** ${totalMods}\n` +
                       `**Usuarios:** ${modData.users?.length || 0}\n` +
                       `**Roles:** ${modData.roles?.length || 0}\n` +
                       `**Última actualización:** ${modData.lastUpdated ? new Date(modData.lastUpdated).toLocaleString('es-ES') : 'N/A'}`,
                inline: false
            }
        ]);

        // Añadir footer con información del servidor
        listEmbed.setFooter({
            text: `Servidor: ${interaction.guild.name} | Solicitado por: ${interaction.user.username}`,
            iconURL: interaction.guild.iconURL() || undefined
        });

        await interaction.editReply({ embeds: [listEmbed] });

        // Log de la acción
        console.log(chalk.cyan(`📋 Lista de moderadores consultada por ${interaction.user.username}`));
    }
};
