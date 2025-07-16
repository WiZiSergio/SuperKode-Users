const chalk = require('chalk');
const ModerationUtils = require('./moderationUtils');

/**
 * Inicializa el sistema de moderación
 * @param {Client} client - Cliente de Discord
 */
function initializeModeration(client) {
    try {
        // Crear instancia de utilidades de moderación
        const moderationUtils = new ModerationUtils(client);
        
        // Añadir utilidades al cliente
        client.moderation = moderationUtils;
        
        // Inicializar base de datos
        moderationUtils.initializeDatabase();
        
        // Añadir métodos de conveniencia al cliente
        client.isModerator = (userId, guildId) => moderationUtils.isModerator(userId, guildId);
        client.getModerators = () => moderationUtils.getModerators();
        client.getModerationStats = () => moderationUtils.getStats();
        client.logModerationAction = (actionData) => moderationUtils.logAction(actionData);
        client.validateModerationPermissions = (interaction, action) => moderationUtils.validatePermissions(interaction, action);
        
        console.log(chalk.green('✅ Sistema de moderación inicializado'));
        
        return true;
    } catch (error) {
        console.error(chalk.red('❌ Error inicializando sistema de moderación:'), error);
        return false;
    }
}

module.exports = {
    initializeModeration,
    ModerationUtils
};
