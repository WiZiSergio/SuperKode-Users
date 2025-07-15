const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', 'configbot', '.env') });

/**
 * Función para cargar la configuración del bot
 * @returns {Object} Objeto de configuración
 */
function loadConfig() {
    try {
        // Cargar configuración desde variables de entorno
        const config = {
            token: process.env.DISCORD_TOKEN,
            clientId: process.env.DISCORD_CLIENT_ID
        };

        // Validar que las variables requeridas estén configuradas
        if (!config.token || config.token === 'TU_TOKEN_AQUI') {
            console.error('❌ DISCORD_TOKEN no está configurado correctamente');
            console.error('💡 Edita el archivo .env en src/structure/config/configbot/');
            console.error('💡 Reemplaza "TU_TOKEN_AQUI" con tu token real de Discord');
            process.exit(1);
        }

        if (!config.clientId || config.clientId === 'TU_CLIENT_ID_AQUI') {
            console.error('❌ DISCORD_CLIENT_ID no está configurado correctamente');
            console.error('💡 Edita el archivo .env en src/structure/config/configbot/');
            console.error('💡 Reemplaza "TU_CLIENT_ID_AQUI" con tu Client ID real de Discord');
            process.exit(1);
        }

        console.log('[CONFIG] Configuración cargada exitosamente desde .env');

        return config;
    } catch (error) {
        console.error('❌ Error al cargar configuración:', error.message);
        console.error('💡 Asegúrate de que el archivo .env existe en src/structure/config/configbot/');
        process.exit(1);
    }
}

/**
 * Función para cargar comandos desde las carpetas de categorías
 * @param {Client} client - Cliente de Discord
 */
function loadCommands(client) {
    const commandsPath = path.join(__dirname, '..', 'commands');

    if (!fs.existsSync(commandsPath)) {
        console.log('[ADVERTENCIA] La carpeta de comandos no existe:', commandsPath);
        return;
    }

    console.log(`[CARGA] Explorando carpeta de comandos: ${commandsPath}`);
    const commandFolders = fs.readdirSync(commandsPath);
    console.log(`[CARGA] Carpetas encontradas: ${commandFolders.join(', ')}`);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            console.log(`[CARGA] Procesando carpeta: ${folder}`);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            console.log(`[CARGA] Archivos .js encontrados en ${folder}: ${commandFiles.length > 0 ? commandFiles.join(', ') : 'ninguno'}`);

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                console.log(`[CARGA] Intentando cargar archivo: ${filePath}`);

                try {
                    const command = require(filePath);

                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(`[COMANDO] ✅ Cargado exitosamente: ${command.data.name} desde ${folder}/${file}`);
                    } else {
                        console.log(`[ADVERTENCIA] ⚠️ El comando en ${folder}/${file} no tiene las propiedades requeridas "data" o "execute".`);
                    }
                } catch (error) {
                    console.error(`[ERROR] ❌ Error al cargar comando ${folder}/${file}:`, error.message);
                }
            }
        } else {
            console.log(`[CARGA] Omitiendo archivo (no es carpeta): ${folder}`);
        }
    }
}

/**
 * Función para cargar eventos del bot
 * @param {Client} client - Cliente de Discord
 */
function loadEvents(client) {
    const eventsPath = path.join(__dirname, 'events');

    if (!fs.existsSync(eventsPath)) {
        console.log('[ADVERTENCIA] La carpeta de eventos no existe:', eventsPath);
        return;
    }

    console.log(`[CARGA] Explorando carpeta de eventos: ${eventsPath}`);
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    console.log(`[CARGA] Archivos de eventos encontrados: ${eventFiles.length > 0 ? eventFiles.join(', ') : 'ninguno'}`);

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        console.log(`[CARGA] Intentando cargar evento: ${filePath}`);

        try {
            const event = require(filePath);

            if (!event.name || !event.execute) {
                console.log(`[ADVERTENCIA] ⚠️ El evento en ${file} no tiene las propiedades requeridas "name" o "execute".`);
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
                console.log(`[EVENTO] ✅ Cargado exitosamente (once): ${event.name} desde ${file}`);
            } else {
                client.on(event.name, (...args) => event.execute(...args));
                console.log(`[EVENTO] ✅ Cargado exitosamente (on): ${event.name} desde ${file}`);
            }
        } catch (error) {
            console.error(`[ERROR] ❌ Error al cargar evento ${file}:`, error.message);
        }
    }
}

/**
 * Función para cargar handlers personalizados
 * @param {Client} client - Cliente de Discord
 */
function loadHandlers(client) {
    const handlersPath = path.join(__dirname, 'handlers');

    if (!fs.existsSync(handlersPath)) {
        console.log('[ADVERTENCIA] La carpeta de handlers no existe:', handlersPath);
        return;
    }

    console.log(`[CARGA] Explorando carpeta de handlers: ${handlersPath}`);
    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));
    console.log(`[CARGA] Archivos de handlers encontrados: ${handlerFiles.length > 0 ? handlerFiles.join(', ') : 'ninguno'}`);

    for (const file of handlerFiles) {
        const filePath = path.join(handlersPath, file);
        console.log(`[CARGA] Intentando cargar handler: ${filePath}`);

        try {
            const handler = require(filePath);

            if (typeof handler === 'function') {
                handler(client);
                console.log(`[HANDLER] ✅ Cargado exitosamente: ${file}`);
            } else {
                console.log(`[ADVERTENCIA] ⚠️ El handler en ${file} no es una función válida.`);
            }
        } catch (error) {
            console.error(`[ERROR] ❌ Error al cargar handler ${file}:`, error.message);
        }
    }
}

/**
 * Función principal para cargar todos los componentes
 * @param {Client} client - Cliente de Discord
 * @returns {Object} Configuración del bot
 */
function loadAll(client) {
    console.log('📂 Cargando componentes del bot...');

    // Cargar configuración primero
    const config = loadConfig();

    // Cargar componentes del bot
    loadCommands(client);
    loadEvents(client);
    loadHandlers(client);

    console.log('✅ Todos los componentes han sido cargados');

    return config;
}

module.exports = {
    loadConfig,
    loadCommands,
    loadEvents,
    loadHandlers,
    loadAll
};
