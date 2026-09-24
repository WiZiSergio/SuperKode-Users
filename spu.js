import chalk from 'chalk';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadAll } from './src/structure/loadfolders.js';

console.log(chalk.cyan('🚀 Iniciando SuperKode Bot...'));
console.log(chalk.gray('📁 Cargando desde src/structure/'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.commands = new Collection();

client.on('error', error => {
    console.error(chalk.red('❌ Error del cliente:'), error.message);
});

process.on('unhandledRejection', error => {
    console.error(chalk.red('❌ Promesa rechazada no manejada:'), error.message);
});

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

const config = await loadAll(client);

console.log(chalk.yellow('🔐 Conectando a Discord...'));
try {
    await client.login(config.token);
    console.log(chalk.green('✅ Conectado exitosamente a Discord'));
} catch (error) {
    console.error(chalk.red('❌ Error al conectar a Discord:'), error.message);
    process.exit(1);
}

export default client;
