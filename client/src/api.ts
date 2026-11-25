import type { Story, StoryRequest } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null && 'error' in data) {
      const message = (data as { error?: unknown }).error;
      if (typeof message === 'string' && message.trim()) return message;
    }
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }

  if (response.status === 429) {
    return 'A few stories in a row is plenty. Please wait a moment and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export async function requestStory(request: StoryRequest, signal?: AbortSignal): Promise<Story> {
  const response = await fetch('/api/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);

  const data: unknown = await response.json();
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof (data as Story).title !== 'string' ||
    typeof (data as Story).story !== 'string' ||
    typeof (data as Story).moral !== 'string'
  ) {
    throw new ApiError('The story came back in an unexpected format.', 502);
  }

  return data as Story;
}

export async function requestSpeech(text: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) throw new ApiError(await readErrorMessage(response), response.status);

  const blob = await response.blob();
  if (blob.size === 0) throw new ApiError('No audio was returned.', 502);
  return blob;
}
