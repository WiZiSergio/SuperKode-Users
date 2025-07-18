const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js')
const ytdl = require('@distube/ytdl-core');
const { ffmpeg, LIMITS } = require('../../../structure/config/ffmpeg');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = {
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
        if (!ytdl.validateURL(url)) {
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
    return new Promise(async (resolve, reject) => {
        try {
            // Obtener información detallada de formatos disponibles con reintentos
            const info = await getVideoInfoWithRetry(url, 3);

            // Filtrar formatos de audio únicamente
            const audioFormats = info.formats.filter(format =>
                format.hasAudio &&
                !format.hasVideo &&
                format.container === 'webm' || format.container === 'm4a'
            );

            // Si no hay formatos de solo audio, usar el mejor audio disponible
            let selectedFormat = audioFormats.length > 0 ?
                audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0] :
                info.formats.filter(f => f.hasAudio).sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

            if (!selectedFormat) {
                throw new Error('No se encontró un formato de audio compatible');
            }

            // Actualizar estado con información del formato seleccionado
            const audioBitrate = selectedFormat.audioBitrate || 'desconocido';
            processingEmbed.data.fields[4].value = `🎵 Extrayendo audio (${audioBitrate}kbps disponible)...`;
            await safeUpdate({ embeds: [processingEmbed] });

            // Descargar audio con el formato específico seleccionado
            const audioStream = ytdl(url, {
                format: selectedFormat,
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    timeout: 30000 // 30 segundos timeout
                }
            });

        // Actualizar estado
        processingEmbed.data.fields[4].value = '🎵 Extrayendo audio...';
        await safeUpdate({ embeds: [processingEmbed] });

        // Manejar errores del stream de audio
        audioStream.on('error', (error) => {
            console.error(chalk.red('❌ Error en stream de audio:'), error);
            reject(new Error(`Error en descarga de audio: ${error.message}`));
        });

        // Convertir a MP3 con FFmpeg
        ffmpeg(audioStream)
            .audioBitrate(quality)
            .format('mp3')
            .on('progress', (progress) => {
                const percent = Math.round(progress.percent || 0);
                processingEmbed.data.fields[4].value = `🔄 Convirtiendo... ${percent}%`;
                safeUpdate({ embeds: [processingEmbed] });
            })
            .on('end', async () => {
                try {
                    // Verificar tamaño del archivo
                    const stats = fs.statSync(outputFile);
                    const fileSizeMB = stats.size / (1024 * 1024);

                    if (fileSizeMB > (LIMITS.maxFileSize / (1024 * 1024))) {
                        // Archivo demasiado grande
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
                        
                        // Limpiar archivos
                        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                        return resolve();
                    }

                    // Crear attachment y enviar
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
                            { name: '🔊 Audio Original', value: `${selectedFormat.audioBitrate || 'N/A'}kbps`, inline: true },
                            { name: '📁 Tamaño', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
                            { name: '⏱️ Duración', value: `${Math.floor(parseInt(videoDetails.lengthSeconds) / 60)}:${(parseInt(videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}`, inline: true }
                        ])
                        .setColor(0x00ff00)
                        .setThumbnail(videoDetails.thumbnails[0]?.url)
                        .setTimestamp();

                    await sendFallbackResult({
                        embeds: [successEmbed],
                        files: [attachment]
                    });

                    // Limpiar archivo después de enviar
                    setTimeout(() => {
                        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                    }, 5000);

                    console.log(chalk.green(`✅ MP3 convertido exitosamente: ${videoDetails.title}`));
                    resolve();

                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                // Limpiar archivos en caso de error
                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                reject(error);
            })
            .save(outputFile);

        } catch (error) {
            // Manejar errores de obtención de información o selección de formato
            console.error(chalk.red('❌ Error obteniendo formatos de audio:'), error);
            reject(new Error(`Error al obtener formatos de audio: ${error.message}`));
        }
    });
}

