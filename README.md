# SuperKode Bot

Bot de Discord desarrollado por WiZiSergio para la gestión de usuarios de SuperKode.

## 🚀 Configuración

### 1. Instalar dependencias
```bash
npm install discord.js dotenv
```

### 2. Configurar el bot
1. Ve a la carpeta `src/structure/config/configbot/`
2. Copia el archivo `.env.example` y renómbralo a `.env`
3. Edita el archivo `.env` y configura:
   - `DISCORD_TOKEN`: Tu token del bot de Discord
   - `DISCORD_CLIENT_ID`: El ID de tu aplicación/bot de Discord

```env
DISCORD_TOKEN=tu_token_real_aqui
DISCORD_CLIENT_ID=tu_client_id_aqui
NODE_ENV=development
LOG_LEVEL=info
```

**¿Cómo obtener estos valores?**
- **Token**: Ve a [Discord Developer Portal](https://discord.com/developers/applications) → Tu aplicación → Bot → Token
- **Client ID**: Ve a [Discord Developer Portal](https://discord.com/developers/applications) → Tu aplicación → General Information → Application ID

### 3. Ejecutar el bot
```bash
node spu.js
```

## 📁 Estructura del proyecto

```
📁 SuperKode-Users/
├── 📄 spu.js (archivo de arranque del bot)
└── 📁 src/
    ├── 📁 commands/ (comandos organizados por categorías)
    │   ├── 📁 admin/
    │   ├── 📁 fun/
    │   ├── 📁 moderation/
    │   └── 📁 utility/
    └── 📁 structure/
        ├── 📄 loadfolders.js (cargador de componentes)
        ├── 📁 config/
        │   └── 📁 configbot/
        │       ├── 📄 .env (variables de entorno - no incluido en git)
        │       └── 📄 .env.example (ejemplo de variables de entorno)
        ├── 📁 events/ (eventos del bot)
        ├── 📁 handlers/ (manejadores)
        └── 📁 databases/ (base de datos)
```

## ⚠️ Importante
- **Nunca compartas tu token de Discord o Client ID**
- El archivo `.env` está excluido del control de versiones por seguridad
- Usa `.env.example` como referencia para la configuración
- La configuración ahora usa variables de entorno para mayor seguridad
- Asegúrate de tener tanto el token como el Client ID configurados

## Contribución
Desarrollado por WiZiSergio.


