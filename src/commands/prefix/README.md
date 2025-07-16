# 📁 Comandos de Prefijo

Esta carpeta contiene todos los comandos de prefijo tradicionales del bot.

## 🔤 ¿Qué son los Comandos de Prefijo?

Los comandos de prefijo son comandos tradicionales que se ejecutan escribiendo un prefijo seguido del nombre del comando:
- Ejemplo: `!help`, `!ping`, `!ban @usuario`

## 📂 Estructura Recomendada

### 🛡️ **moderation/**
Comandos de moderación con prefijo:
- Versiones alternativas de comandos slash
- Comandos rápidos para moderadores

### 🎉 **fun/**
Comandos de entretenimiento:
- Juegos, memes, interacciones divertidas

### 🔧 **utility/**
Comandos de utilidad:
- Información del servidor, ayuda, configuración

### 👑 **owner/**
Comandos exclusivos para propietarios:
- Comandos de desarrollo y administración

## 📝 Formato de Comandos de Prefijo

```javascript
const chalk = require('chalk');

module.exports = {
    name: 'comando',
    description: 'Descripción del comando',
    usage: '!comando [argumentos]',
    aliases: ['alias1', 'alias2'],
    category: 'categoria',
    permissions: ['PERMISSION_NAME'], // Opcional
    ownerOnly: false, // Opcional
    
    async execute(message, args, client) {
        // Lógica del comando
        
        // Ejemplo de respuesta
        await message.reply('Respuesta del comando');
        
        // Log del comando
        console.log(chalk.blue(`Comando ${this.name} ejecutado por ${message.author.username}`));
    }
};
```

## 🔧 Sistema de Prefijos

El sistema debe manejar:
- **Prefijo configurable** por servidor
- **Aliases** para comandos
- **Cooldowns** para evitar spam
- **Permisos** y verificaciones
- **Ayuda automática** generada

## 💡 Ventajas de los Comandos de Prefijo

- **Rapidez** para usuarios experimentados
- **Flexibilidad** en argumentos
- **Compatibilidad** con bots antiguos
- **Menos restricciones** que los slash commands

## 📊 Estado Actual

- **Total comandos:** 0
- **Moderación:** 0 comandos
- **Fun:** 0 comandos
- **Utility:** 0 comandos
- **Owner:** 0 comandos

*Esta carpeta está lista para recibir comandos de prefijo.*

## 🚀 Implementación Futura

Para implementar comandos de prefijo se necesitará:
1. **Handler de mensajes** en events
2. **Sistema de prefijos** configurable
3. **Parser de argumentos**
4. **Sistema de permisos**
5. **Comando de ayuda** automático
