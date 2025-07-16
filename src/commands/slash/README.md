# 📁 Comandos Slash

Esta carpeta contiene todos los comandos slash (/) del bot, organizados por categorías.

## 📂 Estructura de Carpetas

### 🛡️ **moderation/**
Comandos de moderación para administrar el servidor:
- `ban.js` - Banear usuarios
- `unban.js` - Desbanear usuarios
- `kick.js` - Expulsar usuarios
- `timeout.js` - Aplicar timeout
- `untimeout.js` - Quitar timeout
- `warn.js` - Advertir usuarios
- `unwarn.js` - Quitar advertencias
- `cases.js` - Historial de moderación

### 👑 **owner/**
Comandos exclusivos para propietarios del bot:
- `mod.js` - Gestión de moderadores
- `reload.js` - Recargar componentes del bot

### 🎉 **fun/**
Comandos de entretenimiento y diversión:
- *(Vacía - Lista para futuros comandos)*

### 🔧 **utility/**
Comandos de utilidad general:
- *(Vacía - Lista para futuros comandos)*

## 📝 Formato de Comandos Slash

Todos los comandos slash deben seguir esta estructura:

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comando')
        .setDescription('Descripción del comando'),
    
    async execute(interaction) {
        // Lógica del comando
    }
};
```

## 🔐 Permisos

- **moderation/**: Requiere permisos de moderación
- **owner/**: Solo propietarios del bot (configurados en `owner.js`)
- **fun/**: Disponible para todos los usuarios
- **utility/**: Disponible para todos los usuarios

## 📊 Estado Actual

- **Total comandos:** 10
- **Moderación:** 8 comandos
- **Owner:** 2 comandos
- **Fun:** 0 comandos
- **Utility:** 0 comandos
