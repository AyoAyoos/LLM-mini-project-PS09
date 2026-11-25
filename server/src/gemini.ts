import { GoogleGenAI, Modality } from '@google/genai';
import { config, hasApiKey } from './config.js';
import { AppError, badGateway, notConfigured, serviceBusy, timedOut } from './errors.js';
import {
  STORY_RESPONSE_SCHEMA,
  STORY_SYSTEM_INSTRUCTION,
  buildStoryPrompt,
} from './prompts.js';
import type { SpeechService, StoryResponse, StoryService } from './types.js';
import { stripControlCharacters } from './validation.js';
import { pcmToWav } from './wav.js';

class RequestTimeoutError extends Error {}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function getStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { status?: unknown; code?: unknown };
  for (const value of [candidate.status, candidate.code]) {
    if (typeof value === 'number' && Number.isInteger(value)) return value;
  }
  return undefined;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof AppError || error instanceof RequestTimeoutError) return false;
  const status = getStatus(error);
  if (status === undefined) return true; // network-level failures
  return RETRYABLE_STATUSES.has(status) || status >= 500;
}

async function callWithTimeout<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      factory(controller.signal),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new RequestTimeoutError('Gemini request timed out.'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** One retry, with a fresh timeout on each attempt. */
async function withOneRetry<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await callWithTimeout(factory, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === 1 || !isRetryable(error)) break;
      console.warn('[gemini] transient failure, retrying once…');
    }
  }

  throw lastError;
}

function mapGeminiError(error: unknown, operation: 'story' | 'tts'): AppError {
  if (error instanceof AppError) return error;

  const noun = operation === 'story' ? 'story' : 'audio';
  if (error instanceof RequestTimeoutError) {
    return timedOut(`The ${noun} took too long to make. Please try again.`);
  }

  const status = getStatus(error);
  if (status === 429 || status === 503) {
    return serviceBusy('The story service is busy right now. Please try again in a moment.');
  }
  if (status === 404) {
    const isStory = operation === 'story';
    const model = isStory ? config.textModel : config.ttsModel;
    const variable = isStory ? 'GEMINI_TEXT_MODEL' : 'GEMINI_TTS_MODEL';
    const replacement = isStory ? 'gemini-3.5-flash-lite' : 'gemini-3.8-flash-tts';
    console.error(`[gemini] ${operation} model is unavailable (404)`, error);
    return badGateway(
      `The configured ${noun} model "${model}" is not available to this API key. ` +
        `Set ${variable}=${replacement} in server/.env and restart the server.`,
    );
  }
  if (status !== undefined && status >= 400 && status < 500) {
    console.error(`[gemini] rejected ${operation} request (${status})`, error);
    return badGateway('The story request was rejected. Please check the server settings and try again.');
  }

  console.error(`[gemini] unexpected ${operation} failure`, error);
  return badGateway(`We couldn't reach the story service. Please try again.`);
}

let client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!hasApiKey()) {
    throw notConfigured(
      'Story service is not configured. Add GEMINI_API_KEY to server/.env and restart the server.',
    );
  }
  // Gemini 3.8 TTS is served from the v1beta endpoint.
  client ??= new GoogleGenAI({
    apiKey: config.apiKey,
    httpOptions: { apiVersion: 'v1beta' },
  });
  return client;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanInline(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return stripControlCharacters(value, true)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function cleanStory(value: unknown): string {
  if (typeof value !== 'string') return '';
  return stripControlCharacters(value, true)
    .replace(/```/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^Moral:\s*.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parseStoryResponse(rawText: string): StoryResponse {
  let jsonText = rawText.trim();
  jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw badGateway('The story came back in an unexpected format. Please try again.');
  }

  if (!isRecord(parsed)) {
    throw badGateway('The story came back in an unexpected format. Please try again.');
  }

  const title = cleanInline(parsed.title, 120);
  const story = cleanStory(parsed.story);
  const moral = cleanInline(parsed.moral, 200);

  if (!title || !story || !moral) {
    throw badGateway('The story was incomplete. Please try again.');
  }

  return { title, story, moral };
}

export const storyService: StoryService = {
  async generateStory(input) {
    const ai = getClient();
    let rawText: string;

    try {
      const response = await withOneRetry(
        (signal) =>
          ai.models.generateContent({
            model: config.textModel,
            config: {
              systemInstruction: STORY_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: STORY_RESPONSE_SCHEMA,
              abortSignal: signal,
            },
            contents: buildStoryPrompt(input),
          }),
        config.timeoutMs,
      );
      rawText = response.text ?? '';
    } catch (error) {
      throw mapGeminiError(error, 'story');
    }

    return parseStoryResponse(rawText);
  },
};

export const speechService: SpeechService = {
  async synthesizeSpeech(text) {
    const ai = getClient();
    let rawAudio: Buffer;

    try {
      const response = await withOneRetry(
        (signal) =>
          ai.models.generateContent({
            model: config.ttsModel,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { voice: config.ttsVoice },
              },
              abortSignal: signal,
            },
            contents: [
              {
                role: 'user',
                parts: [
                  { text, speechMetadata: { style: 'warm, calm bedtime storytelling' } },
                ],
              },
            ],
          }),
        config.timeoutMs,
      );

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const encoded = parts.find((part) => part.inlineData?.data)?.inlineData?.data;
      if (!encoded) throw new Error('Gemini returned no inline audio data.');
      rawAudio = Buffer.from(encoded, 'base64');
    } catch (error) {
      throw mapGeminiError(error, 'tts');
    }

    if (rawAudio.length === 0) {
      throw badGateway('No audio was returned. Please try again.');
    }

    return pcmToWav(rawAudio);
  },
};
