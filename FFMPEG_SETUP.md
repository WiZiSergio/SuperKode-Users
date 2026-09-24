# Configuración de FFmpeg

Para que el comando `/converter` funcione correctamente, FFmpeg debe estar instalado y disponible en la PATH del sistema.

## Windows

### Winget

```powershell
winget install --id Gyan.Dev.FFmpeg -e
```

> Reinicia la terminal después de la instalación y comprueba con `ffmpeg -version`.

### Chocolatey

```powershell
choco install ffmpeg
```

### Instalación manual

1. Descarga FFmpeg desde https://www.ffmpeg.org/download.html
2. Extrae el paquete
3. Añade la carpeta `bin` al PATH del sistema

## Linux

### Ubuntu/Debian

```bash
sudo apt update && sudo apt install ffmpeg
```

### Arch

```bash
sudo pacman -S ffmpeg
```

## macOS

```bash
brew install ffmpeg
```

## Verificación

```bash
ffmpeg -version
```

Si el comando muestra la versión, la instalación está correcta.

## Solución rápida si falla

- Revisa que `ffmpeg` y `ffprobe` estén en PATH
- Reinicia la terminal o el proceso del bot
- Si sigue fallando, configura rutas explícitas en la configuración de FFmpeg del proyecto

## Ruta fija en el proyecto

Si quieres forzar la ruta directamente en la app, el proyecto intenta resolverla automáticamente en `src/structure/config/ffmpeg.js` usando rutas típicas de Windows, Linux y macOS. Si tu instalación está en otra carpeta, puedes cambiarla aquí mismo:

```js
ffmpeg.setFfmpegPath('C:\\ruta\\a\\ffmpeg\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\ruta\\a\\ffmpeg\\bin\\ffprobe.exe');
```

## Nota

La conversión del bot depende de FFmpeg para combinar, convertir y validar archivos temporales.
