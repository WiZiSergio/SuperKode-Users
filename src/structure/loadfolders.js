const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { isOwner } = require('./config/configowner/owner');
const dbManager = require('./databases/database');
const { loadSlashCommands } = require('./commands/loadCommands');
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
            console.error(chalk.red('❌ DISCORD_TOKEN no está configurado correctamente'));
            console.error(chalk.yellow('💡 Edita el archivo .env en src/structure/config/configbot/'));
            console.error(chalk.yellow('💡 Reemplaza "TU_TOKEN_AQUI" con tu token real de Discord'));
            process.exit(1);
        }

        if (!config.clientId || config.clientId === 'TU_CLIENT_ID_AQUI') {
            console.error(chalk.red('❌ DISCORD_CLIENT_ID no está configurado correctamente'));
            console.error(chalk.yellow('💡 Edita el archivo .env en src/structure/config/configbot/'));
            console.error(chalk.yellow('💡 Reemplaza "TU_CLIENT_ID_AQUI" con tu Client ID real de Discord'));
            process.exit(1);
        }

        console.log(chalk.green('✅ Configuración cargada desde archivo .env'));

        // Agregar función helper para verificar owners usando el módulo externo
        config.isOwner = function(userId) {
            return isOwner(userId, config.clientId);
        };

        return config;
    } catch (error) {
        console.error(chalk.red('❌ Error al cargar configuración:'), error.message);
        console.error(chalk.yellow('💡 Asegúrate de que el archivo .env existe en src/structure/config/configbot/'));
        process.exit(1);
    }
}

/**
 * Función para cargar comandos slash desde las carpetas de categorías
 * @param {Client} client - Cliente de Discord
 */
function loadCommands(client) {
    const slashCommandsPath = path.join(__dirname, '..', 'commands', 'slash');

    if (!fs.existsSync(slashCommandsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de comandos slash no encontrada: ${slashCommandsPath}`));
        return;
    }

    // Función recursiva para cargar comandos de subcarpetas
    function loadCommandsFromFolder(folderPath, relativePath = '') {
        const items = fs.readdirSync(folderPath);

        for (const item of items) {
            const itemPath = path.join(folderPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Si es una carpeta, cargar recursivamente
                const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
                loadCommandsFromFolder(itemPath, newRelativePath);
            } else if (item.endsWith('.js')) {
                // Si es un archivo .js, cargarlo como comando
                try {
                    // Limpiar cache antes de requerir
                    delete require.cache[require.resolve(itemPath)];
                    const command = require(itemPath);

                    // Agregar información del archivo al comando
                    const fileName = relativePath ? `${relativePath}/${item}` : item;
                    command._fileName = fileName;
                    command._category = relativePath ? relativePath.split('/')[0] : 'root';

                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(chalk.green(`✅ Comando cargado: ${command.data.name} (${fileName})`));
                    } else {
                        console.warn(chalk.yellow(`⚠️ Estructura de comando inválida en ${fileName}`));
                    }
                } catch (error) {
                    const fileName = relativePath ? `${relativePath}/${item}` : item;
                    console.error(chalk.red(`❌ Error al cargar comando ${fileName}: ${error.message}`));
                }
            }
        }
    }

    // Cargar comandos desde la carpeta slash
    loadCommandsFromFolder(slashCommandsPath);
}

/**
 * Función para cargar eventos del bot
 * @param {Client} client - Cliente de Discord
 */
function loadEvents(client) {
    const eventsPath = path.join(__dirname, 'events');

    if (!fs.existsSync(eventsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de eventos no encontrada: ${eventsPath}`));
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
            // Limpiar cache antes de requerir
            delete require.cache[require.resolve(filePath)];
            const event = require(filePath);

            // Agregar información del archivo al evento
            event._fileName = file;

            if (!event.name || !event.execute) {
                console.warn(chalk.yellow(`⚠️ Estructura de evento inválida en ${event._fileName}`));
                continue;
            }

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
                console.log(chalk.green(`✅ Evento cargado: ${event.name} (${event._fileName}) [once]`));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
                console.log(chalk.green(`✅ Evento cargado: ${event.name} (${event._fileName}) [on]`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error al cargar evento ${file}: ${error.message}`));
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
        console.warn(chalk.yellow(`⚠️ Carpeta de handlers no encontrada: ${handlersPath}`));
        return;
    }

    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    for (const file of handlerFiles) {
        const filePath = path.join(handlersPath, file);

        try {
            // Limpiar cache antes de requerir
            delete require.cache[require.resolve(filePath)];
            const handler = require(filePath);

            if (typeof handler === 'function') {
                handler(client);
                console.log(chalk.green(`✅ Handler cargado: ${file.replace('.js', '')} (${file})`));
            } else {
                console.warn(chalk.yellow(`⚠️ Estructura de handler inválida en ${file}`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error al cargar handler ${file}: ${error.message}`));
        }
    }
}

