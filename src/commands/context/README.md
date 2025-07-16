# 📁 Comandos de Contexto

Esta carpeta contiene todos los comandos de contexto (menú contextual) del bot.

## 🖱️ ¿Qué son los Comandos de Contexto?

Los comandos de contexto aparecen cuando haces clic derecho en:
- **Usuarios** (User Context Commands)
- **Mensajes** (Message Context Commands)

## 📂 Estructura Recomendada

### 👤 **user/**
Comandos que aparecen al hacer clic derecho en un usuario:
- Ejemplos: Ver perfil, moderar usuario, obtener información

### 💬 **message/**
Comandos que aparecen al hacer clic derecho en un mensaje:
- Ejemplos: Reportar mensaje, traducir, obtener información

## 📝 Formato de Comandos de Contexto

### Comando de Usuario:
```javascript
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Nombre del Comando')
        .setType(ApplicationCommandType.User),
    
    async execute(interaction) {
        const targetUser = interaction.targetUser;
        // Lógica del comando
    }
};
```

### Comando de Mensaje:
```javascript
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Nombre del Comando')
        .setType(ApplicationCommandType.Message),
    
    async execute(interaction) {
        const targetMessage = interaction.targetMessage;
        // Lógica del comando
    }
};
```

## 💡 Ideas para Comandos de Contexto

### Usuario:
- **Ver Casos** - Historial de moderación rápido
- **Información** - Datos del usuario
- **Moderar** - Acciones rápidas de moderación

### Mensaje:
- **Reportar** - Reportar contenido inapropiado
- **Traducir** - Traducir mensaje
- **Información** - Datos del mensaje

## 📊 Estado Actual

- **Total comandos:** 0
- **Usuario:** 0 comandos
- **Mensaje:** 0 comandos

*Esta carpeta está lista para recibir comandos de contexto.*