// Función para procesar MP4
async function processMP4(url, outputFile, quality, safeUpdate, sendFallbackResult, processingEmbed, videoDetails) {
    return new Promise(async (resolve, reject) => {
        try {
            // Obtener información detallada de formatos disponibles con reintentos
            const info = await getVideoInfoWithRetry(url, 3);

            // Filtrar formatos de video (con y sin audio por separado)
            const videoWithAudioFormats = info.formats.filter(format =>
                format.hasVideo &&
                format.hasAudio &&
                (format.container === 'mp4' || format.container === 'webm')
            );

            const videoOnlyFormats = info.formats.filter(format =>
                format.hasVideo &&
                !format.hasAudio &&
                (format.container === 'mp4' || format.container === 'webm')
            );

            const audioOnlyFormats = info.formats.filter(format =>
                !format.hasVideo &&
                format.hasAudio &&
                (format.container === 'webm' || format.container === 'm4a')
            );

            console.log(chalk.blue('📊 Formatos disponibles:'));
            console.log(chalk.cyan('🎥 Con audio:'), videoWithAudioFormats.map(f => `${f.height}p (${f.qualityLabel})`));
            console.log(chalk.cyan('🎬 Solo video:'), videoOnlyFormats.map(f => `${f.height}p (${f.qualityLabel})`));
            console.log(chalk.cyan('🎵 Solo audio:'), audioOnlyFormats.map(f => `${f.audioBitrate}kbps`));

            // Mapear calidades solicitadas a alturas de video
            const qualityMap = {
                '144': 144,
                '240': 240,
                '360': 360,
                '480': 480,
                '540': 540,
                '720': 720,
                '900': 900,
                '1080': 1080,
                '1440': 1440
            };

            const targetHeight = qualityMap[quality];

            // Sistema completo: Usar formatos con audio integrado O combinar streams
            let selectedVideoFormat = null;
            let selectedAudioFormat = null;
            let needsSeparateAudio = false;

            // Primero, buscar formato con audio integrado para la calidad solicitada
            selectedVideoFormat = videoWithAudioFormats.find(format => format.height === targetHeight);

            // Si no hay formato con audio integrado, buscar en formatos solo video
            if (!selectedVideoFormat) {
                selectedVideoFormat = videoOnlyFormats.find(format => format.height === targetHeight);
                if (selectedVideoFormat) {
                    needsSeparateAudio = true;
                    console.log(chalk.blue(`🎯 Calidad ${targetHeight}p encontrada en formato solo video, combinando con audio...`));
                }
            }

            // Si no hay formato exacto, buscar el más cercano hacia abajo
            if (!selectedVideoFormat) {
                // Primero en formatos con audio
                const availableHeightsWithAudio = videoWithAudioFormats
                    .map(f => f.height)
                    .filter(h => h <= targetHeight)
                    .sort((a, b) => b - a);

                if (availableHeightsWithAudio.length > 0) {
                    selectedVideoFormat = videoWithAudioFormats.find(f => f.height === availableHeightsWithAudio[0]);
                } else {
                    // Luego en formatos solo video
                    const availableHeightsVideoOnly = videoOnlyFormats
                        .map(f => f.height)
                        .filter(h => h <= targetHeight)
                        .sort((a, b) => b - a);

                    if (availableHeightsVideoOnly.length > 0) {
                        selectedVideoFormat = videoOnlyFormats.find(f => f.height === availableHeightsVideoOnly[0]);
                        needsSeparateAudio = true;
                        console.log(chalk.blue(`🎯 Usando calidad ${selectedVideoFormat.height}p con combinación de streams...`));
                    }
                }
            }

            // Si aún no hay formato, tomar el mejor disponible
            if (!selectedVideoFormat) {
                selectedVideoFormat = videoWithAudioFormats.length > 0 ?
                    videoWithAudioFormats.sort((a, b) => (b.height || 0) - (a.height || 0))[0] :
                    videoOnlyFormats.sort((a, b) => (b.height || 0) - (a.height || 0))[0];

                if (selectedVideoFormat && !selectedVideoFormat.hasAudio) {
                    needsSeparateAudio = true;
                }
            }

            // Si necesitamos audio separado, seleccionar el mejor formato de audio
            if (needsSeparateAudio) {
                selectedAudioFormat = audioOnlyFormats.length > 0 ?
                    audioOnlyFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0] :
                    info.formats.filter(f => f.hasAudio).sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

                console.log(chalk.green(`🎵 Audio seleccionado: ${selectedAudioFormat.audioBitrate}kbps`));
            }

            if (!selectedVideoFormat) {
                throw new Error('No se encontró un formato de video compatible');
            }

            console.log(chalk.green('✅ Formato seleccionado:'), {
                video: `${selectedVideoFormat.height}p (${selectedVideoFormat.qualityLabel})`,
                hasAudio: selectedVideoFormat.hasAudio,
                needsSeparateAudio,
                audioFormat: selectedAudioFormat ? `${selectedAudioFormat.audioBitrate}kbps` : 'Integrado'
            });

            // Actualizar estado con información del formato seleccionado
            const formatInfo = needsSeparateAudio ?
                `${selectedVideoFormat.height}p + audio separado` :
                `${selectedVideoFormat.height}p (${selectedVideoFormat.qualityLabel || 'calidad disponible'})`;

            processingEmbed.data.fields[4].value = `🎥 Descargando ${formatInfo}...`;
            await safeUpdate({ embeds: [processingEmbed] });

            // Configurar descarga según el tipo de formato
            if (needsSeparateAudio && selectedAudioFormat) {
                // Método de archivos temporales para combinación de streams
                await processWithSeparateStreams(url, outputFile, selectedVideoFormat, selectedAudioFormat, safeUpdate, sendFallbackResult, processingEmbed, videoDetails, quality);
            } else {
                // Método directo para formatos con audio integrado
                await processWithIntegratedAudio(url, outputFile, selectedVideoFormat, safeUpdate, sendFallbackResult, processingEmbed, videoDetails, quality);
            }

            resolve(); // Resolver la promesa cuando el procesamiento termine exitosamente

        } catch (error) {
            // Manejar errores de obtención de información o selección de formato
            console.error(chalk.red('❌ Error obteniendo formatos de video:'), error);
            reject(new Error(`Error al obtener formatos de video: ${error.message}`));
        }
    });
}

