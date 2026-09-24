import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocalFFmpegBinary } from '../src/structure/config/ffmpeg.js';

test('resolveLocalFFmpegBinary uses the project-local vendor dir', () => {
  const result = resolveLocalFFmpegBinary(process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  assert.ok(result.includes('vendor'));
  assert.ok(result.includes('ffmpeg'));
});
