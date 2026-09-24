# SuperKode Bot

Bot de Discord moderno para moderación, gestión y utilidades, diseñado para Node 22+ y Discord.js v14 con enfoque en comandos slash.

## ✅ Estado actual

- Node recomendado: 22+ / 25+
- Módulo: ESM (`"type": "module"`)
- Biblioteca principal: `discord.js` v14
- Comandos: slash commands
- Moderación: gestión de advertencias, timeout, kick, ban, etc.
- Utilidades: conversor de YouTube a MP3/MP4

## 🚀 Requisitos

- Node.js 22 o superior
- FFmpeg instalado y accesible en PATH
- Token de bot de Discord
- Cliente Discord configurado en el portal de desarrolladores

## ⚙️ Instalación

```bash
npm install
```

Crea o edita el archivo de entorno:

```bash
src/structure/config/configbot/.env
```

Ejemplo:

```env
DISCORD_TOKEN=tu_token_aqui
DISCORD_CLIENT_ID=tu_client_id_aqui
```

## ▶️ Ejecutar

```bash
node spu.js
```

## 🧩 Estructura principal

```text
SuperKode-Users/
├── package.json
├── spu.js
├── src/
│   ├── commands/
│   │   ├── context/
│   │   └── slash/
│   ├── moderation/
│   ├── structure/
│   │   ├── commands/
│   │   ├── config/
│   │   ├── databases/
│   │   ├── events/
│   │   └── handlers/
│   └── temp/
├── CONVERTER_EXAMPLES.md
├── FFMPEG_SETUP.md
├── STREAM_COMBINATION_SYSTEM.md
└── README.md
```

## 🛡️ Funcionalidades principales

- Comandos slash de moderación
- Sistema de advertencias y casos
- Timeouts, expulsiones y sanciones por roles
- Gestión de propietarios y configuración del servidor
- Conversor de YouTube a MP3/MP4
- Carga dinámica de comandos, eventos y handlers

## 🔒 Seguridad

- No compartas el token del bot
- Mantén el archivo `.env` fuera del control de versiones
- Usa solo variables de entorno y no valores fijos en el código

## 📚 Documentación útil

- [CONVERTER_EXAMPLES.md](CONVERTER_EXAMPLES.md)
- [FFMPEG_SETUP.md](FFMPEG_SETUP.md)
- [STREAM_COMBINATION_SYSTEM.md](STREAM_COMBINATION_SYSTEM.md)

## 👤 Autor

WiZiSergio


