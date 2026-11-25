export interface WavOptions {
  sampleRate?: number;
  bitsPerSample?: number;
  channels?: number;
}

const DEFAULT_OPTIONS: Required<WavOptions> = {
  sampleRate: 24_000,
  bitsPerSample: 16,
  channels: 1,
};

/** Build the 44-byte RIFF/WAVE header for uncompressed PCM audio. */
export function createWavHeader(dataLength: number, options: WavOptions = {}): Buffer {
  const { sampleRate, bitsPerSample, channels } = { ...DEFAULT_OPTIONS, ...options };
  const header = Buffer.alloc(44);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  const blockAlign = (channels * bitsPerSample) / 8;
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * Gemini 3.8 unary TTS already returns a complete RIFF/WAVE file. Older models
 * may return headerless 24 kHz, 16-bit, mono PCM, so add a header only when
 * the bytes are not already a WAV file.
 */
export function pcmToWav(pcm: Buffer, options: WavOptions = {}): Buffer {
  if (pcm.subarray(0, 4).toString('ascii') === 'RIFF' && pcm.subarray(8, 12).toString('ascii') === 'WAVE') {
    return pcm;
  }
  return Buffer.concat([createWavHeader(pcm.length, options), pcm]);
}
