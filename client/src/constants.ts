export const MORAL_PRESETS = [
  'Honesty',
  'Sharing',
  'Kindness',
  'Courage',
  'Patience',
  'Gratitude',
  'Teamwork',
] as const;

export const SIDEBAR_PRESETS = ['Honesty', 'Kindness', 'Courage'] as const;

export interface AgeBand {
  min: number;
  max: number;
  label: string;
  words: string;
}

export const AGE_BANDS: readonly AgeBand[] = [
  { min: 2, max: 3, label: 'Ages 2–3 · First words', words: '100–150 words' },
  { min: 4, max: 5, label: 'Ages 4–5 · Gentle tales', words: '200–300 words' },
  { min: 6, max: 7, label: 'Ages 6–7 · Small adventures', words: '300–450 words' },
  { min: 8, max: 10, label: 'Ages 8–10 · Bigger feelings', words: '450–650 words' },
] as const;

export function getAgeBand(age: number): AgeBand {
  return AGE_BANDS.find((band) => age >= band.min && age <= band.max) ?? AGE_BANDS[0]!;
}

export const TTS_VOICE_LABEL = 'Kore';
