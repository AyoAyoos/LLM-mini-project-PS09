import type { StoryInput } from './types.js';

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Remove C0/DEL control characters. Newlines are kept for multi-line story text;
 * for single-line fields they become a space so words don't run together.
 */
export function stripControlCharacters(value: string, keepNewlines = false): string {
  if (keepNewlines) {
    return value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '');
  }
  return value.replace(/[\u0000-\u001F\u007F]/g, (character) =>
    character === '\t' || character === '\n' || character === '\r' ? ' ' : '',
  );
}

const fail = (error: string): ValidationResult<never> => ({ ok: false, error });

export function validateStoryInput(body: unknown): ValidationResult<StoryInput> {
  if (!isRecord(body)) return fail('Request body must be a JSON object.');

  const { age } = body;
  if (typeof age !== 'number' || !Number.isInteger(age) || age < 2 || age > 10) {
    return fail('Age must be a whole number between 2 and 10.');
  }

  const { characters } = body;
  if (!Array.isArray(characters)) {
    return fail('Characters must be a list with 1 to 4 entries.');
  }
  if (characters.length < 1 || characters.length > 4) {
    return fail('Please provide between 1 and 4 characters.');
  }

  const cleanCharacters: string[] = [];
  for (const [index, rawCharacter] of characters.entries()) {
    if (typeof rawCharacter !== 'string') {
      return fail(`Character ${index + 1} must be text.`);
    }
    const character = stripControlCharacters(rawCharacter).trim().replace(/\s+/g, ' ');
    if (!character) return fail('Characters cannot be empty.');
    if (character.length > 40) return fail('Each character must be 40 characters or fewer.');
    if (!cleanCharacters.some((existing) => existing.toLowerCase() === character.toLowerCase())) {
      cleanCharacters.push(character);
    }
  }
  if (cleanCharacters.length === 0) return fail('Please provide at least one character.');

  const { moral } = body;
  if (typeof moral !== 'string') return fail('Moral is required.');
  const cleanMoral = stripControlCharacters(moral).trim().replace(/\s+/g, ' ');
  if (!cleanMoral) return fail('Moral is required.');
  if (cleanMoral.length > 80) return fail('Moral must be 80 characters or fewer.');

  return {
    ok: true,
    value: { age, characters: cleanCharacters, moral: cleanMoral },
  };
}

export function validateTtsInput(body: unknown): ValidationResult<{ text: string }> {
  if (!isRecord(body)) return fail('Request body must be a JSON object.');
  if (typeof body.text !== 'string') return fail('Text is required.');

  const text = stripControlCharacters(body.text, true)
    .trim()
    .replace(/\n{3,}/g, '\n\n');

  if (!text) return fail('Text is required.');
  if (text.length > 12_000) return fail('This story is too long to read aloud.');

  return { ok: true, value: { text } };
}
