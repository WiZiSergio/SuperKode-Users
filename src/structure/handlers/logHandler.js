require('colors');
const dbManager = require('../databases/database');

/**
 * Handler para manejar logs avanzados del sistema
 * @param {Client} client - Cliente de Discord
 */
module.exports = function(client) {
    
    /**
     * Función para crear un log entry estructurado
     * @param {Object} options - Opciones del log
     * @returns {Object} Log entry estructurado
     */
    client.createLogEntry = function(options) {
        const now = new Date();
        return {
            id: this.generateLogId(),
            timestamp: now.toISOString(),
            date: now.toLocaleDateString('es-ES'),
            time: now.toLocaleTimeString('es-ES'),
            type: options.type || 'info',
            category: options.category || 'general',
            action: options.action || 'unknown',
            user: options.user ? {
                id: options.user.id,
                username: options.user.username,
                displayName: options.user.displayName || options.user.username,
                tag: options.user.tag
            } : null,
            guild: options.guild ? {
                id: options.guild.id,
                name: options.guild.name,
                memberCount: options.guild.memberCount
            } : null,
            details: options.details || {},
            success: options.success !== undefined ? options.success : true,
            duration: options.duration || null,
            changes: options.changes || [],
            errors: options.errors || [],
            metadata: {
                botVersion: '1.0.0',
                nodeVersion: process.version,
                platform: process.platform,
                memory: this.getMemoryUsage()
            }
        };
    };

    /**
     * Función para generar ID único de log
     * @returns {string} ID único
     */
    client.generateLogId = function() {
        return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    };

    /**
     * Función para guardar log en base de datos
     * @param {string} database - Nombre de la base de datos
     * @param {Object} logEntry - Entry del log
     */
    client.saveLog = function(database, logEntry) {
        try {
            dbManager.createDatabase(database, []);
            dbManager.addRecord(database, logEntry);
            
            // Log en consola con colores
            const typeColors = {
                info: 'cyan',
                success: 'green',
                warning: 'yellow',
                error: 'red',
                debug: 'gray'
            };
            
            const color = typeColors[logEntry.type] || 'white';
            console.log(`[${logEntry.time}] ${logEntry.type.toUpperCase()}: ${logEntry.action}`[color]);
            
            if (logEntry.user) {
                console.log(`  👤 Usuario: ${logEntry.user.username} (${logEntry.user.id})`.gray);
            }
            
            if (logEntry.duration) {
                console.log(`  ⏱️ Duración: ${logEntry.duration}ms`.gray);
            }
            
            if (logEntry.changes.length > 0) {
                console.log(`  📋 Cambios: ${logEntry.changes.join(', ')}`.gray);
            }
            
            if (logEntry.errors.length > 0) {
                console.log(`  🚨 Errores: ${logEntry.errors.length}`.red);
            }
            
        } catch (error) {
            console.error('❌ Error guardando log:'.red, error);
        }
    };

    /**
     * Función para obtener logs recientes
     * @param {string} database - Nombre de la base de datos
     * @param {number} limit - Límite de logs a obtener
     * @param {string} type - Tipo de log a filtrar (opcional)
     * @returns {Array} Array de logs
     */
    client.getRecentLogs = function(database, limit = 10, type = null) {
        try {
            const logs = dbManager.getRecords(database) || [];
            
            let filteredLogs = logs;
            if (type) {
                filteredLogs = logs.filter(log => log.type === type);
            }
            
            return filteredLogs
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('❌ Error obteniendo logs:'.red, error);
            return [];
        }
    };

    /**
     * Función para obtener estadísticas de logs
     * @param {string} database - Nombre de la base de datos
     * @returns {Object} Estadísticas de logs
     */
    client.getLogStats = function(database) {
        try {
            const logs = dbManager.getRecords(database) || [];
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const stats = {
                total: logs.length,
                today: logs.filter(log => new Date(log.timestamp) >= today).length,
                thisWeek: logs.filter(log => new Date(log.timestamp) >= thisWeek).length,
                byType: {},
                byCategory: {},
                successRate: 0,
                averageDuration: 0
            };
            
            let totalDuration = 0;
            let durationCount = 0;
            let successCount = 0;
            
            logs.forEach(log => {
                // Contar por tipo
                stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
                
                // Contar por categoría
                stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
                
                // Calcular tasa de éxito
                if (log.success) successCount++;
                
                // Calcular duración promedio
                if (log.duration) {
                    totalDuration += log.duration;
                    durationCount++;
                }
            });
            
            stats.successRate = logs.length > 0 ? (successCount / logs.length * 100).toFixed(2) : 0;
            stats.averageDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
            
            return stats;
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas de logs:'.red, error);
            return {
                total: 0,
                today: 0,
                thisWeek: 0,
                byType: {},
                byCategory: {},
                successRate: 0,
                averageDuration: 0
            };
        }
    };

    /**
     * Función para limpiar logs antiguos
     * @param {string} database - Nombre de la base de datos
     * @param {number} daysToKeep - Días a mantener
     * @returns {number} Número de logs eliminados
     */
    client.cleanOldLogs = function(database, daysToKeep = 30) {
        try {
            const logs = dbManager.getRecords(database) || [];
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            
            const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
            const removedCount = logs.length - recentLogs.length;
            
            if (removedCount > 0) {
                dbManager.writeDatabase(database, recentLogs);
                console.log(`🧹 Limpiados ${removedCount} logs antiguos de ${database}`.yellow);
            }
            
            return removedCount;
        } catch (error) {
            console.error('❌ Error limpiando logs antiguos:'.red, error);
            return 0;
        }
    };

    /**
     * Función para obtener uso de memoria
     * @returns {string} Uso de memoria formateado
     */
    client.getMemoryUsage = function() {
        const used = process.memoryUsage();
        return `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`;
    };

    // Limpiar logs antiguos cada día
    setInterval(() => {
        client.cleanOldLogs('databasereload', 30);
    }, 24 * 60 * 60 * 1000);
    
    console.log('✅ Handler de logs agregado al cliente'.green);
};
