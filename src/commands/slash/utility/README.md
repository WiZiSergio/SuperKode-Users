# Utilidades del bot

La utilidad principal de esta carpeta es el comando `/converter`.

## Comando activo

### `/converter`

Permite convertir videos de YouTube a MP3 o MP4.

#### Subcomandos

- `/converter mp3`
- `/converter mp4`

#### Parámetros principales

- `url`: enlace de YouTube
- `calidad`: resolución o bitrate según el formato seleccionado

## Ejemplos

```text
/converter mp3 url:https://youtu.be/VIDEO_ID calidad:192
/converter mp4 url:https://youtu.be/VIDEO_ID calidad:720
```

## Requisitos

- Node.js 22+
- Discord.js v14
- FFmpeg instalado y disponible en PATH

## Comentario

Esta carpeta es la zona de utilidades generales del bot. El enfoque actual del proyecto está en comandos slash y moderación, no en handlers legacy ni comandos prefix.
