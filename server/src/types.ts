/** Shared server-side domain types. */

export interface StoryInput {
  age: number;
  characters: string[];
  moral: string;
}

export interface StoryResponse {
  title: string;
  story: string;
  moral: string;
}

export interface StoryService {
  generateStory(input: StoryInput): Promise<StoryResponse>;
}

export interface SpeechService {
  synthesizeSpeech(text: string): Promise<Buffer>;
}

export interface GeminiSettings {
  apiKey: string;
  textModel: string;
  ttsModel: string;
  ttsVoice: string;
  timeoutMs: number;
}
