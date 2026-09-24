import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'fluent-ffmpeg';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuración de FFmpeg para el bot
 */

// Configurar rutas de FFmpeg (ajustar según la instalación)
// En Windows, FFmpeg debe estar instalado y en el PATH
// O especificar rutas absolutas aquí

try {
    // Intentar configurar FFmpeg automáticamente
    // Si FFmpeg está en el PATH del sistema, esto debería funcionar
    
    // Para Windows con FFmpeg en PATH:
    // ffmpeg.setFfmpegPath('ffmpeg');
    // ffmpeg.setFfprobePath('ffprobe');
    
    // Para instalaciones personalizadas, descomentar y ajustar:
    // ffmpeg.setFfmpegPath('C:\\path\\to\\ffmpeg\\bin\\ffmpeg.exe');
    // ffmpeg.setFfprobePath('C:\\path\\to\\ffmpeg\\bin\\ffprobe.exe');
    
    console.log(chalk.green('✅ FFmpeg configurado correctamente'));
    
} catch (error) {
    console.warn(chalk.yellow('⚠️ FFmpeg no configurado automáticamente:', error.message));
    console.log(chalk.cyan('💡 Para usar el comando converter, instala FFmpeg:'));
    console.log(chalk.cyan('   • Windows: https://ffmpeg.org/download.html#build-windows'));
    console.log(chalk.cyan('   • O usa: winget install ffmpeg'));
}

/**
 * Verificar si FFmpeg está disponible
 * @returns {Promise<boolean>} True si FFmpeg está disponible
 */
function checkFFmpegAvailability() {
    return new Promise((resolve) => {
        ffmpeg.getAvailableFormats((err, formats) => {
            if (err) {
                console.warn(chalk.yellow('⚠️ FFmpeg no está disponible:', err.message));
                resolve(false);
            } else {
                console.log(chalk.green('✅ FFmpeg está disponible y funcionando'));
                resolve(true);
            }
        });
    });
}

/**
 * Configuraciones predeterminadas para conversión
 */
const CONVERSION_SETTINGS = {
    mp3: {
        codec: 'libmp3lame',
        bitrates: {
            '96': '96k',
            '128': '128k',
            '160': '160k',
            '192': '192k',
            '256': '256k',
            '320': '320k',
            '384': '384k',
            '448': '448k'
        },
        format: 'mp3'
    },
    mp4: {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        qualities: {
            '144': '256x144',
            '240': '426x240',
            '360': '640x360',
            '480': '854x480',
            '540': '960x540',
            '720': '1280x720',
            '900': '1600x900',
            '1080': '1920x1080',
            '1440': '2560x1440'
        },
        format: 'mp4'
    }
};

/**
 * Límites de procesamiento
 */
const LIMITS = {
    maxDuration: 1800, // 30 minutos en segundos
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2 GB en bytes (límite optimizado sin 4K)
    tempDir: path.join(__dirname, '../../../temp'),
    cleanupDelay: 5000 // 5 segundos para limpiar archivos temporales
};

export {
    ffmpeg,
    checkFFmpegAvailability,
    CONVERSION_SETTINGS,
    LIMITS
};

export default {
    ffmpeg,
    checkFFmpegAvailability,
    CONVERSION_SETTINGS,
    LIMITS
};
