require('colors');
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
        console.log('🔄 Recargando eventos...'.cyan);
        
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
        
        console.log('✅ Eventos recargados exitosamente'.green);
    };

    /**
     * Método para recargar handlers (para comando reload)
     */
    client.reloadHandlers = async function() {
        console.log('🔄 Recargando handlers...'.cyan);
        
        // Recargar handlers
        loadHandlers(this);
        
        console.log('✅ Handlers recargados exitosamente'.green);
    };

    /**
     * Método para recargar bases de datos (para comando reload)
     */
    client.reloadDatabases = async function() {
        console.log('🔄 Recargando bases de datos...'.cyan);
        
        // Recargar bases de datos
        loadDatabases(this);
        
        console.log('✅ Bases de datos recargadas exitosamente'.green);
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
        console.log('🔄 Recargando todos los componentes...'.cyan);
        
        await this.reloadSlashCommands();
        await this.reloadEvents();
        await this.reloadHandlers();
        await this.reloadDatabases();
        
        console.log('✅ Todos los componentes recargados exitosamente'.green);
    };

    console.log('✅ Handler de recarga agregado al cliente'.green);
};
