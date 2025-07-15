/**
 * Configuración de owners del bot
 */

/**
 * Lista de IDs de usuarios que son owners del bot
 * Agrega aquí los IDs de Discord de los usuarios que deben tener acceso completo al bot
 */
const ownerUserIds = [
    '777821915184234546', // WiZiSergio
];

/**
 * Función para verificar si un usuario es owner del bot
 * @param {string} userId - ID del usuario de Discord
 * @param {string} clientId - ID del cliente/bot de Discord
 * @returns {boolean} - True si el usuario es owner, false en caso contrario
 */
function isOwner(userId, clientId) {
    const ownerIds = [
        clientId, // El bot mismo
        ...ownerUserIds // IDs de usuarios owners adicionales
    ];
    
    return ownerIds.includes(userId);
}

/**
 * Función para agregar un nuevo owner
 * @param {string} userId - ID del usuario a agregar como owner
 */
function addOwner(userId) {
    if (!ownerUserIds.includes(userId)) {
        ownerUserIds.push(userId);
        console.log(`[OWNER] Usuario ${userId} agregado como owner`);
    } else {
        console.log(`[OWNER] Usuario ${userId} ya es owner`);
    }
}

/**
 * Función para remover un owner
 * @param {string} userId - ID del usuario a remover como owner
 */
function removeOwner(userId) {
    const index = ownerUserIds.indexOf(userId);
    if (index > -1) {
        ownerUserIds.splice(index, 1);
        console.log(`[OWNER] Usuario ${userId} removido como owner`);
    } else {
        console.log(`[OWNER] Usuario ${userId} no es owner`);
    }
}

/**
 * Función para obtener la lista de owners
 * @returns {string[]} - Array con los IDs de los owners
 */
function getOwners() {
    return [...ownerUserIds];
}

module.exports = {
    isOwner,
    addOwner,
    removeOwner,
    getOwners
};
