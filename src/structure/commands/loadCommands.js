require('colors');
const fs = require('fs');
const path = require('path');
const { getGuildId, getGuildName, validateGuildConfig } = require('../config/configguild/guild');

/**
 * Función para cargar comandos slash desde las carpetas de categorías
 * @param {Client} client - Cliente de Discord
 */
function loadSlashCommands(client) {
    const commandsPath = path.join(__dirname, '..', '..', 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        console.warn(`⚠️ Carpeta de comandos no encontrada: ${commandsPath}`.yellow);
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                
                try {
                    // Limpiar cache antes de requerir
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    // Agregar información del archivo al comando
                    command._fileName = `${folder}/${file}`;
                    command._category = folder;
                    
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(`✅ Comando cargado: ${command.data.name} (${command._fileName})`.green);
                    } else {
                        console.warn(`⚠️ Estructura de comando inválida en ${command._fileName}`.yellow);
                    }
                } catch (error) {
                    console.error(`❌ Error al cargar comando ${folder}/${file}: ${error.message}`.red);
                }
            }
        }
    }
}

/**
 * Función para registrar comandos slash en el guild específico
 * @param {Client} client - Cliente de Discord
 */
async function registerSlashCommands(client) {
    // Validar configuración del guild
    if (!validateGuildConfig()) {
        return;
    }

    if (!client.application) {
        console.warn('⚠️ Aplicación no disponible para registrar comandos'.yellow);
        return;
    }

    try {
        const guildId = getGuildId();
        const guildName = getGuildName();

        // Obtener el guild
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error(`❌ Guild no encontrado: ${guildName} (${guildId})`.red);
            console.error('💡 Asegúrate de que el bot esté en el servidor y el ID sea correcto'.yellow);
            return;
        }

        const commandsArray = [];

        client.commands.forEach(command => {
            if (command.data) {
                commandsArray.push(command.data.toJSON());
            }
        });

        // Registrar comandos en el guild específico
        await guild.commands.set(commandsArray);
        console.log(`(/) ${client.commands.size} comandos slash registrados en ${guildName} (${guildId})!`.green);
    } catch (error) {
        console.error(`❌ Error al registrar comandos slash: ${error.message}`.red);
    }
}

/**
 * Función para recargar comandos slash (para comando reload)
 * @param {Client} client - Cliente de Discord
 */
async function reloadSlashCommands(client) {
    console.log('🔄 Recargando comandos slash...'.cyan);

    // Limpiar comandos existentes
    client.commands.clear();

    // Recargar comandos
    loadSlashCommands(client);

    // Registrar comandos en el guild específico
    await registerSlashCommands(client);
}

/**
 * Función para obtener información de comandos
 * @param {Client} client - Cliente de Discord
 * @returns {Object} Información de comandos cargados
 */
function getCommandsInfo(client) {
    const info = {
        total: client.commands.size,
        byCategory: {},
        commands: []
    };

    client.commands.forEach(command => {
        const category = command._category || 'unknown';
        
        // Contar por categoría
        info.byCategory[category] = (info.byCategory[category] || 0) + 1;
        
        // Agregar a la lista de comandos
        info.commands.push({
            name: command.data.name,
            category: category,
            fileName: command._fileName || 'unknown'
        });
    });

    return info;
}

/**
 * Función para buscar un comando específico
 * @param {Client} client - Cliente de Discord
 * @param {string} commandName - Nombre del comando a buscar
 * @returns {Object|undefined} Comando encontrado o undefined
 */
function findCommand(client, commandName) {
    return client.commands.get(commandName);
}

/**
 * Función para obtener comandos por categoría
 * @param {Client} client - Cliente de Discord
 * @param {string} category - Categoría a filtrar
 * @returns {Array} Array de comandos de la categoría especificada
 */
function getCommandsByCategory(client, category) {
    const commands = [];
    
    client.commands.forEach(command => {
        if (command._category === category) {
            commands.push(command);
        }
    });
    
    return commands;
}

/**
 * Función para listar todas las categorías disponibles
 * @param {Client} client - Cliente de Discord
 * @returns {Array} Array de categorías únicas
 */
function getCategories(client) {
    const categories = new Set();
    
    client.commands.forEach(command => {
        if (command._category) {
            categories.add(command._category);
        }
    });
    
    return Array.from(categories);
}

/**
 * Función para validar estructura de comando
 * @param {Object} command - Comando a validar
 * @returns {boolean} True si la estructura es válida
 */
function validateCommandStructure(command) {
    return command && 
           typeof command === 'object' &&
           'data' in command &&
           'execute' in command &&
           typeof command.execute === 'function' &&
           command.data &&
           typeof command.data.name === 'string';
}

/**
 * Función para obtener estadísticas detalladas de comandos
 * @param {Client} client - Cliente de Discord
 * @returns {Object} Estadísticas detalladas
 */
function getCommandsStats(client) {
    const stats = {
        totalCommands: client.commands.size,
        categories: {},
        averageCommandsPerCategory: 0,
        mostPopulatedCategory: null,
        leastPopulatedCategory: null
    };

    // Contar comandos por categoría
    client.commands.forEach(command => {
        const category = command._category || 'unknown';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    // Calcular estadísticas
    const categoryNames = Object.keys(stats.categories);
    const categoryCounts = Object.values(stats.categories);
    
    if (categoryNames.length > 0) {
        stats.averageCommandsPerCategory = categoryCounts.reduce((a, b) => a + b, 0) / categoryNames.length;
        
        const maxCount = Math.max(...categoryCounts);
        const minCount = Math.min(...categoryCounts);
        
        stats.mostPopulatedCategory = {
            name: categoryNames[categoryCounts.indexOf(maxCount)],
            count: maxCount
        };
        
        stats.leastPopulatedCategory = {
            name: categoryNames[categoryCounts.indexOf(minCount)],
            count: minCount
        };
    }

    return stats;
}

/**
 * Función para obtener información del guild configurado
 * @param {Client} client - Cliente de Discord
 * @returns {Object} Información del guild
 */
function getGuildInfo(client) {
    const guildId = getGuildId();
    const guildName = getGuildName();
    const guild = client.guilds.cache.get(guildId);

    return {
        id: guildId,
        name: guildName,
        found: !!guild,
        memberCount: guild ? guild.memberCount : 0,
        botJoined: guild ? guild.joinedAt : null
    };
}

module.exports = {
    loadSlashCommands,
    registerSlashCommands,
    reloadSlashCommands,
    getCommandsInfo,
    findCommand,
    getCommandsByCategory,
    getCategories,
    validateCommandStructure,
    getCommandsStats,
    getGuildInfo
};
