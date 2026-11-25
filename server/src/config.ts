import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Works in both `tsx watch src/index.ts` (src/) and `node dist/index.js` (dist/).
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(moduleDir, '..', '.env') });

function readString(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

function readPositiveInt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    console.warn(`[config] Ignoring invalid ${name}=${raw}; using ${fallback}.`);
    return fallback;
  }
  return parsed;
}

export const config = {
  apiKey: readString('GEMINI_API_KEY', ''),
  // Fast, generally available text model for new API keys.
  textModel: readString('GEMINI_TEXT_MODEL', 'gemini-3.5-flash-lite'),
  ttsModel: readString('GEMINI_TTS_MODEL', 'gemini-3.8-flash-tts'),
  ttsVoice: readString('GEMINI_TTS_VOICE', 'Kore'),
  port: readPositiveInt('PORT', 4000, 1, 65535),
  clientOrigin: readString('CLIENT_ORIGIN', 'http://localhost:5173'),
  timeoutMs: readPositiveInt('GEMINI_TIMEOUT_MS', 60_000, 1_000, 120_000),
  rateLimitMax: readPositiveInt('RATE_LIMIT_MAX', 10, 1, 1_000),
  rateLimitWindowMs: readPositiveInt('RATE_LIMIT_WINDOW_MS', 60_000, 1_000, 3_600_000),
} as const;

export const hasApiKey = (): boolean => config.apiKey.length > 0;
