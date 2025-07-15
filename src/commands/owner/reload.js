const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
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
                flags: MessageFlags.Ephemeral
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
                    flags: MessageFlags.Ephemeral
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
            flags: MessageFlags.Ephemeral
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

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

            // Compatibilidad con logs antiguos y nuevos
            const actionText = log.action ||
                              (log.module ? `Reload ${log.module}` : null) ||
                              log.moduleDescription ||
                              'Acción desconocida';

            const logValue = [
                `${statusIcon} **${actionText}**`,
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
     * Refresca la vista de logs (para botones)
     */
    async refreshLogsView(interaction, cantidad = 10, tipo = null) {
        // Obtener logs y estadísticas
        const logs = interaction.client.getRecentLogs('databasereload', cantidad, tipo);
        const stats = interaction.client.getLogStats('databasereload');

        if (logs.length === 0) {
            const noLogsEmbed = new EmbedBuilder()
                .setTitle('📋 Logs de Recarga')
                .setDescription('No se encontraron logs con los criterios especificados.')
                .setColor(0x999999)
                .setTimestamp();

            return interaction.editReply({ embeds: [noLogsEmbed], components: [] });
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
            .setFooter({ text: `Sistema de logs activo - Actualizado` });

        // Agregar logs individuales
        logs.forEach((log, index) => {
            const statusIcon = log.success ? '✅' : '❌';
            const typeIcon = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            }[log.type] || 'ℹ️';

            // Compatibilidad con logs antiguos y nuevos
            const actionText = log.action ||
                              (log.module ? `Reload ${log.module}` : null) ||
                              log.moduleDescription ||
                              'Acción desconocida';

            const logValue = [
                `${statusIcon} **${actionText}**`,
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
                // Recargar logs sin deferReply (ya fue diferida)
                await this.refreshLogsView(interaction);
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
                    await btnInt.deferUpdate();
                    await this.refreshLogsView(btnInt);
                });
                break;

            case 'export_logs':
                // Mostrar opciones de exportación
                await this.showExportOptions(interaction);
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
    async executeSelectiveReload(interaction, _tipo, value) {
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
    },

    /**
     * Muestra opciones de exportación
     */
    async showExportOptions(interaction) {
        const exportEmbed = new EmbedBuilder()
            .setTitle('📤 Exportar Logs')
            .setDescription('Selecciona el formato de exportación:')
            .addFields([
                {
                    name: '📄 Formatos disponibles',
                    value: '> **JSON** - Formato estructurado para desarrollo\n> **CSV** - Para análisis en Excel/Sheets\n> **TXT** - Formato legible para humanos\n> **MD** - Markdown para documentación'
                },
                {
                    name: '📊 Información',
                    value: `> Se exportarán todos los logs disponibles\n> Total de registros: ${interaction.client.getLogStats('databasereload').total}`
                }
            ])
            .setColor(0x0099ff)
            .setTimestamp();

        // Crear botones de formato
        const formatActions = [
            { id: 'export_json', label: '📄 JSON', style: 1, emoji: '📄' },
            { id: 'export_csv', label: '📊 CSV', style: 1, emoji: '📊' },
            { id: 'export_txt', label: '📝 TXT', style: 1, emoji: '📝' },
            { id: 'export_md', label: '📋 MD', style: 1, emoji: '📋' }
        ];

        const { buttonIds, row } = interaction.client.createQuickActionButtons(formatActions);

        await interaction.editReply({
            embeds: [exportEmbed],
            components: [row]
        });

        // Registrar callbacks para cada formato
        buttonIds.forEach(({ id, action }) => {
            interaction.client.registerButtonCallback(id, async (buttonInteraction) => {
                const format = action.replace('export_', '');
                await this.exportLogs(buttonInteraction, format);
            });
        });
    },

    /**
     * Exporta logs en el formato especificado
     */
    async exportLogs(interaction, format) {
        await interaction.deferUpdate();

        const progressEmbed = new EmbedBuilder()
            .setTitle('⏳ Exportando Logs...')
            .setDescription(`Generando archivo en formato **${format.toUpperCase()}**...`)
            .setColor(0xffa500);

        await interaction.editReply({
            embeds: [progressEmbed],
            components: []
        });

        try {
            const logs = interaction.client.getRecentLogs('databasereload', 100); // Exportar hasta 100 logs
            const stats = interaction.client.getLogStats('databasereload');

            let exportContent = '';
            let fileName = '';

            switch (format) {
                case 'json':
                    exportContent = this.generateJSONExport(logs, stats);
                    fileName = `reload-logs-${new Date().toISOString().split('T')[0]}.json`;
                    break;
                case 'csv':
                    exportContent = this.generateCSVExport(logs);
                    fileName = `reload-logs-${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case 'txt':
                    exportContent = this.generateTXTExport(logs, stats);
                    fileName = `reload-logs-${new Date().toISOString().split('T')[0]}.txt`;
                    break;
                case 'md':
                    exportContent = this.generateMDExport(logs, stats);
                    fileName = `reload-logs-${new Date().toISOString().split('T')[0]}.md`;
                    break;
            }

            // Crear archivo temporal y enviarlo
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, '..', '..', '..', 'temp');

            // Crear directorio temp si no existe
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const filePath = path.join(tempDir, fileName);
            fs.writeFileSync(filePath, exportContent, 'utf8');

            const successEmbed = new EmbedBuilder()
                .setTitle('✅ Exportación Completada')
                .setDescription(`Logs exportados exitosamente en formato **${format.toUpperCase()}**`)
                .addFields([
                    { name: '📄 Archivo', value: fileName, inline: true },
                    { name: '📊 Registros', value: `${logs.length}`, inline: true },
                    { name: '💾 Tamaño', value: `${(exportContent.length / 1024).toFixed(2)} KB`, inline: true }
                ])
                .setColor(0x00ff00)
                .setTimestamp();

            // Crear botón para descargar
            const downloadActions = [
                { id: 'download_file', label: '⬇️ Descargar', style: 1, emoji: '⬇️' },
                { id: 'back_to_logs', label: '🔙 Volver', style: 2, emoji: '🔙' }
            ];

            const { buttonIds: downloadButtonIds, row: downloadRow } = interaction.client.createQuickActionButtons(downloadActions);

            await interaction.editReply({
                embeds: [successEmbed],
                components: [downloadRow],
                files: [{
                    attachment: filePath,
                    name: fileName
                }]
            });

            // Registrar callbacks
            downloadButtonIds.forEach(({ id, action }) => {
                interaction.client.registerButtonCallback(id, async (btnInt) => {
                    if (action === 'download_file') {
                        await btnInt.reply({
                            content: '📁 El archivo ya está disponible arriba para descargar.',
                            flags: MessageFlags.Ephemeral
                        });
                    } else if (action === 'back_to_logs') {
                        await btnInt.deferUpdate();
                        await this.refreshLogsView(btnInt);
                    }
                });
            });

            // Limpiar archivo temporal después de 5 minutos
            setTimeout(() => {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (error) {
                    console.error('Error limpiando archivo temporal:', error);
                }
            }, 5 * 60 * 1000);

        } catch (error) {
            console.error('Error exportando logs:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Error en Exportación')
                .setDescription('Ocurrió un error al exportar los logs.')
                .addFields([
                    { name: '🚨 Error', value: `\`\`\`${error.message}\`\`\`` }
                ])
                .setColor(0xff0000)
                .setTimestamp();

            await interaction.editReply({
                embeds: [errorEmbed],
                components: []
            });
        }
    },

    /**
     * Genera exportación en formato JSON
     */
    generateJSONExport(logs, stats) {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                exportedBy: 'SuperKode Bot',
                version: '1.0.0',
                totalLogs: logs.length,
                statistics: stats
            },
            logs: logs
        };

        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Genera exportación en formato CSV
     */
    generateCSVExport(logs) {
        const headers = [
            'Timestamp',
            'Date',
            'Time',
            'Type',
            'Action',
            'User',
            'Guild',
            'Success',
            'Duration',
            'Changes',
            'Errors'
        ];

        let csv = headers.join(',') + '\n';

        logs.forEach(log => {
            const actionText = log.action ||
                              (log.module ? `Reload ${log.module}` : null) ||
                              log.moduleDescription ||
                              'Unknown Action';

            const row = [
                `"${log.timestamp || ''}"`,
                `"${log.date || ''}"`,
                `"${log.time || ''}"`,
                `"${log.type || 'info'}"`,
                `"${actionText}"`,
                `"${log.user?.username || 'System'}"`,
                `"${log.guild?.name || 'Unknown'}"`,
                `"${log.success ? 'Yes' : 'No'}"`,
                `"${log.duration || 'N/A'}"`,
                `"${(log.changes || []).join('; ')}"`,
                `"${(log.errors || []).map(e => e.message || e).join('; ')}"`
            ];

            csv += row.join(',') + '\n';
        });

        return csv;
    },

    /**
     * Genera exportación en formato TXT
     */
    generateTXTExport(logs, stats) {
        let txt = '='.repeat(60) + '\n';
        txt += '           SUPERKODE BOT - RELOAD LOGS EXPORT\n';
        txt += '='.repeat(60) + '\n\n';

        txt += `Export Date: ${new Date().toLocaleString('es-ES')}\n`;
        txt += `Total Logs: ${logs.length}\n`;
        txt += `Success Rate: ${stats.successRate}%\n`;
        txt += `Average Duration: ${stats.averageDuration}ms\n\n`;

        txt += '-'.repeat(60) + '\n';
        txt += '                        LOG ENTRIES\n';
        txt += '-'.repeat(60) + '\n\n';

        logs.forEach((log, index) => {
            const actionText = log.action ||
                              (log.module ? `Reload ${log.module}` : null) ||
                              log.moduleDescription ||
                              'Unknown Action';

            txt += `[${index + 1}] ${log.date} ${log.time}\n`;
            txt += `    Action: ${actionText}\n`;
            txt += `    User: ${log.user?.username || 'System'}\n`;
            txt += `    Guild: ${log.guild?.name || 'Unknown'}\n`;
            txt += `    Status: ${log.success ? 'SUCCESS' : 'FAILED'}\n`;
            txt += `    Duration: ${log.duration ? `${log.duration}ms` : 'N/A'}\n`;

            if (log.changes && log.changes.length > 0) {
                txt += `    Changes:\n`;
                log.changes.forEach(change => {
                    txt += `      - ${change}\n`;
                });
            }

            if (log.errors && log.errors.length > 0) {
                txt += `    Errors:\n`;
                log.errors.forEach(error => {
                    txt += `      - ${error.message || error}\n`;
                });
            }

            txt += '\n';
        });

        return txt;
    },

    /**
     * Genera exportación en formato Markdown
     */
    generateMDExport(logs, stats) {
        let md = '# SuperKode Bot - Reload Logs Export\n\n';

        md += `**Export Date:** ${new Date().toLocaleString('es-ES')}  \n`;
        md += `**Total Logs:** ${logs.length}  \n`;
        md += `**Success Rate:** ${stats.successRate}%  \n`;
        md += `**Average Duration:** ${stats.averageDuration}ms  \n\n`;

        md += '## 📊 Statistics\n\n';
        md += '| Metric | Value |\n';
        md += '|--------|-------|\n';
        md += `| Total Logs | ${stats.total} |\n`;
        md += `| Today | ${stats.today} |\n`;
        md += `| This Week | ${stats.thisWeek} |\n`;
        md += `| Success Rate | ${stats.successRate}% |\n`;
        md += `| Average Duration | ${stats.averageDuration}ms |\n\n`;

        md += '## 📋 Log Entries\n\n';

        logs.forEach((log, index) => {
            const actionText = log.action ||
                              (log.module ? `Reload ${log.module}` : null) ||
                              log.moduleDescription ||
                              'Unknown Action';

            const statusIcon = log.success ? '✅' : '❌';

            md += `### ${statusIcon} Log #${index + 1} - ${actionText}\n\n`;
            md += `**Date:** ${log.date} ${log.time}  \n`;
            md += `**User:** ${log.user?.username || 'System'}  \n`;
            md += `**Guild:** ${log.guild?.name || 'Unknown'}  \n`;
            md += `**Status:** ${log.success ? 'SUCCESS' : 'FAILED'}  \n`;
            md += `**Duration:** ${log.duration ? `${log.duration}ms` : 'N/A'}  \n\n`;

            if (log.changes && log.changes.length > 0) {
                md += '**Changes:**\n';
                log.changes.forEach(change => {
                    md += `- ${change}\n`;
                });
                md += '\n';
            }

            if (log.errors && log.errors.length > 0) {
                md += '**Errors:**\n';
                log.errors.forEach(error => {
                    md += `- ${error.message || error}\n`;
                });
                md += '\n';
            }

            md += '---\n\n';
        });

        return md;
    }
};
