import chalk from 'chalk';
import { registerSlashCommands } from '../commands/loadCommands.js';

export default {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(chalk.green(`✅ Bot conectado como ${client.user.tag}`));
        console.log(chalk.blue(`🔧 Sirviendo a ${client.guilds.cache.size} servidores`));

        // Calcular total de miembros en todos los servidores
        let totalMembers = 0;
        client.guilds.cache.forEach(guild => {
            totalMembers += guild.memberCount;
        });

        console.log(chalk.blue(`👥 Sirviendo a ${totalMembers} usuarios`));
        console.log(chalk.magenta('🎉 SuperKode Bot está listo para funcionar!'));

        // Registrar comandos slash en el guild configurado
        await registerSlashCommands(client);
    }
};
