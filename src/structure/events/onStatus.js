require('colors');
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: false,
    execute(client) {
        // Calcular total de miembros
        let totalMembers = 0;
        client.guilds.cache.forEach(guild => {
            totalMembers += guild.memberCount;
        });

        // Array de estados que rotarán
        const statuses = [
            { name: 'SuperKode Bot', type: ActivityType.Watching },
            { name: `${client.guilds.cache.size} servidores`, type: ActivityType.Watching },
            { name: `${totalMembers} usuarios`, type: ActivityType.Watching },
            { name: 'comandos de ayuda', type: ActivityType.Listening },
            { name: 'con Discord.js', type: ActivityType.Playing },
            { name: 'el código', type: ActivityType.Competing }
        ];

        let currentIndex = 0;

        // Función para cambiar el estado
        const updateStatus = () => {
            const status = statuses[currentIndex];
            client.user.setActivity(status.name, { type: status.type });
            
            console.log(`🔄 Estado actualizado: ${status.name}`.cyan);
            
            // Pasar al siguiente estado
            currentIndex = (currentIndex + 1) % statuses.length;
        };

        // Establecer el primer estado inmediatamente
        updateStatus();

        // Cambiar estado cada 30 segundos (30000 ms)
        setInterval(updateStatus, 30000);
    }
};
