# Comandos de contexto

Esta carpeta está preparada para futuros comandos de contexto, pero actualmente no hay ninguna implementación activa en el proyecto.

## Estado actual

- No hay comandos de contexto registrados en la app
- La estructura queda disponible para futuras extensiones
- La base del proyecto usa comandos slash como interfaz principal

## Ejemplo mínimo

```js
import { ContextMenuCommandBuilder, ApplicationCommandType } from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('info-usuario')
    .setType(ApplicationCommandType.User),

  async execute(interaction) {
    await interaction.reply({ content: `Usuario: ${interaction.targetUser.tag}` });
  }
};
```

## Recomendación

Se mantiene esta carpeta reservada para comandos de usuario o mensajes, pero el bot actual se centra en comandos slash y utilidades de moderación.
