const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadAll } = require('./src/structure/loadfolders');

// Crear una nueva instancia del cliente de Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// Crear colección para comandos
client.commands = new Collection();

// Manejo de errores
client.on('error', error => {
    console.error('❌ Error del cliente:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ Promesa rechazada no manejada:', error);
});

// Cargar todos los componentes y configuración
console.log('🚀 Iniciando SuperKode Bot...');
const config = loadAll(client);

// Iniciar sesión con el token del bot
client.login(config.token);
