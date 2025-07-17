# 🔧 Comandos de Utilidad

Esta carpeta contiene comandos de utilidad general para el bot.

## 📋 Comandos Disponibles

### 🎵 `/converter` - Convertidor de YouTube
Convierte videos de YouTube a MP3 o MP4 para descarga.

#### **Subcomandos:**

##### 🎵 `/converter mp3`
Convierte video de YouTube a MP3 (solo audio).

**Parámetros:**
- `url` (requerido) - URL del video de YouTube
- `calidad` (opcional) - Calidad del audio:
  - 🔊 Máxima (320kbps)
  - 🔉 Alta (256kbps)
  - 🔉 Media-Alta (192kbps) - *Por defecto*
  - 🔈 Media (160kbps)
  - 🔈 Baja (128kbps)
  - 📱 Móvil (96kbps)

**Ejemplo:**
```
/converter mp3 url:https://youtu.be/dQw4w9WgXcQ calidad:320
```

##### 🎥 `/converter mp4`
Descarga video de YouTube en formato MP4.

**Parámetros:**
- `url` (requerido) - URL del video de YouTube
- `calidad` (opcional) - Calidad del video:
  - 🎬 1080p (Full HD)
  - 📺 720p (HD)
  - 📱 480p (SD) - *Por defecto*
  - 📞 360p (Móvil)
  - 📟 240p (Baja)
  - 📱 144p (Mínima)

**Ejemplo:**
```
/converter mp4 url:https://youtu.be/dQw4w9WgXcQ calidad:720
```

## 🛡️ Limitaciones de Seguridad

### ⏱️ **Duración Máxima:**
- **30 minutos** por video
- Videos más largos serán rechazados

### 📁 **Tamaño de Archivo:**
- **500 MB máximo** (límite muy alto)
- El bot te avisará si el archivo es demasiado grande

### 🔗 **URLs Soportadas:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### 🚫 **Restricciones:**
- Videos privados o restringidos no funcionarán
- Videos con restricciones de edad pueden fallar
- Solo contenido público de YouTube

## 🔧 Requisitos Técnicos

### 📦 **Dependencias:**
- `ytdl-core` - Para descargar videos de YouTube
- `fluent-ffmpeg` - Para conversión de audio/video
- `FFmpeg` - Debe estar instalado en el sistema

### ⚙️ **Configuración:**
Ver `FFMPEG_SETUP.md` en la raíz del proyecto para instrucciones de instalación de FFmpeg.

## 🎨 Características del Comando

### 📊 **Información Detallada:**
- Título del video
- Canal/autor
- Duración
- Thumbnail
- Progreso de conversión en tiempo real

### 🔄 **Proceso de Conversión:**
1. **Validación** de URL
2. **Verificación** de duración
3. **Descarga** del contenido
4. **Conversión** con FFmpeg
5. **Verificación** de tamaño
6. **Envío** del archivo
7. **Limpieza** automática

### 🧹 **Gestión de Archivos:**
- Archivos temporales se crean en `temp/`
- Limpieza automática después de 5 segundos
- Nombres de archivo seguros y únicos

## 🚨 Manejo de Errores

### ❌ **Errores Comunes:**
- **URL inválida** - Verifica que sea de YouTube
- **Video demasiado largo** - Máximo 10 minutos
- **Archivo muy grande** - Prueba con calidad más baja
- **Video privado** - Solo videos públicos
- **FFmpeg no encontrado** - Instala FFmpeg

### 🔧 **Soluciones:**
- Verifica la instalación de FFmpeg
- Usa URLs completas de YouTube
- Prueba con videos más cortos
- Selecciona calidades más bajas

## 📈 Estadísticas de Uso

### 🎵 **MP3 (Recomendado para):**
- Música
- Podcasts
- Audio de conferencias
- Archivos más pequeños

### 🎥 **MP4 (Recomendado para):**
- Videos musicales
- Tutoriales cortos
- Clips divertidos
- Contenido visual

## 💡 Consejos de Uso

### 🎵 **Audio (MP3):**
1. **Máxima calidad**: 320kbps para música de alta fidelidad
2. **Uso general**: 192kbps para balance calidad/tamaño
3. **Archivos pequeños**: 128kbps para ahorrar espacio
4. **Móvil/streaming**: 96kbps para conexiones lentas

### 🎥 **Video (MP4):**
1. **Máxima calidad**: 1080p para contenido de alta definición
2. **Uso general**: 720p para buen balance calidad/tamaño
3. **Compatibilidad**: 480p para dispositivos antiguos
4. **Archivos pequeños**: 360p o menos para ahorrar espacio
5. **Conexiones lentas**: 240p o 144p para streaming rápido

## 📊 Tabla de Calidades Disponibles

### 🎵 **Audio MP3:**
| Calidad | Bitrate | Uso Recomendado | Tamaño Aprox. (10 min) | Tamaño Aprox. (30 min) |
|---------|---------|-----------------|-------------------------|-------------------------|
| 📱 Móvil | 96kbps | Podcasts, voz | ~7.2 MB | ~21.6 MB |
| 🔈 Baja | 128kbps | Música casual | ~9.6 MB | ~28.8 MB |
| 🔈 Media | 160kbps | Música estándar | ~12.0 MB | ~36.0 MB |
| 🔉 Media-Alta | 192kbps | **Recomendado** | ~14.4 MB | ~43.2 MB |
| 🔉 Alta | 256kbps | Música de calidad | ~19.2 MB | ~57.6 MB |
| 🔊 Máxima | 320kbps | Audiófilo | ~24.0 MB | ~72.0 MB |

### 🎥 **Video MP4:**
| Calidad | Resolución | Uso Recomendado | Tamaño Aprox. (10 min) | Tamaño Aprox. (30 min) |
|---------|------------|-----------------|-------------------------|-------------------------|
| 📱 Mínima | 144p | Conexión muy lenta | ~10-16 MB | ~30-48 MB |
| 📟 Baja | 240p | Conexión lenta | ~16-24 MB | ~48-72 MB |
| 📞 Móvil | 360p | Dispositivos móviles | ~24-36 MB | ~72-108 MB |
| 📱 SD | 480p | **Recomendado** | ~36-50 MB | ~108-150 MB |
| 📺 HD | 720p | Alta definición | ~50-70 MB | ~150-210 MB |
| 🎬 Full HD | 1080p | Máxima calidad | ~70-100 MB | ~210-300 MB |

## 🔮 Futuras Mejoras

- Soporte para playlists
- Conversión a otros formatos
- Recorte de segmentos específicos
- Descarga de subtítulos
- Soporte para otras plataformas

---

**📊 Total de Comandos: 1**  
**🔄 Última Actualización: 16/07/2025**  
**⚠️ Requiere FFmpeg instalado**
