const chalk = require('chalk');

/**
 * Utilidades para el sistema de moderación
 */
class ModerationUtils {
    constructor(client) {
        this.client = client;
        this.dbManager = client.dbManager;
    }

    /**
     * Verifica si un usuario es moderador
     * @param {string} userId - ID del usuario
     * @param {string} guildId - ID del servidor
     * @returns {boolean} - True si es moderador
     */
    isModerator(userId, guildId) {
        try {
            // Verificar si es owner del bot
            const { isOwner } = require('../structure/config/configowner/owner');
            const config = require('../structure/loadfolders').loadConfig();

            if (isOwner(userId, config.clientId)) {
                return true;
            }

            const modData = this.dbManager.getAllRecords('mod')[0];
            if (!modData) return false;

            // Verificar si el usuario está en la lista de moderadores
            const isUserMod = modData.users?.some(user => user.id === userId);
            if (isUserMod) return true;

            // Verificar si el usuario tiene algún rol de moderación
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return false;

            const member = guild.members.cache.get(userId);
            if (!member) return false;

            const hasModRole = modData.roles?.some(role => 
                member.roles.cache.has(role.id)
            );

            return hasModRole;
        } catch (error) {
            console.error(chalk.red('❌ Error verificando moderador:'), error);
            return false;
        }
    }

    /**
     * Obtiene la lista de moderadores
     * @returns {Object} - Datos de moderación
     */
    getModerators() {
        try {
            const modData = this.dbManager.getAllRecords('mod')[0];
            return modData || { users: [], roles: [] };
        } catch (error) {
            console.error(chalk.red('❌ Error obteniendo moderadores:'), error);
            return { users: [], roles: [] };
        }
    }

    /**
     * Obtiene estadísticas de moderación
     * @returns {Object} - Estadísticas
     */
    getStats() {
        try {
            const modData = this.getModerators();
            
            return {
                totalUsers: modData.users?.length || 0,
                totalRoles: modData.roles?.length || 0,
                totalModerators: (modData.users?.length || 0) + (modData.roles?.length || 0),
                lastUpdated: modData.lastUpdated || null
            };
        } catch (error) {
            console.error(chalk.red('❌ Error obteniendo estadísticas:'), error);
            return {
                totalUsers: 0,
                totalRoles: 0,
                totalModerators: 0,
                lastUpdated: null
            };
        }
    }

    /**
     * Registra una acción de moderación
     * @param {Object} actionData - Datos de la acción
     */
    logAction(actionData) {
        try {
            const logEntry = this.client.createLogEntry({
                type: 'info',
                category: 'moderation',
                action: actionData.action,
                user: actionData.user,
                guild: actionData.guild,
                details: actionData.details || {},
                success: actionData.success !== undefined ? actionData.success : true
            });

            this.client.saveLog('mod', logEntry);
        } catch (error) {
            console.error(chalk.red('❌ Error registrando acción de moderación:'), error);
        }
    }

    /**
     * Valida permisos de moderación para una acción
     * @param {Object} interaction - Interacción de Discord
     * @param {string} action - Acción a realizar
     * @returns {boolean} - True si tiene permisos
     */
    validatePermissions(interaction, action) {
        try {
            // Verificar si es owner del bot
            const { isOwner } = require('../structure/config/configowner/owner');
            const config = require('../structure/loadfolders').loadConfig();

            if (isOwner(interaction.user.id, config.clientId)) {
                return true;
            }

            // Verificar si es moderador
            if (this.isModerator(interaction.user.id, interaction.guild.id)) {
                return true;
            }

            // Verificar permisos específicos del servidor
            if (interaction.member.permissions.has('Administrator')) {
                return true;
            }

            return false;
        } catch (error) {
            console.error(chalk.red('❌ Error validando permisos:'), error);
            return false;
        }
    }

    /**
     * Inicializa la base de datos de moderación
     */
    initializeDatabase() {
        try {
            this.dbManager.createDatabase('mod', {
                users: [],
                roles: [],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            });

            console.log(chalk.green('✅ Base de datos de moderación inicializada'));
        } catch (error) {
            console.error(chalk.red('❌ Error inicializando base de datos de moderación:'), error);
        }
    }
}

module.exports = ModerationUtils;