/**
 * Función para cargar comandos desde structure/commands
 * @param {Client} client - Cliente de Discord
 */
function loadStructureCommands(client) {
    const structureCommandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(structureCommandsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de comandos de estructura no encontrada: ${structureCommandsPath}`));
        return;
    }

    console.log(chalk.green(`✅ Cargador de comandos de estructura disponible: loadCommands.js`));

    // Usar la función loadSlashCommands del módulo commands
    try {
        loadSlashCommands(client);
        console.log(chalk.green(`✅ Sistema de comandos de estructura inicializado`));
    } catch (error) {
        console.error(chalk.red(`❌ Error al inicializar sistema de comandos de estructura: ${error.message}`));
    }
}

/**
 * Función para cargar y configurar las bases de datos
 * @param {Client} client - Cliente de Discord
 */
function loadDatabases(client) {
    const databasesPath = path.join(__dirname, 'databases');

    if (!fs.existsSync(databasesPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de bases de datos no encontrada: ${databasesPath}`));
        return;
    }

    // Verificar que el administrador de bases de datos esté disponible
    if (dbManager) {
        // Listar bases de datos existentes
        const existingDatabases = dbManager.listDatabases();
        if (existingDatabases.length > 0) {
            existingDatabases.forEach(dbName => {
                const recordCount = dbManager.countRecords(dbName);
                console.log(chalk.green(`✅ Base de datos cargada: ${dbName} (${dbName}.json) [${recordCount} registros]`));
            });
        }

        // Crear bases de datos por defecto si no existen
        const defaultDatabases = [
            { name: 'databasereload', defaultData: [] }
            // Puedes agregar más bases de datos por defecto aquí
        ];

        defaultDatabases.forEach(({ name, defaultData }) => {
            const created = dbManager.createDatabase(name, defaultData);
            if (created) {
                console.log(chalk.green(`✅ Base de datos por defecto creada: ${name} (${name}.json)`));
            }
        });

        // Agregar el administrador de bases de datos al cliente para acceso global
        client.dbManager = dbManager;

    } else {
        console.error(chalk.red('❌ Error al cargar el administrador de bases de datos'));
    }

    // Buscar archivos .js adicionales en la carpeta databases (excluyendo database.js)
    const databaseFiles = fs.readdirSync(databasesPath).filter(file =>
        file.endsWith('.js') && file !== 'database.js'
    );

    for (const file of databaseFiles) {
        const filePath = path.join(databasesPath, file);

        try {
            // Limpiar cache antes de requerir
            delete require.cache[require.resolve(filePath)];
            const dbConfig = require(filePath);

            if (typeof dbConfig === 'function') {
                dbConfig(client, dbManager);
                console.log(chalk.green(`✅ Configuración de BD cargada: ${file.replace('.js', '')} (${file})`));
            } else if (typeof dbConfig === 'object') {
                console.log(chalk.green(`✅ Objeto de BD cargado: ${file.replace('.js', '')} (${file})`));
            } else {
                console.warn(chalk.yellow(`⚠️ Estructura de configuración de BD inválida en ${file}`));
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error al cargar configuración de BD ${file}: ${error.message}`));
        }
    }
}

/**
 * Función principal para cargar todos los componentes
 * @param {Client} client - Cliente de Discord
 * @returns {Object} Configuración del bot
 */
function loadAll(client) {
    console.log(chalk.cyan('🚀 Cargando componentes del bot...'));

    // Cargar configuración primero
    const config = loadConfig();

    // Cargar componentes del bot
    loadCommands(client);
    loadStructureCommands(client);
    loadEvents(client);
    loadHandlers(client);
    loadDatabases(client);

    console.log(chalk.green('✅ Todos los componentes cargados exitosamente'));

    return config;
}

module.exports = {
    loadConfig,
    loadCommands,
    loadStructureCommands,
    loadEvents,
    loadHandlers,
    loadDatabases,
    loadAll
};
