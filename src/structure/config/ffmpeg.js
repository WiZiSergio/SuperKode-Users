import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import ffmpeg from 'fluent-ffmpeg';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuración de FFmpeg para el bot
 */

const WINDOWS_CANDIDATES = [
    'C:\\Program Files\\ffmpeg\\bin',
    'C:\\ffmpeg\\bin',
    'C:\\Program Files\\Git\\usr\\bin',
    'C:\\Program Files\\Gyan\\FFmpeg\\bin',
    'C:\\Program Files\\Gyan\\Gyan\\FFmpeg\\bin',
    'C:\\Program Files\\Microsoft\\Git\\bin'
];

const UNIX_CANDIDATES = [
    '/usr/local/bin',
    '/usr/bin',
    '/opt/homebrew/bin',
    '/opt/local/bin',
    '/snap/bin'
];

function findBinary(binaryName) {
    const searchPaths = process.platform === 'win32'
        ? [...WINDOWS_CANDIDATES, ...(process.env.PATH ? process.env.PATH.split(path.delimiter) : [])]
        : [...UNIX_CANDIDATES, ...(process.env.PATH ? process.env.PATH.split(path.delimiter) : [])];

    for (const searchPath of searchPaths) {
        if (!searchPath) continue;

        const candidate = path.join(searchPath, binaryName);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    try {
        const output = execSync(`where ${binaryName}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        const resolved = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
        if (resolved) return resolved;
    } catch {
        // Ignorado
    }

    try {
        const output = execSync(`which ${binaryName}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        const resolved = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
        if (resolved) return resolved;
    } catch {
        // Ignorado
    }

    return null;
}

try {
    const ffmpegPath = findBinary(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    const ffprobePath = findBinary(process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');

    if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
    }

    if (ffprobePath) {
        ffmpeg.setFfprobePath(ffprobePath);
    }

    console.log(chalk.green('✅ FFmpeg configurado correctamente'));
    if (ffmpegPath) console.log(chalk.gray(`   ffmpeg: ${ffmpegPath}`));
    if (ffprobePath) console.log(chalk.gray(`   ffprobe: ${ffprobePath}`));
} catch (error) {
    console.warn(chalk.yellow('⚠️ FFmpeg no configurado automáticamente:', error.message));
    console.log(chalk.cyan('💡 Para usar el comando converter, instala FFmpeg:'));
    console.log(chalk.cyan('   • Windows: https://www.ffmpeg.org/download.html#build-windows'));
    console.log(chalk.cyan('   • O usa: winget install --id Gyan.Dev.FFmpeg -e'));
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
