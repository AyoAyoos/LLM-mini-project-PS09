export interface StoryRequest {
  age: number;
  characters: string[];
  moral: string;
}

export interface Story {
  title: string;
  story: string;
  moral: string;
}

export type AppStatus = 'form' | 'loading' | 'story' | 'error';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}
