import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { isOwner } from './config/configowner/owner.js';
import dbManager from './databases/database.js';
import { loadSlashCommands } from './commands/loadCommands.js';

dotenv.config({ path: path.join(__dirname, 'config', 'configbot', '.env') });

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
async function loadCommands(client) {
    const slashCommandsPath = path.join(__dirname, '..', 'commands', 'slash');

    if (!fs.existsSync(slashCommandsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de comandos slash no encontrada: ${slashCommandsPath}`));
        return;
    }

    async function loadCommandsFromFolder(folderPath, relativePath = '') {
        const items = fs.readdirSync(folderPath);

        for (const item of items) {
            const itemPath = path.join(folderPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                const newRelativePath = relativePath ? `${relativePath}/${item}` : item;
                await loadCommandsFromFolder(itemPath, newRelativePath);
            } else if (item.endsWith('.js')) {
                try {
                    const commandModule = await import(pathToFileURL(itemPath).href);
                    const command = commandModule.default ?? commandModule;

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

    await loadCommandsFromFolder(slashCommandsPath);
}

/**
 * Función para cargar eventos del bot
 * @param {Client} client - Cliente de Discord
 */
async function loadEvents(client) {
    const eventsPath = path.join(__dirname, 'events');

    if (!fs.existsSync(eventsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de eventos no encontrada: ${eventsPath}`));
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);

        try {
            const eventModule = await import(pathToFileURL(filePath).href);
            const event = eventModule.default ?? eventModule;

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
async function loadHandlers(client) {
    const handlersPath = path.join(__dirname, 'handlers');

    if (!fs.existsSync(handlersPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de handlers no encontrada: ${handlersPath}`));
        return;
    }

    const handlerFiles = fs.readdirSync(handlersPath).filter(file => file.endsWith('.js'));

    for (const file of handlerFiles) {
        const filePath = path.join(handlersPath, file);

        try {
            const handlerModule = await import(pathToFileURL(filePath).href);
            const handler = handlerModule.default ?? handlerModule;

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
async function loadStructureCommands(client) {
    const structureCommandsPath = path.join(__dirname, 'commands');

    if (!fs.existsSync(structureCommandsPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de comandos de estructura no encontrada: ${structureCommandsPath}`));
        return;
    }

    console.log(chalk.green(`✅ Cargador de comandos de estructura disponible: loadCommands.js`));

    try {
        await loadSlashCommands(client);
        console.log(chalk.green(`✅ Sistema de comandos de estructura inicializado`));
    } catch (error) {
        console.error(chalk.red(`❌ Error al inicializar sistema de comandos de estructura: ${error.message}`));
    }
}

/**
 * Función para cargar y configurar las bases de datos
 * @param {Client} client - Cliente de Discord
 */
async function loadDatabases(client) {
    const databasesPath = path.join(__dirname, 'databases');

    if (!fs.existsSync(databasesPath)) {
        console.warn(chalk.yellow(`⚠️ Carpeta de bases de datos no encontrada: ${databasesPath}`));
        return;
    }

    if (dbManager) {
        const existingDatabases = dbManager.listDatabases();
        if (existingDatabases.length > 0) {
            existingDatabases.forEach(dbName => {
                const recordCount = dbManager.countRecords(dbName);
                console.log(chalk.green(`✅ Base de datos cargada: ${dbName} (${dbName}.json) [${recordCount} registros]`));
            });
        }

        const defaultDatabases = [
            { name: 'databasereload', defaultData: [] }
        ];

        defaultDatabases.forEach(({ name, defaultData }) => {
            const created = dbManager.createDatabase(name, defaultData);
            if (created) {
                console.log(chalk.green(`✅ Base de datos por defecto creada: ${name} (${name}.json)`));
            }
        });

        client.dbManager = dbManager;
    } else {
        console.error(chalk.red('❌ Error al cargar el administrador de bases de datos'));
    }

    const databaseFiles = fs.readdirSync(databasesPath).filter(file =>
        file.endsWith('.js') && file !== 'database.js'
    );

    for (const file of databaseFiles) {
        const filePath = path.join(databasesPath, file);

        try {
            const dbConfigModule = await import(pathToFileURL(filePath).href);
            const dbConfig = dbConfigModule.default ?? dbConfigModule;

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
async function loadAll(client) {
    console.log(chalk.cyan('🚀 Cargando componentes del bot...'));

    const config = loadConfig();

    await loadCommands(client);
    await loadStructureCommands(client);
    await loadEvents(client);
    await loadHandlers(client);
    await loadDatabases(client);

    console.log(chalk.green('✅ Todos los componentes cargados exitosamente'));

    return config;
}

export {
    loadConfig,
    loadCommands,
    loadStructureCommands,
    loadEvents,
    loadHandlers,
    loadDatabases,
    loadAll
};
