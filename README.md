# Story Generator for Kids

A small end-to-end app that turns a child's age, a few characters and a moral into a calm bedtime story. The story can optionally be read aloud. The browser never sees the Gemini API key.

## Project structure

```
story-generator/
├── client/              # React + TypeScript + Vite single-page app
│   ├── src/
│   └── design.md        # Frontend design mapping (based on the root DESIGN.md)
├── server/              # Node + Express + TypeScript API
│   ├── src/
│   ├── test/
│   └── .env.example
├── package.json         # npm workspaces: client + server
└── README.md            # This file
```

The npm workspaces let one command start both apps. The original assignment documents in the parent folder were left untouched.

## Requirements

- Node.js 20+ and npm
- A Gemini API key with access to `gemini-3.5-flash-lite` and `gemini-3.8-flash-tts`

## Setup

```bash
cd story-generator
npm install
copy server\.env.example server\.env
```

Edit `server/.env` and replace `your_gemini_api_key_here` with your key.

> If you already have a `server/.env` from an older version of this project, update
> `GEMINI_TEXT_MODEL` to `gemini-3.5-flash-lite` and `GEMINI_TTS_MODEL` to
> `gemini-3.8-flash-tts`. Also set `GEMINI_TIMEOUT_MS` to `60000`; full-story audio
> can take about 30 seconds. The old `gemini-2.5-*` IDs return 404 for new API keys.

> On macOS/Linux use `cp server/.env.example server/.env` instead of `copy`.

## Run locally

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API health check: <http://localhost:4000/api/health>

Vite proxies `/api` requests to the Express server, so the browser only talks to its own origin. The key is read by the server from `server/.env` via `dotenv`.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | — | Server-only Gemini credential. Never put it in `client/`. |
| `GEMINI_TEXT_MODEL` | No | `gemini-3.5-flash-lite` | Fast, available model used for story generation. |
| `GEMINI_TTS_MODEL` | No | `gemini-3.8-flash-tts` | Model used for speech (`v1beta`). |
| `GEMINI_TTS_VOICE` | No | `Kore` | Gemini prebuilt voice. |
| `PORT` | No | `4000` | Express port. Vite proxy assumes this value. |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed browser origin for CORS. |
| `GEMINI_TIMEOUT_MS` | No | `60000` | Per-attempt Gemini timeout (1,000–120,000); full-story TTS can take ~30s. |
| `RATE_LIMIT_MAX` | No | `10` | Requests per IP per window. |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Fixed rate-limit window in ms. |

`gemini-3.8-flash` is also supported and can be selected with `GEMINI_TEXT_MODEL`; during high demand it may return `503`, so the faster `gemini-3.5-flash-lite` is the default.

`.env`, `.env.*` (except `.env.example`), build output and dependencies are ignored by Git.

## Scripts

Run from `story-generator/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts Express and Vite together with `concurrently`. |
| `npm run dev:server` | Express only, with `tsx watch`. |
| `npm run dev:client` | Vite only. |
| `npm run build` | Type-checks and builds both workspaces. |
| `npm start` | Runs the built server (`server/dist/index.js`). Build first. |
| `npm test` | Runs the server test suite (18 tests, no network or key needed). |
| `npm run typecheck` | Type-checks server and client. |

You can also target a workspace directly, e.g. `npm test -w server` or `npm run build -w client`.

## API

### `POST /api/story`

```json
{
  "age": 6,
  "characters": ["Tara the turtle", "a brave mouse"],
  "moral": "Kindness"
}
```

Response:

```json
{
  "title": "The Moonlit Pond",
  "story": "Paragraph one.\n\nParagraph two.",
  "moral": "Kindness grows when we share what we have."
}
```

Validation: integer age `2–10`, `1–4` characters of at most 40 characters each, moral of at most 80 characters. Control characters are stripped and whitespace is trimmed.

### `POST /api/tts`

```json
{ "text": "The Moonlit Pond. Paragraph one. Paragraph two." }
```

Response: `audio/wav` bytes. Gemini 3.8 unary TTS returns a complete WAV file; bytes that are already RIFF/WAVE are passed through unchanged. If an env override points at an older model that returns headerless 16-bit PCM at 24 kHz, mono, the server prepends a 44-byte RIFF/WAVE header.

### `GET /api/health`

Returns the active model names and voice, useful for checking configuration.

### Errors

Errors are JSON: `{ "error": "Friendly message", "code": "bad_request" }`. Common statuses: `400` validation, `429` rate limit, `502` Gemini/format failure, `503` missing key or busy service, `504` timeout.

## Approach note

- **One page, four UI states:** form, loading, story and error. The form stays visible but disabled during loading.
- **Prompting:** a fixed system instruction plus an age-band-parameterised user prompt. The model is asked for JSON matching a response schema; user text is wrapped in tags and explicitly labelled as data, not instructions.
- **Safety and purity:** the response is sanitised, markdown/code fences are removed, a stray `Moral:` line is dropped and blank lines are normalised before it reaches the UI.
- **Current Gemini models:** defaults use the generally available `gemini-3.5-flash-lite` for text and `gemini-3.8-flash-tts` for speech, with the SDK pinned to `3.6.1` and `v1beta` enabled for TTS. A model-level 404 returns an actionable message naming the env variable to change.
- **Resilience:** server-side timeout with one retry, typed error mapping, in-memory fixed-window rate limiting on both POST endpoints, and a browser `speechSynthesis` fallback when Gemini audio is unavailable.
- **Audio UX:** the WAV blob is cached per story with an object URL, so replay is instant; playback is stopped when a new story is requested or the form is cleared.
- **Styling:** all colours, radii, typography and interaction states come from the root `DESIGN.md`. See [`client/design.md`](client/design.md) for the component mapping.
- **Out of scope:** accounts, saved stories, illustrations, multiple languages and payments, as specified for the MVP.

## Verification

```bash
npm test          # 18 pass / 0 fail
npm run typecheck
npm run build
```

Live story and TTS calls require a valid `GEMINI_API_KEY` in `server/.env`; automated tests use injected fake services and do not call Gemini.

# LLM-mini-project-PS09
