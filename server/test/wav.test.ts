import assert from 'node:assert/strict';
import test from 'node:test';
import { createWavHeader, pcmToWav } from '../src/wav.js';

test('createWavHeader writes the expected 44-byte PCM header', () => {
  const header = createWavHeader(100, { sampleRate: 24_000, bitsPerSample: 16, channels: 1 });

  assert.equal(header.length, 44);
  assert.equal(header.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.equal(header.readUInt32LE(4), 136); // 36 + data length
  assert.equal(header.subarray(8, 12).toString('ascii'), 'WAVE');
  assert.equal(header.subarray(12, 16).toString('ascii'), 'fmt ');
  assert.equal(header.readUInt16LE(20), 1); // PCM
  assert.equal(header.readUInt16LE(22), 1); // mono
  assert.equal(header.readUInt32LE(24), 24_000);
  assert.equal(header.readUInt32LE(28), 48_000); // byte rate
  assert.equal(header.readUInt16LE(32), 2); // block align
  assert.equal(header.readUInt16LE(34), 16);
  assert.equal(header.subarray(36, 40).toString('ascii'), 'data');
  assert.equal(header.readUInt32LE(40), 100);
});

test('pcmToWav prepends a header to raw PCM', () => {
  const pcm = Buffer.from([1, 2, 3, 4]);
  const wav = pcmToWav(pcm);
  assert.equal(wav.length, 48);
  assert.equal(wav.subarray(0, 4).toString('ascii'), 'RIFF');
  assert.deepEqual(wav.subarray(44), pcm);
});

test('pcmToWav passes through an existing WAV file', () => {
  const wav = pcmToWav(Buffer.concat([createWavHeader(2), Buffer.from([9, 9])]));
  assert.equal(wav.length, 46);
  assert.deepEqual(wav.subarray(44), Buffer.from([9, 9]));
});
