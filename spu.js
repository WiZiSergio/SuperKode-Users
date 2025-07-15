require('colors');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadAll } = require('./src/structure/loadfolders');

console.log('🚀 Iniciando SuperKode Bot...'.cyan);
console.log('📁 Cargando desde src/structure/'.gray);

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
    console.error('❌ Error del cliente:'.red, error.message);
});

// Manejo de errores de proceso
process.on('unhandledRejection', error => {
    console.error('❌ Promesa rechazada no manejada:'.red, error.message);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Cerrando bot...'.red);
    client.destroy();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Cerrando bot...'.red);
    client.destroy();
    process.exit(0);
});

// Cargar todos los componentes y configuración
const config = loadAll(client);

// Iniciar sesión con el token del bot
console.log('🔐 Conectando a Discord...'.yellow);
client.login(config.token)
    .then(() => {
        console.log('✅ Conectado exitosamente a Discord'.green);
    })
    .catch(error => {
        console.error('❌ Error al conectar a Discord:'.red, error.message);
        process.exit(1);
    });

// Exportar instancia del bot para uso externo
module.exports = client;
