# 🎥 Configuración de FFmpeg para el Comando Converter

Para que el comando `/converter` funcione correctamente, necesitas tener **FFmpeg** instalado en tu sistema.

## 🪟 Instalación en Windows

### Método 1: Usando Winget (Recomendado)
```bash
winget install ffmpeg
```

### Método 2: Descarga Manual
1. Ve a https://ffmpeg.org/download.html#build-windows
2. Descarga la versión "release builds"
3. Extrae el archivo ZIP
4. Agrega la carpeta `bin` al PATH del sistema

### Método 3: Usando Chocolatey
```bash
choco install ffmpeg
```

## 🐧 Instalación en Linux

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

### CentOS/RHEL:
```bash
sudo yum install ffmpeg
```

### Arch Linux:
```bash
sudo pacman -S ffmpeg
```

## 🍎 Instalación en macOS

### Usando Homebrew:
```bash
brew install ffmpeg
```

## ✅ Verificar Instalación

Después de instalar, verifica que FFmpeg esté disponible:

```bash
ffmpeg -version
```

Si ves información de la versión, FFmpeg está correctamente instalado.

## 🔧 Configuración Manual

Si FFmpeg no está en el PATH del sistema, puedes configurar las rutas manualmente en:
`src/structure/config/ffmpeg.js`

```javascript
// Descomentar y ajustar estas líneas:
ffmpeg.setFfmpegPath('C:\\path\\to\\ffmpeg\\bin\\ffmpeg.exe');
ffmpeg.setFfprobePath('C:\\path\\to\\ffmpeg\\bin\\ffprobe.exe');
```

## 🚨 Solución de Problemas

### Error: "Cannot find ffmpeg"
- **Causa:** FFmpeg no está instalado o no está en el PATH
- **Solución:**
  1. Instala FFmpeg usando los comandos de arriba
  2. Reinicia la terminal/consola
  3. Reinicia el bot
  4. Vuelve a intentar el comando

### Error: "Could not extract functions"
- **Causa:** YouTube cambió su API temporalmente
- **Solución:**
  1. Espera unos minutos e intenta de nuevo
  2. Verifica que la URL sea correcta
  3. Intenta con otro video
  4. El bot usa `@distube/ytdl-core` que es más estable

### Error: "Video unavailable"
- **Causa:** Video privado, eliminado o con restricciones
- **Solución:**
  1. Verifica que el video sea público
  2. Intenta con otro video
  3. Asegúrate de que la URL sea correcta

### Error: "spawn ffmpeg ENOENT"
- FFmpeg no está en el PATH
- Configura las rutas manualmente en `ffmpeg.js`

### Error: "Permission denied"
- En Linux/macOS, asegúrate de que FFmpeg tenga permisos de ejecución
- Usa `chmod +x` si es necesario

## 📊 Características del Comando Converter

Una vez configurado FFmpeg, el comando `/converter` podrá:

### 🎵 Conversión a MP3:
- **Calidades disponibles:** 96kbps, 128kbps, 160kbps, 192kbps, 256kbps, 320kbps
- **Extracción de audio** de alta calidad
- **Archivos optimizados** para diferentes usos
- **Recomendado:** 192kbps para uso general

### 🎥 Descarga de MP4:
- **Calidades disponibles:** 144p, 240p, 360p, 480p, 720p, 1080p
- **Mantiene audio y video** sincronizados
- **Compresión optimizada** por calidad
- **Recomendado:** 480p para uso general

### 🛡️ Limitaciones de Seguridad:
- Máximo 30 minutos de duración
- Máximo 500MB de tamaño final
- Solo URLs válidas de YouTube
- Limpieza automática de archivos temporales

## 💡 Consejos de Uso

### 🎵 **Para Audio (MP3):**
1. **Música de alta calidad**: 320kbps o 256kbps
2. **Uso general**: 192kbps (buen balance)
3. **Archivos pequeños**: 128kbps o 96kbps
4. **Podcasts/voz**: 96kbps es suficiente

### 🎥 **Para Video (MP4):**
1. **Máxima calidad**: 1080p (archivos grandes)
2. **Uso general**: 720p o 480p (recomendado)
3. **Dispositivos móviles**: 360p o 240p
4. **Archivos pequeños**: 240p o 144p

### 🔧 **Optimización:**
- **Videos largos**: Usa calidades más bajas
- **Límite de 50MB**: El bot te avisará si se excede
- **URLs soportadas**:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://m.youtube.com/watch?v=VIDEO_ID`

## 🔄 Comandos Disponibles

```
/converter mp3 url:https://youtu.be/VIDEO_ID calidad:192
/converter mp4 url:https://youtu.be/VIDEO_ID calidad:480
```

---

**⚠️ Nota Legal**: Este comando es solo para uso personal y educativo. Respeta los derechos de autor y las políticas de YouTube.
