const chalk = require('chalk');
const { initializeModeration } = require('../../moderation/index');

/**
 * Configuración de la base de datos de moderación
 * @param {Client} client - Cliente de Discord
 * @param {Object} dbManager - Administrador de bases de datos
 */
module.exports = function(client, dbManager) {
    try {
        // Inicializar el sistema de moderación
        const success = initializeModeration(client);
        
        if (success) {
            console.log(chalk.green('✅ Configuración de moderación cargada exitosamente'));
        } else {
            console.error(chalk.red('❌ Error al cargar configuración de moderación'));
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Error en configuración de moderación:'), error);
    }
};