// Función para procesar con audio integrado (método directo)
async function processWithIntegratedAudio(url, outputFile, selectedVideoFormat, safeUpdate, sendFallbackResult, processingEmbed, videoDetails, quality) {
    return new Promise((resolve, reject) => {
        const videoStream = ytdl(url, {
            format: selectedVideoFormat,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 30000 // 30 segundos timeout
            }
        });

        // Manejar errores del stream de video
        videoStream.on('error', (error) => {
            console.error(chalk.red('❌ Error en stream de video:'), error);
            reject(new Error(`Error en descarga de video: ${error.message}`));
        });

        ffmpeg(videoStream)
            .videoCodec('libx264')
            .audioCodec('aac')
            .size(`?x${selectedVideoFormat.height}`)
            .format('mp4')
            .on('progress', (progress) => {
                const percent = Math.round(progress.percent || 0);
                processingEmbed.data.fields[4].value = `🔄 Procesando ${selectedVideoFormat.height}p... ${percent}%`;
                safeUpdate({ embeds: [processingEmbed] });
            })
            .on('end', async () => {
                try {
                    await handleSuccessfulConversion(outputFile, safeUpdate, sendFallbackResult, videoDetails, quality, selectedVideoFormat, false);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                reject(error);
            })
            .save(outputFile);
    });
}

// Función para procesar con streams separados (combinación)
async function processWithSeparateStreams(url, outputFile, selectedVideoFormat, selectedAudioFormat, safeUpdate, sendFallbackResult, processingEmbed, videoDetails, quality) {
    return new Promise(async (resolve, reject) => {
        try {
            const tempDir = path.dirname(outputFile);
            const timestamp = Date.now();
            const tempVideoFile = path.join(tempDir, `temp_video_${timestamp}.mp4`);
            const tempAudioFile = path.join(tempDir, `temp_audio_${timestamp}.webm`);

            // Paso 1: Descargar video
            processingEmbed.data.fields[4].value = `🎥 Descargando video ${selectedVideoFormat.height}p...`;
            await safeUpdate({ embeds: [processingEmbed] });

            await downloadVideoStream(url, selectedVideoFormat, tempVideoFile);

            // Paso 2: Descargar audio
            processingEmbed.data.fields[4].value = `🎵 Descargando audio ${selectedAudioFormat.audioBitrate}kbps...`;
            await safeUpdate({ embeds: [processingEmbed] });

            await downloadAudioStream(url, selectedAudioFormat, tempAudioFile);

            // Paso 3: Combinar con FFmpeg
            processingEmbed.data.fields[4].value = `🔄 Combinando video y audio...`;
            await safeUpdate({ embeds: [processingEmbed] });

            await combineStreams(tempVideoFile, tempAudioFile, outputFile, processingEmbed, safeUpdate);

            // Limpiar archivos temporales
            if (fs.existsSync(tempVideoFile)) fs.unlinkSync(tempVideoFile);
            if (fs.existsSync(tempAudioFile)) fs.unlinkSync(tempAudioFile);

            // Manejar éxito
            await handleSuccessfulConversion(outputFile, safeUpdate, sendFallbackResult, videoDetails, quality, selectedVideoFormat, true);
            resolve();

        } catch (error) {
            // Limpiar archivos en caso de error
            const tempDir = path.dirname(outputFile);
            const timestamp = Date.now();
            const tempVideoFile = path.join(tempDir, `temp_video_${timestamp}.mp4`);
            const tempAudioFile = path.join(tempDir, `temp_audio_${timestamp}.webm`);

            [outputFile, tempVideoFile, tempAudioFile].forEach(file => {
                if (fs.existsSync(file)) fs.unlinkSync(file);
            });

            reject(error);
        }
    });
}

