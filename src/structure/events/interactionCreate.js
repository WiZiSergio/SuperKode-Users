require('colors');
const { InteractionResponseFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Manejar comandos slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`❌ No se encontró el comando ${interaction.commandName}`.red);
                return interaction.reply({
                    content: '❌ Este comando no existe o no está disponible.',
                    flags: InteractionResponseFlags.Ephemeral
                });
            }

            try {
                console.log(`🔧 Ejecutando comando: ${interaction.commandName} por ${interaction.user.username}`.cyan);
                await command.execute(interaction);
            } catch (error) {
                console.error(`❌ Error ejecutando comando ${interaction.commandName}:`.red, error);

                const errorMessage = {
                    content: '❌ Hubo un error al ejecutar este comando.',
                    flags: InteractionResponseFlags.Ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Manejar interacciones de botones
        else if (interaction.isButton()) {
            console.log(`🔘 Botón presionado: ${interaction.customId} por ${interaction.user.username}`.yellow);

            // Intentar ejecutar callback registrado
            const executed = interaction.client.executeButtonCallback(interaction.customId, interaction);

            if (!executed) {
                return interaction.reply({
                    content: '⏰ Esta interacción ha expirado o no es válida.',
                    flags: InteractionResponseFlags.Ephemeral
                });
            }
        }

        // Manejar select menus (para futuro uso)
        else if (interaction.isStringSelectMenu()) {
            console.log(`📋 Select menu usado: ${interaction.customId} por ${interaction.user.username}`.magenta);
            // Lógica para select menus si es necesaria
        }
    }
};
