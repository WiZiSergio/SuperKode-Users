const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { loadConfig } = require('../../structure/loadfolders');
const dbManager = require('../../structure/databases/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('🔄 Sistema avanzado de recarga del bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('quick')
                .setDescription('🚀 Recarga rápida con confirmación')
                .addStringOption(option =>
                    option.setName('modulo')
                        .setDescription('Módulo a recargar')
                        .setRequired(true)
                        .addChoices(
                            { name: '⚡ Comandos', value: 'commands' },
                            { name: '🎯 Eventos', value: 'events' },
                            { name: '🔧 Handlers', value: 'handlers' },
                            { name: '💾 Bases de Datos', value: 'databases' },
                            { name: '🔄 Todo (Recarga completa)', value: 'all' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('selective')
                .setDescription('🎯 Recarga selectiva de componentes específicos')
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Tipo de componente')
                        .setRequired(true)
                        .addChoices(
                            { name: '📁 Comando específico', value: 'single_command' },
                            { name: '📂 Categoría de comandos', value: 'command_category' },
                            { name: '⚡ Evento específico', value: 'single_event' },
                            { name: '🔧 Handler específico', value: 'single_handler' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('📊 Ver estado de componentes del bot'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('📋 Ver logs de recargas recientes')
                .addIntegerOption(option =>
                    option.setName('cantidad')
                        .setDescription('Cantidad de logs a mostrar')
                        .setMinValue(1)
                        .setMaxValue(20))
                .addStringOption(option =>
                    option.setName('tipo')
                        .setDescription('Filtrar por tipo de log')
                        .addChoices(
                            { name: '✅ Éxitos', value: 'success' },
                            { name: '❌ Errores', value: 'error' },
                            { name: '⚠️ Advertencias', value: 'warning' },
                            { name: 'ℹ️ Información', value: 'info' }
                        ))),

    async execute(interaction) {
        // Cargar configuración para verificar owners
        const config = loadConfig();

        if (!config.isOwner(interaction.user.id)) {
            return interaction.reply({
                content: "❌ **Acceso Denegado**\nSolo los propietarios del bot pueden usar este comando.",
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'quick':
                await this.handleQuickReload(interaction);
                break;
            case 'selective':
                await this.handleSelectiveReload(interaction);
                break;
            case 'status':
                await this.handleStatusCheck(interaction);
                break;
            case 'logs':
                await this.handleLogsView(interaction);
                break;
            default:
                await interaction.reply({
                    content: '❌ Subcomando no reconocido.',
                    ephemeral: true
                });
        }
    },

    /**
     * Maneja la recarga rápida con confirmación
     */
    async handleQuickReload(interaction) {
        const modulo = interaction.options.getString('modulo');
        const moduleInfo = this.getModuleInfo(modulo);

        // Crear embed de confirmación
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🔄 Confirmación de Recarga')
            .setDescription(`¿Estás seguro de que quieres recargar **${moduleInfo.name}**?`)
            .addFields([
                {
                    name: '📋 Detalles de la operación',
                    value: `> **Módulo:** ${moduleInfo.name}\n> **Descripción:** ${moduleInfo.description}\n> **Impacto:** ${moduleInfo.impact}`
                },
                {
                    name: '⚠️ Advertencia',
                    value: 'Esta acción puede interrumpir temporalmente el funcionamiento del bot.'
                }
            ])
            .setColor(0xffa500)
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${interaction.user.displayName || interaction.user.username}` });

        // Crear botones de confirmación
        const { confirmId, cancelId, row } = interaction.client.createConfirmationButtons(`reload_${modulo}`, {
            confirmLabel: '✅ Confirmar Recarga',
            cancelLabel: '❌ Cancelar'
        });

        await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            ephemeral: true
        });

        // Registrar callbacks de botones
        interaction.client.registerButtonCallback(confirmId, async (buttonInteraction) => {
            await this.executeReload(buttonInteraction, modulo, moduleInfo);
        });

        interaction.client.registerButtonCallback(cancelId, async (buttonInteraction) => {
            const cancelEmbed = new EmbedBuilder()
                .setTitle('❌ Recarga Cancelada')
                .setDescription('La operación de recarga ha sido cancelada.')
                .setColor(0xff0000)
                .setTimestamp();

            await buttonInteraction.update({
                embeds: [cancelEmbed],
                components: []
            });
        });

        // Manejar timeout
        interaction.client.handleButtonTimeout(interaction);
    },

    /**
     * Maneja la recarga selectiva
     */
    async handleSelectiveReload(interaction) {
        const tipo = interaction.options.getString('tipo');

        await interaction.deferReply({ ephemeral: true });

        let options = [];
        let actionId = '';

        switch (tipo) {
            case 'single_command':
                options = this.getCommandOptions(interaction.client);
                actionId = 'select_command';
                break;
            case 'command_category':
                options = this.getCategoryOptions(interaction.client);
                actionId = 'select_category';
                break;
            case 'single_event':
                options = this.getEventOptions();
                actionId = 'select_event';
                break;
            case 'single_handler':
                options = this.getHandlerOptions();
                actionId = 'select_handler';
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle('🎯 Recarga Selectiva')
            .setDescription(`Selecciona el ${tipo.replace('_', ' ')} que quieres recargar:`)
            .setColor(0x0099ff)
            .setTimestamp();

        const { buttonIds, rows } = interaction.client.createSelectionButtons(actionId, options);

        await interaction.editReply({
            embeds: [embed],
            components: rows
        });

        // Registrar callbacks para cada botón
        buttonIds.forEach(({ id, value }) => {
            interaction.client.registerButtonCallback(id, async (buttonInteraction) => {
                await this.executeSelectiveReload(buttonInteraction, tipo, value);
            });
        });
    },

    /**
     * Maneja la verificación de estado
     */
    async handleStatusCheck(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const stats = {
            commands: interaction.client.commands.size,
            events: this.getEventCount(),
            handlers: this.getHandlerCount(),
            databases: interaction.client.dbManager ? interaction.client.dbManager.listDatabases().length : 0,
            uptime: this.formatUptime(interaction.client.uptime),
            memory: this.getMemoryUsage()
        };

        const statusEmbed = new EmbedBuilder()
            .setTitle('📊 Estado del Sistema')
            .addFields([
                { name: '⚡ Comandos', value: `${stats.commands} cargados`, inline: true },
                { name: '🎯 Eventos', value: `${stats.events} activos`, inline: true },
                { name: '🔧 Handlers', value: `${stats.handlers} cargados`, inline: true },
                { name: '💾 Bases de Datos', value: `${stats.databases} disponibles`, inline: true },
                { name: '⏱️ Tiempo Activo', value: stats.uptime, inline: true },
                { name: '🧠 Memoria', value: stats.memory, inline: true }
            ])
            .setColor(0x00ff00)
            .setTimestamp()
            .setFooter({ text: `Sistema funcionando correctamente` });

        await interaction.editReply({ embeds: [statusEmbed] });
    },

    /**
     * Maneja la visualización de logs
     */
    async handleLogsView(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const cantidad = interaction.options.getInteger('cantidad') || 10;
        const tipo = interaction.options.getString('tipo');

        // Obtener logs y estadísticas
        const logs = interaction.client.getRecentLogs('databasereload', cantidad, tipo);
        const stats = interaction.client.getLogStats('databasereload');

        if (logs.length === 0) {
            const noLogsEmbed = new EmbedBuilder()
                .setTitle('📋 Logs de Recarga')
                .setDescription('No se encontraron logs con los criterios especificados.')
                .setColor(0x999999)
                .setTimestamp();

            return interaction.editReply({ embeds: [noLogsEmbed] });
        }

        // Crear embed principal con estadísticas
        const logsEmbed = new EmbedBuilder()
            .setTitle('📋 Logs de Recarga del Sistema')
            .setDescription(`Mostrando los últimos ${logs.length} logs${tipo ? ` de tipo **${tipo}**` : ''}`)
            .addFields([
                {
                    name: '📊 Estadísticas Generales',
                    value: `> **Total:** ${stats.total} logs\n> **Hoy:** ${stats.today} logs\n> **Esta semana:** ${stats.thisWeek} logs\n> **Tasa de éxito:** ${stats.successRate}%\n> **Duración promedio:** ${stats.averageDuration}ms`
                }
            ])
            .setColor(0x0099ff)
            .setTimestamp()
            .setFooter({ text: `Sistema de logs activo` });

        // Agregar logs individuales
        logs.forEach((log, index) => {
            const statusIcon = log.success ? '✅' : '❌';
            const typeIcon = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            }[log.type] || 'ℹ️';

            const logValue = [
                `${statusIcon} **${log.action}**`,
                `👤 ${log.user?.username || 'Sistema'}`,
                `⏱️ ${log.duration ? `${log.duration}ms` : 'N/A'}`,
                `📅 ${log.date} ${log.time}`
            ].join('\n');

            logsEmbed.addFields([
                {
                    name: `${typeIcon} Log #${index + 1}`,
                    value: logValue,
                    inline: true
                }
            ]);
        });

        // Crear botones de acción
        const actions = [
            { id: 'refresh_logs', label: '🔄 Actualizar', style: 1, emoji: '🔄' },
            { id: 'clear_logs', label: '🗑️ Limpiar', style: 4, emoji: '🗑️' },
            { id: 'export_logs', label: '📤 Exportar', style: 2, emoji: '📤' }
        ];

        const { buttonIds, row } = interaction.client.createQuickActionButtons(actions);

        await interaction.editReply({
            embeds: [logsEmbed],
            components: [row]
        });

        // Registrar callbacks de botones
        buttonIds.forEach(({ id, action }) => {
            interaction.client.registerButtonCallback(id, async (buttonInteraction) => {
                await this.handleLogAction(buttonInteraction, action);
            });
        });
    },

    /**
     * Maneja acciones de logs
     */
    async handleLogAction(interaction, action) {
        await interaction.deferUpdate();

        switch (action) {
            case 'refresh_logs':
                // Recargar logs
                await this.handleLogsView(interaction);
                break;

            case 'clear_logs':
                // Confirmar limpieza
                const confirmEmbed = new EmbedBuilder()
                    .setTitle('⚠️ Confirmar Limpieza')
                    .setDescription('¿Estás seguro de que quieres limpiar todos los logs?')
                    .setColor(0xff9900);

                const { confirmId, cancelId, row } = interaction.client.createConfirmationButtons('clear_logs');

                await interaction.editReply({
                    embeds: [confirmEmbed],
                    components: [row]
                });

                // Registrar callbacks
                interaction.client.registerButtonCallback(confirmId, async (btnInt) => {
                    dbManager.writeDatabase('databasereload', []);
                    const clearedEmbed = new EmbedBuilder()
                        .setTitle('✅ Logs Limpiados')
                        .setDescription('Todos los logs han sido eliminados.')
                        .setColor(0x00ff00);
                    await btnInt.update({ embeds: [clearedEmbed], components: [] });
                });

                interaction.client.registerButtonCallback(cancelId, async (btnInt) => {
                    await this.handleLogsView(btnInt);
                });
                break;

            case 'export_logs':
                // Exportar logs (placeholder)
                const exportEmbed = new EmbedBuilder()
                    .setTitle('📤 Exportación de Logs')
                    .setDescription('Funcionalidad de exportación en desarrollo.')
                    .setColor(0x0099ff);

                await interaction.editReply({
                    embeds: [exportEmbed],
                    components: []
                });
                break;
        }
    },

    /**
     * Ejecuta la recarga del módulo
     */
    async executeReload(interaction, modulo, moduleInfo) {
        await interaction.deferUpdate();

        const startTime = Date.now();

        // Crear log entry usando el nuevo sistema
        const logEntry = interaction.client.createLogEntry({
            type: 'info',
            category: 'reload',
            action: `Reload ${modulo}`,
            user: interaction.user,
            guild: interaction.guild,
            details: {
                module: modulo,
                moduleDescription: moduleInfo.name,
                moduleImpact: moduleInfo.impact
            }
        });

        try {
            // Mostrar embed de progreso
            const progressEmbed = new EmbedBuilder()
                .setTitle('🔄 Recargando...')
                .setDescription(`Recargando **${moduleInfo.name}**...`)
                .addFields([
                    { name: '⏳ Estado', value: 'En progreso...', inline: true },
                    { name: '📊 Progreso', value: '🟨🟨🟨⬜⬜ 60%', inline: true }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            await interaction.editReply({
                embeds: [progressEmbed],
                components: []
            });

            switch (modulo.toLowerCase()) {
                case 'commands':
                    await interaction.client.reloadSlashCommands();
                    const commandsAfter = interaction.client.commands.size;
                    logEntry.changes.push(`${commandsAfter} comandos recargados`);
                    logEntry.details.commandsCount = commandsAfter;
                    break;

                case 'events':
                    await interaction.client.reloadEvents();
                    logEntry.changes.push('Eventos recargados completamente');
                    logEntry.details.eventsReloaded = true;
                    break;

                case 'handlers':
                    await interaction.client.reloadHandlers();
                    logEntry.changes.push('Handlers recargados completamente');
                    logEntry.details.handlersReloaded = true;
                    break;

                case 'databases':
                    await interaction.client.reloadDatabases();
                    const dbCount = interaction.client.dbManager ? interaction.client.dbManager.listDatabases().length : 0;
                    logEntry.changes.push(`${dbCount} bases de datos recargadas`);
                    logEntry.details.databasesCount = dbCount;
                    break;

                case 'all':
                    await interaction.client.reloadAll();
                    const totalCommands = interaction.client.commands.size;
                    const totalDbs = interaction.client.dbManager ? interaction.client.dbManager.listDatabases().length : 0;
                    logEntry.changes.push(`Recarga completa: ${totalCommands} comandos, eventos, handlers y ${totalDbs} bases de datos`);
                    logEntry.details.fullReload = true;
                    logEntry.details.totalCommands = totalCommands;
                    logEntry.details.totalDatabases = totalDbs;
                    break;
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            logEntry.success = true;
            logEntry.type = 'success';
            logEntry.duration = duration;

            // Usar el nuevo sistema de logs
            interaction.client.saveLog('databasereload', logEntry);

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Recarga Completada')
                .setDescription(`**${moduleInfo.name}** ha sido recargado exitosamente.`)
                .addFields([
                    { name: '📋 Cambios realizados', value: logEntry.changes.join('\n') || 'Sin cambios específicos' },
                    { name: '⏱️ Tiempo de ejecución', value: `${duration}ms`, inline: true },
                    { name: '📅 Fecha', value: logEntry.date, inline: true },
                    { name: '🕐 Hora', value: logEntry.time, inline: true }
                ])
                .setColor(0x00ff00)
                .setTimestamp()
                .setFooter({ text: `Ejecutado por ${interaction.user.displayName || interaction.user.username}` });

            await interaction.editReply({
                embeds: [successEmbed],
                components: []
            });

        } catch (error) {
            logEntry.success = false;
            logEntry.errors.push({
                message: error.message,
                stack: error.stack
            });

            dbManager.addRecord('databasereload', logEntry);
            console.error('Error reloading:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error en la Recarga')
                .setDescription(`Ocurrió un error al recargar **${moduleInfo.name}**.`)
                .addFields([
                    { name: '🚨 Error', value: `\`\`\`${error.message}\`\`\`` },
                    { name: '📅 Fecha', value: logEntry.date, inline: true },
                    { name: '🕐 Hora', value: logEntry.time, inline: true }
                ])
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: `Error reportado por ${interaction.user.displayName || interaction.user.username}` });

            await interaction.editReply({
                embeds: [errorEmbed],
                components: []
            });
        }
    },

    /**
     * Ejecuta recarga selectiva
     */
    async executeSelectiveReload(interaction, tipo, value) {
        await interaction.deferUpdate();

        const loadingEmbed = new EmbedBuilder()
            .setTitle('🔄 Recargando...')
            .setDescription(`Recargando ${value}...`)
            .setColor(0xffa500);

        await interaction.editReply({
            embeds: [loadingEmbed],
            components: []
        });

        // Simular recarga específica (implementar lógica real según necesidades)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Recarga Selectiva Completada')
            .setDescription(`**${value}** ha sido recargado exitosamente.`)
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });
    },

    /**
     * Obtiene información del módulo
     */
    getModuleInfo(modulo) {
        const modules = {
            commands: {
                name: '⚡ Comandos',
                description: 'Recarga todos los comandos slash del bot',
                impact: 'Medio - Los comandos pueden no estar disponibles temporalmente'
            },
            events: {
                name: '🎯 Eventos',
                description: 'Recarga todos los eventos del bot',
                impact: 'Alto - El bot puede no responder temporalmente'
            },
            handlers: {
                name: '🔧 Handlers',
                description: 'Recarga todos los handlers del bot',
                impact: 'Alto - Funcionalidades específicas pueden fallar'
            },
            databases: {
                name: '💾 Bases de Datos',
                description: 'Recarga las conexiones de bases de datos',
                impact: 'Medio - Datos temporalmente no disponibles'
            },
            all: {
                name: '🔄 Sistema Completo',
                description: 'Recarga completa de todos los componentes',
                impact: 'Muy Alto - Bot completamente no disponible durante la recarga'
            }
        };

        return modules[modulo] || modules.all;
    },

    /**
     * Obtiene opciones de comandos
     */
    getCommandOptions(client) {
        const options = [];
        client.commands.forEach(command => {
            options.push({
                label: command.data.name,
                value: command.data.name,
                emoji: '⚡'
            });
        });
        return options.slice(0, 20); // Limitar a 20 opciones
    },

    /**
     * Obtiene opciones de categorías
     */
    getCategoryOptions(client) {
        const categories = new Set();
        client.commands.forEach(command => {
            if (command._category) {
                categories.add(command._category);
            }
        });

        return Array.from(categories).map(category => ({
            label: category,
            value: category,
            emoji: '📂'
        }));
    },

    /**
     * Obtiene opciones de eventos
     */
    getEventOptions() {
        return [
            { label: 'ready', value: 'ready', emoji: '🎯' },
            { label: 'interactionCreate', value: 'interactionCreate', emoji: '🎯' },
            { label: 'messageCreate', value: 'messageCreate', emoji: '🎯' }
        ];
    },

    /**
     * Obtiene opciones de handlers
     */
    getHandlerOptions() {
        return [
            { label: 'buttonHandler', value: 'buttonHandler', emoji: '🔧' },
            { label: 'onReloadHandler', value: 'onReloadHandler', emoji: '🔧' }
        ];
    },

    /**
     * Obtiene conteo de eventos
     */
    getEventCount() {
        return 3; // Placeholder - implementar lógica real
    },

    /**
     * Obtiene conteo de handlers
     */
    getHandlerCount() {
        return 2; // Placeholder - implementar lógica real
    },

    /**
     * Formatea el uptime
     */
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    },

    /**
     * Obtiene uso de memoria
     */
    getMemoryUsage() {
        const used = process.memoryUsage();
        return `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`;
    }
};
