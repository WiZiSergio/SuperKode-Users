require('colors');
const { registerSlashCommands } = require('../commands/loadCommands');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`✅ Bot conectado como ${client.user.tag}`.green);
        console.log(`🔧 Sirviendo a ${client.guilds.cache.size} servidores`.blue);

        // Calcular total de miembros en todos los servidores
        let totalMembers = 0;
        client.guilds.cache.forEach(guild => {
            totalMembers += guild.memberCount;
        });

        console.log(`👥 Sirviendo a ${totalMembers} usuarios`.blue);
        console.log('🎉 SuperKode Bot está listo para funcionar!'.magenta);

        // Registrar comandos slash en el guild configurado
        await registerSlashCommands(client);
    }
};
