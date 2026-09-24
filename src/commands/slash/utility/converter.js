import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import youtubedl from 'youtube-dl-exec';
import { ffmpeg, LIMITS } from '../../../structure/config/ffmpeg.js';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

async function isValidYouTubeUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be');
    } catch {
        return false;
    }
}

function normalizeFormatInfo(format) {
    const mimeType = format?.mimeType || format?.ext ? `${format.ext || 'unknown'}` : '';
    const hasAudio = typeof format?.acodec === 'string' || format?.vcodec === null || format?.audioQuality || !!format?.abr;
    const hasVideo = typeof format?.vcodec === 'string' || typeof format?.height === 'number' || typeof format?.width === 'number';
    const container = format?.container || (mimeType.includes('/') ? mimeType.split('/')[1].split(';')[0] : 'unknown');
    const audioBitrate = format?.average_bitrate ? Math.round(format.average_bitrate / 1000) : (format?.abr ? Math.round(Number(format.abr)) : undefined);

    return {
        ...format,
        hasAudio,
        hasVideo,
        container,
        audioBitrate,
        height: Number(format?.height) || null,
        qualityLabel: format?.qualityLabel || format?.format_note || format?.quality || `${format?.height || 'unknown'}p`,
        url: format?.url || null,
        mimeType: mimeType || format?.format_note || '',
    };
}

