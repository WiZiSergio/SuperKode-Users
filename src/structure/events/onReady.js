module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ Bot conectado como ${client.user.tag}`);
        console.log(`🔧 Sirviendo a ${client.guilds.cache.size} servidores`);
        console.log(`👥 Sirviendo a ${client.users.cache.size} usuarios`);

        console.log('🎉 SuperKode Bot está listo para funcionar!');
    }
};
