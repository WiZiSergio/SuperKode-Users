import chalk from 'chalk';
import { MessageFlags } from 'discord.js';

export default {
    name: 'interactionCreate',
    async execute(interaction) {
        // Manejar comandos slash
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(chalk.red(`❌ No se encontró el comando ${interaction.commandName}`));
                return interaction.reply({
                    content: '❌ Este comando no existe o no está disponible.',
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                console.log(chalk.cyan(`🔧 Ejecutando comando: ${interaction.commandName} por ${interaction.user.username}`));
                await command.execute(interaction);
            } catch (error) {
                console.error(chalk.red(`❌ Error ejecutando comando ${interaction.commandName}:`), error);

                const errorMessage = {
                    content: '❌ Hubo un error al ejecutar este comando.',
                    flags: MessageFlags.Ephemeral
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
            console.log(chalk.yellow(`🔘 Botón presionado: ${interaction.customId} por ${interaction.user.username}`));

            // Intentar ejecutar callback registrado
            const executed = interaction.client.executeButtonCallback(interaction.customId, interaction);

            if (!executed) {
                return interaction.reply({
                    content: '⏰ Esta interacción ha expirado o no es válida.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        // Manejar select menus (para futuro uso)
        else if (interaction.isStringSelectMenu()) {
            console.log(chalk.magenta(`📋 Select menu usado: ${interaction.customId} por ${interaction.user.username}`));
            // Lógica para select menus si es necesaria
        }
    }
};
