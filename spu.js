const chalk = require('chalk');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadAll } = require('./src/structure/loadfolders');

console.log(chalk.cyan('🚀 Iniciando SuperKode Bot...'));
console.log(chalk.gray('📁 Cargando desde src/structure/'));

// Crear una nueva instancia del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Crear colección para comandos
client.commands = new Collection();

// Manejo de errores del cliente
client.on('error', error => {
    console.error(chalk.red('❌ Error del cliente:'), error.message);
});

// Manejo de errores de proceso
process.on('unhandledRejection', error => {
    console.error(chalk.red('❌ Promesa rechazada no manejada:'), error.message);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log(chalk.red('🛑 Cerrando bot...'));
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log(chalk.red('🛑 Cerrando bot...'));
    client.destroy();
    process.exit(0);
});

// Cargar todos los componentes y configuración
const config = loadAll(client);

// Iniciar sesión con el token del bot
console.log(chalk.yellow('🔐 Conectando a Discord...'));
client.login(config.token)
    .then(() => {
        console.log(chalk.green('✅ Conectado exitosamente a Discord'));
    })
    .catch(error => {
        console.error(chalk.red('❌ Error al conectar a Discord:'), error.message);
        process.exit(1);
    });

// Exportar instancia del bot para uso externo
module.exports = client;
