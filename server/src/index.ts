import { createApp } from './app.js';
import { config, hasApiKey } from './config.js';

if (!hasApiKey()) {
  console.warn(
    '[startup] GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.',
  );
}

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`[server] Story API listening on http://localhost:${config.port}`);
  console.log(`[server] Text model: ${config.textModel}`);
  console.log(`[server] TTS model: ${config.ttsModel} (voice: ${config.ttsVoice})`);
});

function shutdown(): void {
  server.close(() => {
    console.log('[server] Stopped.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
