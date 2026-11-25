import cors from 'cors';
import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { config } from './config.js';
import { AppError, badRequest } from './errors.js';
import { speechService, storyService } from './gemini.js';
import { createRateLimit } from './rateLimit.js';
import type { SpeechService, StoryService } from './types.js';
import { validateStoryInput, validateTtsInput } from './validation.js';

interface AppDependencies {
  storyService?: StoryService;
  speechService?: SpeechService;
}

const asyncHandler =
  (handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };

export function createApp(dependencies: AppDependencies = {}) {
  const app = express();
  const stories = dependencies.storyService ?? storyService;
  const speech = dependencies.speechService ?? speechService;

  app.disable('x-powered-by');
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '32kb' }));

  const limitRequests = createRateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: 'A few stories in a row is plenty. Please wait a moment and try again.',
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      models: { text: config.textModel, tts: config.ttsModel },
      voice: config.ttsVoice,
    });
  });

  app.post(
    '/api/story',
    limitRequests,
    asyncHandler(async (req, res) => {
      const validation = validateStoryInput(req.body);
      if (!validation.ok) throw badRequest(validation.error);

      const story = await stories.generateStory(validation.value);
      res.json(story);
    }),
  );

  app.post(
    '/api/tts',
    limitRequests,
    asyncHandler(async (req, res) => {
      const validation = validateTtsInput(req.body);
      if (!validation.ok) throw badRequest(validation.error);

      const wav = await speech.synthesizeSpeech(validation.value.text);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(wav.length));
      res.setHeader('Cache-Control', 'no-store');
      res.send(wav);
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: 'That page does not exist.' });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      res.status(error.status).json({ error: error.message, code: error.code });
      return;
    }

    const parseError = error as { type?: string };
    if (parseError?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'The request body is not valid JSON.' });
      return;
    }

    console.error('[http] unhandled error', error);
    res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
