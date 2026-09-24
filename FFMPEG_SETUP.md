# Configuración de FFmpeg

El proyecto usa ahora un enfoque portátil: intenta usar primero una copia local de FFmpeg dentro de `vendor/ffmpeg/bin` y solo recurre al sistema si la versión local no está disponible.

## Instalación automática

Al hacer `npm install` o `npm run download:ffmpeg`, el proyecto intenta descargar una build portable de FFmpeg para el sistema operativo actual y dejarla en:

```text
vendor/ffmpeg/bin/
```

## Ruta usada por el bot

El archivo de configuración [src/structure/config/ffmpeg.js](src/structure/config/ffmpeg.js) prioriza esta ruta local:

```js
const VENDOR_FFMPEG_BIN = path.resolve(__dirname, '../../../vendor/ffmpeg/bin');
```

Si el ejecutable local existe, se usa antes que el `PATH` del sistema.

## Si quieres forzar una ruta manual

```js
ffmpeg.setFfmpegPath('C:\\ruta\\a\\ffmpeg\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ruta\\a\\ffmpeg\\bin\\ffprobe.exe');
```

## Verificación

```bash
ffmpeg -version
```

Si la ruta local está disponible, también puede probarse directamente desde la carpeta del proyecto.

## Nota

La conversión del bot depende de FFmpeg para combinar, convertir y validar archivos temporales, por lo que la solución portable evita depender del entorno del usuario u ordenador.