// Función para descargar stream de video
function downloadVideoStream(url, videoFormat, outputPath) {
    return new Promise((resolve, reject) => {
        const videoStream = ytdl(url, {
            format: videoFormat,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 30000 // 30 segundos timeout
            }
        });

        const writeStream = fs.createWriteStream(outputPath);
        videoStream.pipe(writeStream);

        writeStream.on('finish', () => {
            console.log(chalk.green('✅ Video descargado'));
            resolve();
        });

        writeStream.on('error', reject);
        videoStream.on('error', reject);
    });
}

// Función para descargar stream de audio
function downloadAudioStream(url, audioFormat, outputPath) {
    return new Promise((resolve, reject) => {
        const audioStream = ytdl(url, {
            format: audioFormat,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 30000 // 30 segundos timeout
            }
        });

        const writeStream = fs.createWriteStream(outputPath);
        audioStream.pipe(writeStream);

        writeStream.on('finish', () => {
            console.log(chalk.green('✅ Audio descargado'));
            resolve();
        });

        writeStream.on('error', reject);
        audioStream.on('error', reject);
    });
}

// Función para combinar streams con FFmpeg
function combineStreams(videoPath, audioPath, outputPath, processingEmbed, safeUpdate) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .videoCodec('copy')  // Copiar video sin recodificar (más rápido)
            .audioCodec('aac')   // Recodificar audio a AAC
            .format('mp4')
            .on('progress', (progress) => {
                const percent = Math.round(progress.percent || 0);
                processingEmbed.data.fields[4].value = `🔄 Combinando streams... ${percent}%`;
                safeUpdate({ embeds: [processingEmbed] });
            })
            .on('end', () => {
                console.log(chalk.green('✅ Streams combinados exitosamente'));
                resolve();
            })
            .on('error', reject)
            .save(outputPath);
    });
}

// Función para manejar conversión exitosa
async function handleSuccessfulConversion(outputFile, safeUpdate, sendFallbackResult, videoDetails, quality, selectedVideoFormat, wasCombined) {
    // Verificar tamaño del archivo
    const stats = fs.statSync(outputFile);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > (LIMITS.maxFileSize / (1024 * 1024))) {
        // Archivo demasiado grande
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

        // Limpiar archivos
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        throw new Error('Archivo demasiado grande');
    }

    // Crear attachment y enviar
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
            { name: '📺 Calidad Obtenida', value: `${selectedVideoFormat.height}p (${selectedVideoFormat.qualityLabel || 'N/A'})`, inline: true },
            { name: '🎵 Audio', value: wasCombined ? 'Combinado separadamente' : 'Integrado', inline: true },
            { name: '📁 Tamaño', value: `${fileSizeMB.toFixed(2)} MB`, inline: true },
            { name: '⏱️ Duración', value: `${Math.floor(parseInt(videoDetails.lengthSeconds) / 60)}:${(parseInt(videoDetails.lengthSeconds) % 60).toString().padStart(2, '0')}`, inline: true }
        ])
        .setColor(0x00ff00)
        .setThumbnail(videoDetails.thumbnails[0]?.url)
        .setTimestamp();

    // Añadir nota de éxito si se usó combinación de streams
    if (wasCombined) {
        successEmbed.addFields([
            { name: '🎯 Calidad Alta', value: `Video en ${selectedVideoFormat.height}p obtenido mediante combinación de streams`, inline: false }
        ]);
    }

    await sendFallbackResult({
        embeds: [successEmbed],
        files: [attachment]
    });

    // Limpiar archivo después de enviar
    setTimeout(() => {
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    }, 5000);

    console.log(chalk.green(`✅ MP4 descargado exitosamente: ${videoDetails.title} (${selectedVideoFormat.height}p)`));
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

            // Crear un AbortController para manejar timeouts
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

            const info = await ytdl.getInfo(url, {
                requestOptions: {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    signal: controller.signal
                }
            });

            clearTimeout(timeoutId);
            console.log(chalk.green(`✅ Información del video obtenida exitosamente`));
            return info;

        } catch (error) {
            console.error(chalk.red(`❌ Intento ${attempt}/${maxRetries} falló:`, error.message));

            if (attempt === maxRetries) {
                // Si es el último intento, lanzar el error
                throw error;
            }

            // Esperar antes del siguiente intento (backoff exponencial)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
            console.log(chalk.yellow(`⏳ Esperando ${delay/1000}s antes del siguiente intento...`));
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
