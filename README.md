# SuperKode Bot

Bot de Discord moderno para moderación y utilidades, construido con Node 22+ y Discord.js v14.

## Overview

Este proyecto incluye:

- Sistema de moderación con sanciones por roles y usuarios
- Comandos slash
- Gestión de configuración por entorno
- Carga dinámica de comandos, handlers y eventos
- Conversor de YouTube a MP3/MP4

## Tech stack

- Node.js 22+
- Discord.js v14
- ESM modules
- FFmpeg
- dotenv

## Requirements

- Node.js 22 or newer
- FFmpeg installed and available in PATH
- Discord bot token
- Discord application/client ID

## Installation

```bash
npm install
```

Create the environment file:

```bash
src/structure/config/configbot/.env
```

Example:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
```

## Run

```bash
node spu.js
```

## Project structure

```text
SuperKode-Users/
├── README.md
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
└── .gitignore
```

## Main commands

- Moderation commands
- Owner commands
- Utility commands
- Converter utility

## Security notes

- Keep the bot token private
- Do not commit the `.env` file
- Use environment variables instead of hardcoded secrets

## Documentation

- [CONVERTER_EXAMPLES.md](CONVERTER_EXAMPLES.md)
- [FFMPEG_SETUP.md](FFMPEG_SETUP.md)
- [STREAM_COMBINATION_SYSTEM.md](STREAM_COMBINATION_SYSTEM.md)

## Author

WiZiSergio