export default {
    data: new SlashCommandBuilder()
        .setName('converter')
        .setDescription('🎵 Convertir videos de YouTube a MP3 o MP4')
        .addSubcommand(subcommand =>
            subcommand
                .setName('mp3')
                .setDescription('🎵 Convertir video de YouTube a MP3')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL del video de YouTube')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('calidad')
                        .setDescription('Calidad del audio')
                        .addChoices(
                            { name: '🎵 Máxima Profesional (448kbps)', value: '448' },
                            { name: '🔊 Ultra Alta (384kbps)', value: '384' },
                            { name: '🔊 Máxima (320kbps)', value: '320' },
                            { name: '🔉 Alta (256kbps)', value: '256' },
                            { name: '🔉 Media-Alta (192kbps)', value: '192' },
                            { name: '🔈 Media (160kbps)', value: '160' },
                            { name: '🔈 Baja (128kbps)', value: '128' },
                            { name: '📱 Móvil (96kbps)', value: '96' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('mp4')
                .setDescription('🎥 Convertir/descargar video de YouTube a MP4')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL del video de YouTube')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('calidad')
                        .setDescription('Calidad del video')
                        .addChoices(
                            { name: '🎬 1440p (2K QHD)', value: '1440' },
                            { name: '🎬 1080p (Full HD)', value: '1080' },
                            { name: '📺 900p (HD+)', value: '900' },
                            { name: '📺 720p (HD)', value: '720' },
                            { name: '📱 540p (qHD)', value: '540' },
                            { name: '📱 480p (SD)', value: '480' },
                            { name: '📞 360p (Móvil)', value: '360' },
                            { name: '📟 240p (Baja)', value: '240' },
                            { name: '📱 144p (Mínima)', value: '144' }
                        ))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const url = interaction.options.getString('url');
        const quality = interaction.options.getString('calidad') || (subcommand === 'mp3' ? '192' : '480');

        // Verificar que sea una URL válida de YouTube
        if (!(await isValidYouTubeUrl(url))) {
            const invalidUrlEmbed = new EmbedBuilder()
                .setTitle('❌ URL Inválida')
                .setDescription('La URL proporcionada no es válida o no es de YouTube.')
                .addFields([
                    { 
                        name: '💡 Formatos Válidos', 
                        value: '• `https://www.youtube.com/watch?v=VIDEO_ID`\n• `https://youtu.be/VIDEO_ID`\n• `https://m.youtube.com/watch?v=VIDEO_ID`',
                        inline: false 
                    }
                ])
                .setColor(0xff0000)
                .setTimestamp();

            return interaction.reply({ embeds: [invalidUrlEmbed], ephemeral: true });
        }

        await interaction.deferReply();

        // Variable para rastrear si la interacción sigue válida
        let interactionValid = true;
        const user = interaction.user;

        // Función helper para actualizar de forma segura
        const safeUpdate = async (content) => {
            if (!interactionValid) return;
            try {
                await interaction.editReply(content);
            } catch (error) {
                if (error.code === 10062 || error.message.includes('Unknown interaction') || error.name === 'AbortError') {
                    console.log(chalk.yellow('⚠️ Interacción expirada, continuando procesamiento...'));
                    interactionValid = false;
                } else {
                    console.error(chalk.red('❌ Error actualizando interacción:'), error.message);
                    interactionValid = false;
                }
            }
        };

        // Función para enviar resultado cuando la interacción expire
        const sendFallbackResult = async (content) => {
            if (interactionValid) {
                return await safeUpdate(content);
            }

            try {
                // Intentar enviar por DM al usuario
                await user.send({
                    content: `🎵 **Conversión Completada** (la interacción expiró)\n\nAquí está tu archivo convertido:`,
                    ...content
                });
                console.log(chalk.green('✅ Resultado enviado por DM al usuario'));
            } catch (dmError) {
                console.error(chalk.red('❌ No se pudo enviar DM al usuario:'), dmError.message);

                // Como último recurso, intentar enviar en el canal
                try {
                    await interaction.channel.send({
                        content: `${user}, tu conversión está lista (la interacción expiró):`,
                        ...content
                    });
                    console.log(chalk.green('✅ Resultado enviado en el canal'));
                } catch (channelError) {
                    console.error(chalk.red('❌ No se pudo enviar en el canal:'), channelError.message);
                }
            }
        };

        // Verificar si FFmpeg está disponible
        try {
            await new Promise((resolve, reject) => {
                ffmpeg.getAvailableFormats((err, formats) => {
                    if (err) reject(err);
                    else resolve(formats);
                });
            });
        } catch (ffmpegError) {
            const ffmpegEmbed = new EmbedBuilder()
                .setTitle('🔧 FFmpeg No Disponible')
                .setDescription('FFmpeg no está instalado o configurado correctamente.')
                .addFields([
                    {
                        name: '📥 Instalación Rápida',
                        value: '**Windows:**\n```\nwinget install ffmpeg\n```\n**Linux:**\n```\nsudo apt install ffmpeg\n```\n**macOS:**\n```\nbrew install ffmpeg\n```',
                        inline: false
                    },
                    {
                        name: '🔄 Después de Instalar',
                        value: '1. Reinicia la terminal/consola\n2. Reinicia el bot\n3. Vuelve a intentar el comando',
                        inline: false
                    },
                    {
                        name: '📖 Guía Completa',
                        value: 'Ver `FFMPEG_SETUP.md` para instrucciones detalladas',
                        inline: false
                    }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            return safeUpdate({ embeds: [ffmpegEmbed] });
        }

        try {
            // Crear timeout para toda la operación (10 minutos máximo)
            const operationTimeout = setTimeout(() => {
                console.log(chalk.yellow('⏰ Operación de conversión alcanzó el timeout máximo'));
                interactionValid = false;
            }, 10 * 60 * 1000); // 10 minutos

            // Obtener información del video con opciones mejoradas y timeout
            const info = await getVideoInfoWithRetry(url, 3);

            // Si llegamos aquí, limpiar el timeout
            clearTimeout(operationTimeout);
            const videoDetails = info.videoDetails;

            // Verificar duración del video
            const duration = parseInt(videoDetails.lengthSeconds);
            if (duration > LIMITS.maxDuration) {
                const tooLongEmbed = new EmbedBuilder()
                    .setTitle('⏰ Video Demasiado Largo')
                    .setDescription('El video es demasiado largo para procesar.')
                    .addFields([
                        { name: '📏 Duración del video', value: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, inline: true },
                        { name: '⏱️ Límite máximo', value: `${Math.floor(LIMITS.maxDuration / 60)}:00 minutos`, inline: true },
                        { name: '💡 Sugerencia', value: 'Intenta con un video más corto o divide el contenido en partes.', inline: false }
                    ])
                    .setColor(0xffa500)
                    .setTimestamp();

                return safeUpdate({ embeds: [tooLongEmbed] });
            }

            // Crear embed de procesamiento
            const processingEmbed = new EmbedBuilder()
                .setTitle('⚙️ Procesando Video')
                .setDescription(`Convirtiendo a **${subcommand.toUpperCase()}**...`)
                .addFields([
                    { name: '🎬 Título', value: videoDetails.title.substring(0, 100) + (videoDetails.title.length > 100 ? '...' : ''), inline: false },
                    { name: '👤 Canal', value: videoDetails.author.name, inline: true },
                    { name: '⏱️ Duración', value: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`, inline: true },
                    { name: '🔧 Calidad', value: subcommand === 'mp3' ? `${quality}kbps` : `${quality}p`, inline: true },
                    { name: '📊 Estado', value: '🔄 Descargando...', inline: false }
                ])
                .setColor(0x0099ff)
                .setThumbnail(videoDetails.thumbnails[0]?.url)
                .setTimestamp();

            await safeUpdate({ embeds: [processingEmbed] });

            // Crear directorio temporal si no existe
            const tempDir = LIMITS.tempDir;
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Generar nombres de archivo únicos
            const timestamp = Date.now();
            const safeTitle = videoDetails.title.replace(/[^\w\s-]/g, '').substring(0, 50);
            const outputFile = path.join(tempDir, `${timestamp}_${safeTitle}.${subcommand}`);

            if (subcommand === 'mp3') {
                // Procesar MP3
                await processMP3(url, outputFile, quality, safeUpdate, sendFallbackResult, processingEmbed, videoDetails);
            } else {
                // Procesar MP4
                await processMP4(url, outputFile, quality, safeUpdate, sendFallbackResult, processingEmbed, videoDetails);
            }

        } catch (error) {
            console.error(chalk.red('❌ Error en converter:'), error);

            let errorTitle = '❌ Error de Conversión';
            let errorDescription = 'Ocurrió un error al procesar el video.';
            let possibleCauses = '• Video privado o restringido\n• Problemas de conexión\n• Video demasiado largo\n• Formato no soportado';

            // Errores específicos
            if (error.message.includes('Cannot find ffmpeg')) {
                errorTitle = '🔧 FFmpeg No Instalado';
                errorDescription = 'FFmpeg no está instalado o no se encuentra en el sistema.';
                possibleCauses = '• **Windows:** `winget install ffmpeg`\n• **Linux:** `sudo apt install ffmpeg`\n• **macOS:** `brew install ffmpeg`\n• Reinicia el bot después de instalar';
            } else if (error.message.includes('Could not extract functions')) {
                errorTitle = '🔧 Error de Extracción';
                errorDescription = 'YouTube ha actualizado su sistema. Intenta de nuevo en unos minutos.';
                possibleCauses = '• YouTube cambió su API\n• Intenta con otro video\n• El video puede tener restricciones\n• Espera unos minutos y vuelve a intentar';
            } else if (error.message.includes('Video unavailable')) {
                errorTitle = '📹 Video No Disponible';
                errorDescription = 'El video no está disponible o ha sido eliminado.';
                possibleCauses = '• Video eliminado o privado\n• Restricciones geográficas\n• Video solo para miembros\n• URL incorrecta';
            } else if (error.message.includes('Sign in to confirm your age')) {
                errorTitle = '🔞 Restricción de Edad';
                errorDescription = 'Este video tiene restricciones de edad.';
                possibleCauses = '• Video con restricción de edad\n• Requiere inicio de sesión\n• Intenta con otro video\n• Contenido no disponible para bots';
            } else if (error.message.includes('This operation was aborted') || error.name === 'AbortError') {
                errorTitle = '⏱️ Timeout de Conexión';
                errorDescription = 'La conexión con YouTube tardó demasiado tiempo.';
                possibleCauses = '• Conexión a internet lenta\n• YouTube está experimentando problemas\n• El video es muy grande\n• Intenta de nuevo en unos minutos';
            } else if (error.message.includes('ECONNRESET') || error.message.includes('ETIMEDOUT')) {
                errorTitle = '🌐 Error de Conexión';
                errorDescription = 'Problemas de conectividad con YouTube.';
                possibleCauses = '• Verifica tu conexión a internet\n• YouTube puede estar bloqueado\n• Problemas temporales del servidor\n• Intenta con una VPN si es necesario';
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle(errorTitle)
                .setDescription(errorDescription)
                .addFields([
                    { name: '🚨 Error Técnico', value: `\`\`\`${error.message.substring(0, 500)}\`\`\`` },
                    { name: '💡 Posibles Soluciones', value: possibleCauses, inline: false },
                    { name: '🔄 Qué Hacer', value: '1. Verifica que la URL sea correcta\n2. Intenta con otro video\n3. Espera unos minutos\n4. Usa un video público y sin restricciones', inline: false }
                ])
                .setColor(0xff0000)
                .setTimestamp();

            await safeUpdate({ embeds: [errorEmbed] });
        }
    }
};

// Función para procesar MP3
async function processMP3(url, outputFile, quality, safeUpdate, sendFallbackResult, processingEmbed, videoDetails) {
    try {
        const info = await getVideoInfoWithRetry(url, 3);
        const audioFormats = info.formats.filter(format => format.hasAudio && !format.hasVideo);
        const selectedFormat = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

        if (!selectedFormat) {
            throw new Error('No se encontró un formato de audio compatible');
        }

        processingEmbed.data.fields[4].value = `🎵 Descargando audio (${selectedFormat.audioBitrate || 'normal'}kbps)...`;
        await safeUpdate({ embeds: [processingEmbed] });

        await youtubedl(url, {
            output: outputFile,
            format: 'bestaudio/best',
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: `${quality}k`,
            noWarnings: true,
            noCheckCertificates: true,
        });

        const stats = fs.statSync(outputFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > (LIMITS.maxFileSize / (1024 * 1024))) {
            const tooBigEmbed = new EmbedBuilder()
                .setTitle('📁 Archivo Demasiado Grande')
                .setDescription('El archivo convertido excede el límite permitido.')
                .addFields([
                    { name: '📊 Tamaño del archivo', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
                    { name: '📏 Límite máximo', value: `${(LIMITS.maxFileSize / (1024 * 1024))} MB`, inline: true },
                    { name: '💡 Sugerencia', value: 'Intenta con una calidad más baja o un video más corto.', inline: false }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            await safeUpdate({ embeds: [tooBigEmbed] });
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            return;
        }

        const attachment = new AttachmentBuilder(outputFile, {
            name: `${videoDetails.title.substring(0, 50).replace(/[^\w\s-]/g, '')}.mp3`
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Conversión Completada')
            .setDescription('Tu archivo MP3 está listo para descargar.')
            .addFields([
                { name: '🎬 Título', value: videoDetails.title.substring(0, 100) + (videoDetails.title.length > 100 ? '...' : ''), inline: false },
                { name: '👤 Canal', value: videoDetails.author.name, inline: true },
                { name: '🎵 Formato', value: 'MP3', inline: true },
                { name: '🔊 Calidad Solicitada', value: `${quality}kbps`, inline: true },
                { name: '📁 Tamaño', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
                { name: '⏱️ Duración', value: `${Math.floor(parseInt(videoDetails.lengthSeconds) / 60)}:${(parseInt(videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}`, inline: true }
            ])
            .setColor(0x00ff00)
            .setThumbnail(videoDetails.thumbnails[0]?.url)
            .setTimestamp();

        await sendFallbackResult({ embeds: [successEmbed], files: [attachment] });
        setTimeout(() => {
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        }, 5000);

        console.log(chalk.green(`✅ MP3 convertido exitosamente: ${videoDetails.title}`));
    } catch (error) {
        console.error(chalk.red('❌ Error obteniendo formatos de audio:'), error);
        throw new Error(`Error al obtener formatos de audio: ${error.message}`);
    }
}

// Función para procesar MP4
async function processMP4(url, outputFile, quality, safeUpdate, sendFallbackResult, processingEmbed, videoDetails) {
    try {
        const info = await getVideoInfoWithRetry(url, 3);
        const videoFormats = info.formats.filter(format => format.hasVideo && (format.container === 'mp4' || format.container === 'webm'));

        if (videoFormats.length === 0) {
            throw new Error('No se encontró un formato de video compatible');
        }

        const qualityMap = { '144': 144, '240': 240, '360': 360, '480': 480, '540': 540, '720': 720, '900': 900, '1080': 1080, '1440': 1440 };
        const targetHeight = qualityMap[quality] || 720;
        const selectedVideoFormat = videoFormats
            .filter(format => Number(format.height) <= targetHeight)
            .sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0))[0] || videoFormats.sort((a, b) => (Number(b.height) || 0) - (Number(a.height) || 0))[0];

        if (!selectedVideoFormat) {
            throw new Error('No se encontró un formato de video compatible');
        }

        processingEmbed.data.fields[4].value = `🎥 Descargando ${selectedVideoFormat.height || targetHeight}p...`;
        await safeUpdate({ embeds: [processingEmbed] });

        await youtubedl(url, {
            output: outputFile,
            format: `bestvideo[height<=${selectedVideoFormat.height || targetHeight}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${selectedVideoFormat.height || targetHeight}][ext=mp4]`,
            mergeOutputFormat: 'mp4',
            noWarnings: true,
            noCheckCertificates: true,
        });

        const stats = fs.statSync(outputFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (fileSizeMB > (LIMITS.maxFileSize / (1024 * 1024))) {
            const tooBigEmbed = new EmbedBuilder()
                .setTitle('📁 Archivo Demasiado Grande')
                .setDescription('El archivo de video excede el límite permitido.')
                .addFields([
                    { name: '📊 Tamaño del archivo', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
                    { name: '📏 Límite máximo', value: `${(LIMITS.maxFileSize / (1024 * 1024))} MB`, inline: true },
                    { name: '💡 Sugerencia', value: 'Intenta con una calidad más baja o un video más corto.', inline: false }
                ])
                .setColor(0xffa500)
                .setTimestamp();

            await safeUpdate({ embeds: [tooBigEmbed] });
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            return;
        }

        const attachment = new AttachmentBuilder(outputFile, {
            name: `${videoDetails.title.substring(0, 50).replace(/[^\w\s-]/g, '')}.mp4`
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('✅ Descarga Completada')
            .setDescription('Tu archivo MP4 está listo para descargar.')
            .addFields([
                { name: '🎬 Título', value: videoDetails.title.substring(0, 100) + (videoDetails.title.length > 100 ? '...' : ''), inline: false },
                { name: '👤 Canal', value: videoDetails.author.name, inline: true },
                { name: '🎥 Formato', value: 'MP4', inline: true },
                { name: '📺 Calidad Solicitada', value: `${quality}p`, inline: true },
                { name: '📺 Calidad Obtenida', value: `${selectedVideoFormat.height || targetHeight}p`, inline: true },
                { name: '📁 Tamaño', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
                { name: '⏱️ Duración', value: `${Math.floor(parseInt(videoDetails.lengthSeconds) / 60)}:${(parseInt(videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}`, inline: true }
            ])
            .setColor(0x00ff00)
            .setThumbnail(videoDetails.thumbnails[0]?.url)
            .setTimestamp();

        await sendFallbackResult({ embeds: [successEmbed], files: [attachment] });
        setTimeout(() => {
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        }, 5000);

        console.log(chalk.green(`✅ MP4 descargado exitosamente: ${videoDetails.title} (${selectedVideoFormat.height || targetHeight}p)`));
    } catch (error) {
        console.error(chalk.red('❌ Error obteniendo formatos de video:'), error);
        throw new Error(`Error al obtener formatos de video: ${error.message}`);
    }
}

/**
 * Función helper para obtener información del video con reintentos y timeout
 * @param {string} url - URL del video
 * @param {number} maxRetries - Número máximo de reintentos
 * @returns {Promise} Información del video
 */
async function getVideoInfoWithRetry(url, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(chalk.blue(`🔄 Intento ${attempt}/${maxRetries} - Obteniendo información del video...`));

            const info = await youtubedl(url, {
                dumpJson: true,
                noWarnings: true,
                skipDownload: true,
                noCheckCertificates: true,
            });

            const normalizedFormats = (info?.formats || []).map(normalizeFormatInfo).filter(format => format.url || format.hasAudio || format.hasVideo);

            if (!info?.title || normalizedFormats.length === 0) {
                throw new Error('No se encontraron formatos reproducibles para este video.');
            }

            const normalizedInfo = {
                videoDetails: {
                    title: info.title,
                    author: {
                        name: info.uploader || info.channel || 'Canal no disponible',
                    },
                    thumbnails: info.thumbnails || [],
                    lengthSeconds: String(info.duration || 0),
                },
                formats: normalizedFormats,
            };

            console.log(chalk.green('✅ Información del video obtenida exitosamente'));
            return normalizedInfo;

        } catch (error) {
            console.error(chalk.red(`❌ Intento ${attempt}/${maxRetries} falló:`, error.message));

            if (attempt === maxRetries) {
                throw error;
            }

            const delay = Math.pow(2, attempt) * 1000;
            console.log(chalk.yellow(`⏳ Esperando ${delay/1000}s antes del siguiente intento...`));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
