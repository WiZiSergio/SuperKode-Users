const chalk = require('chalk');
const { loadCommands, loadStructureCommands, loadEvents, loadHandlers, loadDatabases } = require('../loadfolders');
const { reloadSlashCommands } = require('../commands/loadCommands');

/**
 * Handler que agrega métodos de recarga al cliente de Discord
 * @param {Client} client - Cliente de Discord
 */
module.exports = function(client) {
    
    /**
     * Método para recargar comandos slash (para comando reload)
     */
    client.reloadSlashCommands = async function() {
        // Usar la función especializada del módulo de comandos
        await reloadSlashCommands(this);

        // También recargar comandos desde src/commands (método tradicional)
        loadCommands(this);
        loadStructureCommands(this);
    };

    /**
     * Método para recargar eventos (para comando reload)
     */
    client.reloadEvents = async function() {
        console.log(chalk.cyan('🔄 Recargando eventos...'));

        // Remover todos los listeners existentes excepto los básicos del sistema
        const systemEvents = ['error', 'warn', 'debug'];
        const currentListeners = this.eventNames();

        currentListeners.forEach(eventName => {
            if (!systemEvents.includes(eventName)) {
                this.removeAllListeners(eventName);
            }
        });

        // Recargar eventos
        loadEvents(this);

        console.log(chalk.green('✅ Eventos recargados exitosamente'));
    };

    /**
     * Método para recargar handlers (para comando reload)
     */
    client.reloadHandlers = async function() {
        console.log(chalk.cyan('🔄 Recargando handlers...'));

        // Recargar handlers
        loadHandlers(this);

        console.log(chalk.green('✅ Handlers recargados exitosamente'));
    };

    /**
     * Método para recargar bases de datos (para comando reload)
     */
    client.reloadDatabases = async function() {
        console.log(chalk.cyan('🔄 Recargando bases de datos...'));

        // Recargar bases de datos
        loadDatabases(this);

        console.log(chalk.green('✅ Bases de datos recargadas exitosamente'));
    };

    /**
     * Método legacy para compatibilidad con comando reload
     * Alias para reloadEvents
     */
    client.loadEvents = async function() {
        await this.reloadEvents();
    };

    /**
     * Método para recargar todos los componentes
     */
    client.reloadAll = async function() {
        console.log(chalk.cyan('🔄 Recargando todos los componentes...'));

        await this.reloadSlashCommands();
        await this.reloadEvents();
        await this.reloadHandlers();
        await this.reloadDatabases();

        console.log(chalk.green('✅ Todos los componentes recargados exitosamente'));
    };

    console.log(chalk.green('✅ Handler de recarga agregado al cliente'));
};
