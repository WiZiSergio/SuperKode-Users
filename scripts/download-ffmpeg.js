#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const projectRoot = process.cwd();
const vendorDir = path.resolve(projectRoot, 'vendor', 'ffmpeg');
const binDir = path.join(vendorDir, 'bin');
const platform = process.platform;
const arch = process.arch;

function log(message) {
  console.log(message);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function downloadUrl(url, destination) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`La descarga falló con estado ${response.status}: ${response.statusText}`);
  }

  ensureDir(path.dirname(destination));
  const fileStream = fs.createWriteStream(destination);
  await pipeline(Readable.fromWeb(response.body), fileStream);
}

function copyExecutable(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
  if (process.platform !== 'win32') {
    fs.chmodSync(destination, 0o755);
  }
}

function findFile(root, fileName) {
  if (!root || !fs.existsSync(root)) return null;

  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.name.toLowerCase() === fileName.toLowerCase()) {
        return fullPath;
      }
    }
  }

  return null;
}

function getDownloadConfig() {
  if (platform === 'win32') {
    return {
      fileName: 'ffmpeg-win64.zip',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
      binaryName: 'ffmpeg.exe',
      probeName: 'ffprobe.exe'
    };
  }

  if (platform === 'linux') {
    if (arch === 'arm64') {
      return {
        fileName: 'ffmpeg-linux-arm64.tar.xz',
        url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz',
        binaryName: 'ffmpeg',
        probeName: 'ffprobe'
      };
    }

    return {
      fileName: 'ffmpeg-linux-x64.tar.xz',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz',
      binaryName: 'ffmpeg',
      probeName: 'ffprobe'
    };
  }

  if (platform === 'darwin') {
    return {
      fileName: 'ffmpeg-macos.tar.xz',
      url: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.tar.xz',
      binaryName: 'ffmpeg',
      probeName: 'ffprobe'
    };
  }

  throw new Error(`Sistema operativo no soportado: ${platform}`);
}

function extractArchive(archivePath, outputDir) {
  if (platform === 'win32') {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${outputDir}' -Force"`, {
      stdio: 'inherit',
      shell: true,
    });
    return;
  }

  execSync(`tar -xf "${archivePath}" -C "${outputDir}"`, {
    stdio: 'inherit',
    shell: true,
  });
}

async function ensureBundledBinary() {
  const ffmpegBinary = path.join(binDir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobeBinary = path.join(binDir, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');

  if (fs.existsSync(ffmpegBinary) && fs.existsSync(ffprobeBinary)) {
    log('✅ FFmpeg portátil ya está instalado en vendor/ffmpeg/bin');
    return true;
  }

  ensureDir(vendorDir);
  ensureDir(binDir);

  const config = getDownloadConfig();
  const archivePath = path.join(vendorDir, config.fileName);

  log(`⬇️ Descargando FFmpeg portable para ${platform} (${arch})...`);
  await downloadUrl(config.url, archivePath);

  log('📦 Extrayendo el paquete portable...');
  extractArchive(archivePath, vendorDir);

  const sourceFfmpeg = findFile(vendorDir, config.binaryName);
  const sourceFfprobe = findFile(vendorDir, config.probeName);

  if (!sourceFfmpeg || !sourceFfprobe) {
    throw new Error('No se encontraron ffmpeg y ffprobe dentro del paquete descargado.');
  }

  copyExecutable(sourceFfmpeg, ffmpegBinary);
  copyExecutable(sourceFfprobe, ffprobeBinary);

  log(`✅ FFmpeg portable listo: ${ffmpegBinary}`);
  return true;
}

try {
  await ensureBundledBinary();
} catch (error) {
  console.error('❌ Error descargando FFmpeg portátil:', error.message);
  process.exitCode = 1;
}
