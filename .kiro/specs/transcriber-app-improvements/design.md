# Design Document — transcriber-app-improvements

Minimal design to unblock task generation. All improvements are in-place changes to the existing Next.js 16 app.

## Architecture

No new routes or services. Changes are confined to:
- `app/components/TranscriberClient.js` — progress steps, duration, translation warning, history wiring
- `app/components/HistoryPanel.js` — server-side fetch, live update via callback prop
- `app/components/AdBanner.js` — env-var slot IDs
- `app/api/transcribe/route.js` — translationFailed flag, rate limiting
- `app/api/history/route.js` — already implemented, no changes needed
- `app/transcribe/page.js` — pass ad slot env vars to AdBanner
- `app/globals.css` — remove unused CSS variables
- `.gitignore` — add .env.local
- `.env.local.example` — new file
- `auth.js` — delete
- `__tests__/` — new Jest + RTL test files

## Key Decisions

- Rate limiting: in-memory Map keyed by user email, rolling 24h window, resets on server restart (acceptable for MVP)
- History: switch TranscriberClient to POST /api/history after transcription; HistoryPanel fetches from GET /api/history
- Live history update: TranscriberClient passes new entry up via an `onNewEntry` callback to HistoryPanel
- Duration: Web Audio API `AudioContext.decodeAudioData` in the browser, omitted silently on failure
- Translation failure: API returns `translationFailed: true` in response JSON; client shows amber banner
