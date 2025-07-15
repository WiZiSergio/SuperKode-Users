const fs = require('fs');
const path = require('path');

/**
 * Administrador de bases de datos JSON
 */
class DatabaseManager {
    constructor() {
        this.basesPath = path.join(__dirname, 'bases');
        this.ensureBasesDirectory();
    }

    /**
     * Asegura que la carpeta bases exista
     */
    ensureBasesDirectory() {
        if (!fs.existsSync(this.basesPath)) {
            fs.mkdirSync(this.basesPath, { recursive: true });
            console.log('[DATABASE] Carpeta bases creada');
        }
    }

    /**
     * Obtiene la ruta completa de una base de datos
     * @param {string} dbName - Nombre de la base de datos (sin extensión)
     * @returns {string} - Ruta completa del archivo
     */
    getDbPath(dbName) {
        return path.join(this.basesPath, `${dbName}.json`);
    }

    /**
     * Crea una nueva base de datos si no existe
     * @param {string} dbName - Nombre de la base de datos
     * @param {any} defaultData - Datos por defecto (array o objeto)
     * @returns {boolean} - True si se creó, false si ya existía
     */
    createDatabase(dbName, defaultData = []) {
        const dbPath = this.getDbPath(dbName);
        
        if (!fs.existsSync(dbPath)) {
            this.writeDatabase(dbName, defaultData);
            console.log(`[DATABASE] Base de datos creada: ${dbName}.json`);
            return true;
        }
        
        return false;
    }

    /**
     * Lee una base de datos
     * @param {string} dbName - Nombre de la base de datos
     * @returns {any} - Datos de la base de datos o null si no existe
     */
    readDatabase(dbName) {
        const dbPath = this.getDbPath(dbName);
        
        try {
            if (fs.existsSync(dbPath)) {
                const data = fs.readFileSync(dbPath, 'utf8');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error(`[DATABASE] Error al leer ${dbName}:`, error.message);
            return null;
        }
    }

    /**
     * Escribe datos en una base de datos
     * @param {string} dbName - Nombre de la base de datos
     * @param {any} data - Datos a escribir
     * @returns {boolean} - True si se escribió correctamente
     */
    writeDatabase(dbName, data) {
        const dbPath = this.getDbPath(dbName);
        
        try {
            fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`[DATABASE] Error al escribir ${dbName}:`, error.message);
            return false;
        }
    }

    /**
     * Agrega un registro a una base de datos (asume que es un array)
     * @param {string} dbName - Nombre de la base de datos
     * @param {any} record - Registro a agregar
     * @returns {boolean} - True si se agregó correctamente
     */
    addRecord(dbName, record) {
        let data = this.readDatabase(dbName);
        
        if (data === null) {
            // Si no existe, crear con el registro
            data = [record];
        } else if (Array.isArray(data)) {
            data.push(record);
        } else {
            console.error(`[DATABASE] ${dbName} no es un array, no se puede agregar registro`);
            return false;
        }
        
        return this.writeDatabase(dbName, data);
    }

    /**
     * Obtiene todos los registros de una base de datos
     * @param {string} dbName - Nombre de la base de datos
     * @returns {any[]} - Array de registros o array vacío
     */
    getAllRecords(dbName) {
        const data = this.readDatabase(dbName);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Busca registros que cumplan una condición
     * @param {string} dbName - Nombre de la base de datos
     * @param {function} condition - Función de condición
     * @returns {any[]} - Array de registros que cumplen la condición
     */
    findRecords(dbName, condition) {
        const data = this.getAllRecords(dbName);
        return data.filter(condition);
    }

    /**
     * Cuenta los registros en una base de datos
     * @param {string} dbName - Nombre de la base de datos
     * @returns {number} - Número de registros
     */
    countRecords(dbName) {
        const data = this.getAllRecords(dbName);
        return data.length;
    }

    /**
     * Elimina una base de datos
     * @param {string} dbName - Nombre de la base de datos
     * @returns {boolean} - True si se eliminó correctamente
     */
    deleteDatabase(dbName) {
        const dbPath = this.getDbPath(dbName);
        
        try {
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath);
                console.log(`[DATABASE] Base de datos eliminada: ${dbName}.json`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[DATABASE] Error al eliminar ${dbName}:`, error.message);
            return false;
        }
    }

    /**
     * Lista todas las bases de datos disponibles
     * @returns {string[]} - Array con nombres de bases de datos
     */
    listDatabases() {
        try {
            const files = fs.readdirSync(this.basesPath);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
        } catch (error) {
            console.error('[DATABASE] Error al listar bases de datos:', error.message);
            return [];
        }
    }
}

// Crear instancia singleton
const dbManager = new DatabaseManager();

module.exports = dbManager;
