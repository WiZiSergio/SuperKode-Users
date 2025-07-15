require('colors');

/**
 * Handler para manejar interacciones de botones
 * @param {Client} client - Cliente de Discord
 */
module.exports = function(client) {
    
    /**
     * Mapa para almacenar callbacks de botones temporales
     */
    client.buttonCallbacks = new Map();
    
    /**
     * Función para registrar un callback de botón temporal
     * @param {string} buttonId - ID único del botón
     * @param {Function} callback - Función a ejecutar cuando se presione el botón
     * @param {number} timeout - Tiempo en ms antes de que expire (default: 60000)
     */
    client.registerButtonCallback = function(buttonId, callback, timeout = 60000) {
        this.buttonCallbacks.set(buttonId, {
            callback,
            expires: Date.now() + timeout
        });
        
        // Auto-limpiar después del timeout
        setTimeout(() => {
            this.buttonCallbacks.delete(buttonId);
        }, timeout);
    };
    
    /**
     * Función para ejecutar callback de botón
     * @param {string} buttonId - ID del botón
     * @param {ButtonInteraction} interaction - Interacción del botón
     * @returns {boolean} True si se ejecutó, false si no existe o expiró
     */
    client.executeButtonCallback = function(buttonId, interaction) {
        const buttonData = this.buttonCallbacks.get(buttonId);
        
        if (!buttonData) {
            return false;
        }
        
        if (Date.now() > buttonData.expires) {
            this.buttonCallbacks.delete(buttonId);
            return false;
        }
        
        try {
            buttonData.callback(interaction);
            return true;
        } catch (error) {
            console.error(`❌ Error ejecutando callback de botón ${buttonId}:`.red, error);
            return false;
        }
    };
    
    /**
     * Función para limpiar callbacks expirados
     */
    client.cleanExpiredButtonCallbacks = function() {
        const now = Date.now();
        for (const [buttonId, buttonData] of this.buttonCallbacks.entries()) {
            if (now > buttonData.expires) {
                this.buttonCallbacks.delete(buttonId);
            }
        }
    };
    
    /**
     * Función para generar ID único para botones
     * @param {string} prefix - Prefijo para el ID
     * @returns {string} ID único
     */
    client.generateButtonId = function(prefix = 'btn') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };
    
    /**
     * Función para crear botones de confirmación estándar
     * @param {string} actionId - ID de la acción
     * @param {Object} options - Opciones de personalización
     * @returns {Object} Objeto con botones y row
     */
    client.createConfirmationButtons = function(actionId, options = {}) {
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        
        const confirmId = this.generateButtonId(`confirm_${actionId}`);
        const cancelId = this.generateButtonId(`cancel_${actionId}`);
        
        const confirmButton = new ButtonBuilder()
            .setCustomId(confirmId)
            .setLabel(options.confirmLabel || '✅ Confirmar')
            .setStyle(options.confirmStyle || ButtonStyle.Success);
            
        const cancelButton = new ButtonBuilder()
            .setCustomId(cancelId)
            .setLabel(options.cancelLabel || '❌ Cancelar')
            .setStyle(options.cancelStyle || ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);
        
        return {
            confirmId,
            cancelId,
            row,
            buttons: { confirmButton, cancelButton }
        };
    };
    
    /**
     * Función para crear botones de selección múltiple
     * @param {string} actionId - ID de la acción
     * @param {Array} options - Array de opciones {label, value, style?, emoji?}
     * @returns {Object} Objeto con botones y rows
     */
    client.createSelectionButtons = function(actionId, options = []) {
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
        
        const buttons = [];
        const buttonIds = [];
        
        options.forEach((option, index) => {
            const buttonId = this.generateButtonId(`select_${actionId}_${index}`);
            buttonIds.push({ id: buttonId, value: option.value });
            
            const button = new ButtonBuilder()
                .setCustomId(buttonId)
                .setLabel(option.label)
                .setStyle(option.style || ButtonStyle.Primary);
                
            if (option.emoji) {
                button.setEmoji(option.emoji);
            }
            
            buttons.push(button);
        });
        
        // Dividir botones en rows (máximo 5 por row)
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(buttons.slice(i, i + 5));
            rows.push(row);
        }
        
        return {
            buttonIds,
            rows,
            buttons
        };
    };
    
    /**
     * Función para manejar timeouts de botones
     * @param {Interaction} interaction - Interacción original
     * @param {number} timeout - Tiempo en ms
     * @returns {Promise} Promise que se resuelve cuando expira
     */
    client.handleButtonTimeout = function(interaction, timeout = 60000) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.editReply({
                            content: '⏰ Esta interacción ha expirado.',
                            components: [],
                            embeds: []
                        });
                    }
                } catch (error) {
                    console.error('Error manejando timeout de botón:'.red, error);
                }
                resolve();
            }, timeout);
        });
    };
    
    /**
     * Función para crear botones de paginación
     * @param {string} actionId - ID de la acción
     * @param {number} currentPage - Página actual
     * @param {number} totalPages - Total de páginas
     * @returns {Object} Objeto con botones de paginación
     */
    client.createPaginationButtons = function(actionId, currentPage, totalPages) {
        const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

        const firstId = this.generateButtonId(`first_${actionId}`);
        const prevId = this.generateButtonId(`prev_${actionId}`);
        const nextId = this.generateButtonId(`next_${actionId}`);
        const lastId = this.generateButtonId(`last_${actionId}`);

        const firstButton = new ButtonBuilder()
            .setCustomId(firstId)
            .setLabel('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1);

        const prevButton = new ButtonBuilder()
            .setCustomId(prevId)
            .setLabel('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 1);

        const nextButton = new ButtonBuilder()
            .setCustomId(nextId)
            .setLabel('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === totalPages);

        const lastButton = new ButtonBuilder()
            .setCustomId(lastId)
            .setLabel('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages);

        const pageInfo = new ButtonBuilder()
            .setCustomId('page_info')
            .setLabel(`${currentPage}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(firstButton, prevButton, pageInfo, nextButton, lastButton);

        return {
            firstId,
            prevId,
            nextId,
            lastId,
            row,
            buttons: { firstButton, prevButton, nextButton, lastButton, pageInfo }
        };
    };

    /**
     * Función para crear botones de acción rápida
     * @param {Array} actions - Array de acciones {id, label, style, emoji}
     * @returns {Object} Objeto con botones de acción
     */
    client.createQuickActionButtons = function(actions) {
        const { ButtonBuilder, ActionRowBuilder } = require('discord.js');

        const buttons = [];
        const buttonIds = [];

        actions.forEach(action => {
            const buttonId = this.generateButtonId(action.id);
            buttonIds.push({ id: buttonId, action: action.id });

            const button = new ButtonBuilder()
                .setCustomId(buttonId)
                .setLabel(action.label)
                .setStyle(action.style);

            if (action.emoji) {
                button.setEmoji(action.emoji);
            }

            buttons.push(button);
        });

        const row = new ActionRowBuilder().addComponents(buttons);

        return { buttonIds, row, buttons };
    };

    // Limpiar callbacks expirados cada 5 minutos
    setInterval(() => {
        client.cleanExpiredButtonCallbacks();
    }, 5 * 60 * 1000);

    console.log('✅ Handler de botones agregado al cliente'.green);
};
