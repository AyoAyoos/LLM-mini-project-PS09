import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/errors.js';
import type { StoryInput } from '../src/types.js';

const sampleStory = {
  title: 'The Sleepy Turtle',
  story: 'Tara yawned.\n\nThe moon smiled.',
  moral: 'Sharing makes bedtime brighter.',
};

function makeApp() {
  let receivedInput: StoryInput | undefined;

  const app = createApp({
    storyService: {
      async generateStory(input) {
        receivedInput = input;
        return sampleStory;
      },
    },
    speechService: {
      async synthesizeSpeech() {
        return Buffer.from([1, 2, 3, 4]);
      },
    },
  });

  return { app, getReceivedInput: () => receivedInput };
}

test('POST /api/story returns the structured story', async () => {
  const { app, getReceivedInput } = makeApp();
  const response = await request(app).post('/api/story').send({
    age: 6,
    characters: ['Tara the turtle'],
    moral: 'Sharing',
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, sampleStory);
  assert.deepEqual(getReceivedInput(), {
    age: 6,
    characters: ['Tara the turtle'],
    moral: 'Sharing',
  });
});

test('POST /api/story rejects invalid input with 400 and a clear message', async () => {
  const { app } = makeApp();
  const response = await request(app).post('/api/story').send({ age: 12, characters: [], moral: '' });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /Age must be a whole number between 2 and 10/);
});

test('POST /api/tts returns WAV bytes', async () => {
  const { app } = makeApp();
  const response = await request(app)
    .post('/api/tts')
    .send({ text: 'Hello there.' })
    .buffer(true)
    .parse((incoming, callback) => {
      const chunks: Buffer[] = [];
      incoming.on('data', (chunk: Buffer) => chunks.push(chunk));
      incoming.on('end', () => callback(null, Buffer.concat(chunks)));
    });

  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'audio/wav');
  assert.deepEqual(response.body, Buffer.from([1, 2, 3, 4]));
});

test('service errors become friendly 5xx responses', async () => {
  const app = createApp({
    storyService: {
      async generateStory() {
        throw new AppError(503, 'The story service is busy right now.', 'service_busy');
      },
    },
  });

  const response = await request(app).post('/api/story').send({
    age: 5,
    characters: ['Tara'],
    moral: 'Kindness',
  });

  assert.equal(response.status, 503);
  assert.equal(response.body.error, 'The story service is busy right now.');
});

test('both endpoints share a 10-requests-per-minute-per-IP limit', async () => {
  const { app } = makeApp();
  const payload = { age: 5, characters: ['Tara'], moral: 'Kindness' };

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await request(app).post('/api/story').send(payload);
    assert.equal(response.status, 200, `attempt ${attempt}`);
  }

  const blocked = await request(app).post('/api/tts').send({ text: 'Too many.' });
  assert.equal(blocked.status, 429);
  assert.match(blocked.body.error, /wait a moment/);
});
