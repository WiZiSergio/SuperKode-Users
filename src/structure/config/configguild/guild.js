/**
 * Configuración de guild del bot
 */

/**
 * Lista de guilds configurados para el bot
 * Agrega aquí los IDs de Discord de los servidores donde el bot debe funcionar
 */
const guildConfigs = [
    {
        id: '1388236304084504637', // ID del servidor
        name: 'SuperKode Users', // Nombre del servidor
        isPrimary: true // Servidor principal donde se registran comandos slash
    }
    // Puedes agregar más servidores aquí:
    // {
    //     id: '1234567890123456789',
    //     name: 'Servidor Secundario',
    //     isPrimary: false
    // }
];

/**
 * Función para obtener el guild principal (donde se registran comandos slash)
 * @returns {Object|null} Configuración del guild principal o null si no existe
 */
function getPrimaryGuild() {
    return guildConfigs.find(guild => guild.isPrimary) || guildConfigs[0] || null;
}

/**
 * Función para obtener el ID del guild principal
 * @returns {string|null} ID del guild principal
 */
function getGuildId() {
    const primaryGuild = getPrimaryGuild();
    return primaryGuild ? primaryGuild.id : null;
}

/**
 * Función para obtener el nombre del guild principal
 * @returns {string|null} Nombre del guild principal
 */
function getGuildName() {
    const primaryGuild = getPrimaryGuild();
    return primaryGuild ? primaryGuild.name : null;
}

/**
 * Función para validar si un guild ID es el guild principal
 * @param {string} id - ID del guild a validar
 * @returns {boolean} True si es el guild principal
 */
function isMainGuild(id) {
    const primaryGuild = getPrimaryGuild();
    return primaryGuild ? id === primaryGuild.id : false;
}

/**
 * Función para verificar si un guild está en la lista de guilds configurados
 * @param {string} guildId - ID del guild a verificar
 * @returns {boolean} True si el guild está configurado
 */
function isConfiguredGuild(guildId) {
    return guildConfigs.some(guild => guild.id === guildId);
}

/**
 * Función para obtener información de un guild específico
 * @param {string} guildId - ID del guild
 * @returns {Object|null} Información del guild o null si no existe
 */
function getGuildById(guildId) {
    return guildConfigs.find(guild => guild.id === guildId) || null;
}

/**
 * Función para obtener todos los guilds configurados
 * @returns {Array} Array con todos los guilds configurados
 */
function getAllGuilds() {
    return [...guildConfigs];
}

/**
 * Función para agregar un nuevo guild
 * @param {string} guildId - ID del guild
 * @param {string} guildName - Nombre del guild
 * @param {boolean} isPrimary - Si es el guild principal
 */
function addGuild(guildId, guildName, isPrimary = false) {
    // Si se marca como primary, desmarcar otros
    if (isPrimary) {
        guildConfigs.forEach(guild => guild.isPrimary = false);
    }

    const existingGuild = guildConfigs.find(guild => guild.id === guildId);
    if (!existingGuild) {
        guildConfigs.push({
            id: guildId,
            name: guildName,
            isPrimary: isPrimary
        });
        console.log(`[GUILD] Guild ${guildName} (${guildId}) agregado`);
    } else {
        console.log(`[GUILD] Guild ${guildId} ya existe`);
    }
}

/**
 * Función para remover un guild
 * @param {string} guildId - ID del guild a remover
 */
function removeGuild(guildId) {
    const index = guildConfigs.findIndex(guild => guild.id === guildId);
    if (index > -1) {
        const removedGuild = guildConfigs.splice(index, 1)[0];
        console.log(`[GUILD] Guild ${removedGuild.name} (${guildId}) removido`);
    } else {
        console.log(`[GUILD] Guild ${guildId} no encontrado`);
    }
}

/**
 * Función para obtener información completa del guild principal
 * @returns {Object} Información del guild principal
 */
function getGuildInfo() {
    const primaryGuild = getPrimaryGuild();
    return {
        id: primaryGuild ? primaryGuild.id : null,
        name: primaryGuild ? primaryGuild.name : null,
        isConfigured: !!primaryGuild,
        totalConfiguredGuilds: guildConfigs.length
    };
}

/**
 * Función para validar configuración del guild
 * @returns {boolean} True si está configurado correctamente
 */
function validateGuildConfig() {
    if (guildConfigs.length === 0) {
        console.error('❌ No hay guilds configurados');
        console.error('💡 Edita el archivo guild.js en src/structure/config/configguild/');
        console.error('💡 Agrega al menos un guild en el array guildConfigs');
        return false;
    }

    const primaryGuild = getPrimaryGuild();
    if (!primaryGuild) {
        console.error('❌ No hay guild principal configurado');
        console.error('💡 Marca al menos un guild como isPrimary: true');
        return false;
    }

    if (!/^\d{17,19}$/.test(primaryGuild.id)) {
        console.error('❌ GUILD_ID no tiene un formato válido');
        console.error('💡 El ID del servidor debe ser un número de 17-19 dígitos');
        return false;
    }

    return true;
}

export {
    getPrimaryGuild,
    getGuildId,
    getGuildName,
    isMainGuild,
    isConfiguredGuild,
    getGuildById,
    getAllGuilds,
    addGuild,
    removeGuild,
    getGuildInfo,
    validateGuildConfig
};

export default {
    getPrimaryGuild,
    getGuildId,
    getGuildName,
    isMainGuild,
    isConfiguredGuild,
    getGuildById,
    getAllGuilds,
    addGuild,
    removeGuild,
    getGuildInfo,
    validateGuildConfig
};
