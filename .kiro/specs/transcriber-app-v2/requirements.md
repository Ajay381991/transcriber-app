# Requirements Document

## Introduction

Rebuild the existing transcriber-app as **transcriber-app-v2** — a public, auth-free audio transcription web app hosted at `transcribe.dmnstech.com`. The rebuild removes all Google OAuth / NextAuth dependencies, switches rate limiting from per-email to per-IP, moves transcription history to browser localStorage, and adds a production deployment guide for AWS EC2 + Nginx + PM2 behind Cloudflare DNS/CDN. All other capabilities (Groq Whisper transcription, LLaMA translation, AdSense, UX polish) are preserved.

---

## Glossary

- **App**: The Next.js 16 App Router web application being rebuilt.
- **API_Route**: The Next.js server-side route handler at `/api/transcribe`.
- **Groq_API**: The external Groq REST API used for transcription (`whisper-large-v3-turbo`) and translation (`llama-3.3-70b-versatile`).
- **Rate_Limiter**: The in-memory IP-based request throttle running inside the Next.js server process.
- **History_Store**: The browser `localStorage` key (`transcriber_history`) used to persist transcription records client-side.
- **AdSense**: Google AdSense ad units rendered via the existing `AdBanner` component.
- **EC2_Instance**: The AWS EC2 virtual machine that hosts the production Next.js process.
- **PM2**: The Node.js process manager used to keep the Next.js server running on EC2.
- **Nginx**: The reverse proxy running on EC2 that terminates HTTP/HTTPS and forwards requests to PM2.
- **Cloudflare**: The DNS and CDN provider managing the `transcribe.dmnstech.com` domain.

---

## Requirements

### Requirement 1: Public Access — No Authentication

**User Story:** As a visitor, I want to use the transcriber without signing in, so that I can transcribe audio immediately without creating an account.

#### Acceptance Criteria

1. THE App SHALL render the transcription UI directly at the root path `/` without requiring any login step.
2. THE App SHALL NOT include NextAuth, `next-auth`, or any OAuth provider dependency in `package.json`.
3. THE App SHALL NOT contain any `middleware.js` route guard that redirects unauthenticated users.
4. THE App SHALL NOT display a user avatar, user name, or sign-out button anywhere in the UI.
5. WHEN a user navigates to the App, THE App SHALL display the transcription card without an intermediate landing/sign-in page.

---

### Requirement 2: Server-Side Groq API Key Security

**User Story:** As the operator, I want the Groq API key stored only on the server, so that it is never exposed to browser clients.

#### Acceptance Criteria

1. THE API_Route SHALL read the Groq API key exclusively from the `GROQ_API_KEY` server-side environment variable.
2. THE App SHALL NOT reference `GROQ_API_KEY` in any client-side component or `NEXT_PUBLIC_*` environment variable.
3. WHEN the API_Route calls the Groq_API, THE API_Route SHALL include the key in the `Authorization` HTTP header server-to-server only.
4. IF `GROQ_API_KEY` is absent or empty at startup, THEN THE API_Route SHALL return HTTP 500 with the message `"Server configuration error"` for any transcription request.

---

### Requirement 3: IP-Based Rate Limiting

**User Story:** As the operator, I want to limit requests by IP address, so that anonymous users cannot exhaust the Groq API quota.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL allow a maximum of 10 transcription requests per IP address within any rolling 24-hour window.
2. WHEN a request arrives, THE Rate_Limiter SHALL derive the client IP from the `x-forwarded-for` header (first value) or, if absent, from the request socket address.
3. WHEN a request is within the limit, THE API_Route SHALL process it and return a `requestsRemaining` field in the JSON response body.
4. WHEN a request exceeds the limit, THE API_Route SHALL return HTTP 429 with a JSON body containing `error`, `requestsRemaining: 0`, and `limitResetAt` (ISO 8601 timestamp of when the window resets).
5. THE Rate_Limiter SHALL use an in-memory sliding-window store keyed by IP address.
6. IF the App process restarts, THEN THE Rate_Limiter SHALL reset all counters (in-memory only; persistence is not required).

---

### Requirement 4: Core Transcription

**User Story:** As a user, I want to upload an audio file and receive a text transcript, so that I can convert spoken content to text.

#### Acceptance Criteria

1. THE App SHALL accept audio files in the formats: `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `wav`, `webm`, `ogg`, `flac`.
2. THE App SHALL reject files larger than 25 MB and display a descriptive error message to the user.
3. WHEN a valid audio file is submitted, THE API_Route SHALL forward it to the Groq_API using the `whisper-large-v3-turbo` model.
4. WHEN the Groq_API returns a successful response, THE API_Route SHALL return the transcript text, `requestsRemaining`, `limitResetAt`, and a `meta` object containing `id`, `fileName`, `fileSize`, `language`, and `createdAt`.
5. IF the Groq_API returns HTTP 429 or 5xx, THEN THE API_Route SHALL retry up to 2 times with exponential back-off (500 ms, 1000 ms) before returning an error to the client.
6. WHEN a file between 20 MB and 25 MB is selected, THE App SHALL display an amber warning that transcription may take longer than usual.
7. WHEN an audio file is selected, THE App SHALL display the file name, size, and audio duration (derived via the Web Audio API).

---

### Requirement 5: Translation

**User Story:** As a user, I want to translate the transcript into a target language, so that I can read the content in my preferred language.

#### Acceptance Criteria

1. THE App SHALL present a dropdown listing at minimum the following target languages: English, Hindi, Urdu, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Arabic, Chinese, French, German, Spanish, Portuguese, Russian, Japanese, Korean, Turkish, Italian, Dutch, Persian, plus a "Keep Original" option.
2. WHEN the user selects a target language and submits, THE API_Route SHALL call the Groq_API chat completions endpoint using the `llama-3.3-70b-versatile` model to translate the transcript.
3. WHEN translation succeeds, THE API_Route SHALL return the translated text as the `text` field.
4. IF translation fails for any reason, THEN THE API_Route SHALL set `translationFailed: true` in the response and return the original transcript as `text`.
5. WHEN `translationFailed` is true, THE App SHALL display an amber warning banner informing the user that translation failed and the original transcript is shown.

---

### Requirement 6: Transcript Output and Actions

**User Story:** As a user, I want to copy, download, and review my transcript, so that I can use the text in other applications.

#### Acceptance Criteria

1. WHEN a transcript is available, THE App SHALL display it in a scrollable text area with a word count and character count.
2. WHEN the user clicks "Copy", THE App SHALL write the transcript text to the system clipboard and display a success toast notification.
3. WHEN the user clicks "Download", THE App SHALL trigger a browser download of a `.txt` file named after the source audio file.
4. THE App SHALL display a progress status label ("Uploading…", "Transcribing…", "Translating…") adjacent to the loading spinner during each phase.

---

### Requirement 7: Client-Side Transcription History

**User Story:** As a user, I want to see my past transcriptions in the current browser, so that I can retrieve previous results without re-uploading files.

#### Acceptance Criteria

1. THE History_Store SHALL persist transcription entries in `localStorage` under the key `transcriber_history` as a JSON array.
2. WHEN a transcription completes successfully, THE App SHALL prepend a new entry to the History_Store containing `id`, `fileName`, `fileSize`, `language`, `transcript`, and `createdAt`.
3. THE History_Store SHALL retain a maximum of 50 entries; older entries beyond this limit SHALL be discarded.
4. WHEN the user opens the history panel, THE App SHALL read and display entries from the History_Store without making any server API call.
5. WHEN the user clicks "Restore" on a history entry, THE App SHALL populate the transcript output area with that entry's text.
6. WHEN the user deletes a single history entry, THE App SHALL remove it from the History_Store and update the displayed list.
7. WHEN the user clicks "Clear all", THE App SHALL empty the History_Store after a confirmation prompt.
8. IF the History_Store is empty or `localStorage` is unavailable, THEN THE App SHALL display a "No transcriptions yet" placeholder in the history panel.

---

### Requirement 8: Google AdSense Integration

**User Story:** As the operator, I want AdSense ad units displayed on the page, so that the service generates ad revenue.

#### Acceptance Criteria

1. THE App SHALL render an AdSense ad unit above the main transcription card using the `AdBanner` component.
2. THE App SHALL render an AdSense ad unit below the main transcription card using the `AdBanner` component.
3. THE AdBanner component SHALL read the AdSense publisher ID from `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` and slot IDs from `NEXT_PUBLIC_TOP_AD_SLOT_ID` and `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID`.
4. IF an AdSense environment variable is absent, THEN THE AdBanner component SHALL render nothing (no broken placeholder).

---

### Requirement 9: EC2 Production Deployment

**User Story:** As the operator, I want a deployment guide for AWS EC2, so that I can host the app reliably in production.

#### Acceptance Criteria

1. THE App repository SHALL include a `DEPLOYMENT.md` file documenting the complete EC2 setup procedure.
2. THE DEPLOYMENT.md SHALL document installing Node.js 20 LTS, cloning the repository, running `npm ci`, and building with `npm run build` on the EC2 instance.
3. THE DEPLOYMENT.md SHALL document configuring PM2 to start the Next.js server with `next start` and to restart it automatically on system reboot via `pm2 startup` and `pm2 save`.
4. THE DEPLOYMENT.md SHALL document an Nginx `server` block configuration that proxies HTTP requests on port 80 to the Next.js process on port 3000.
5. THE DEPLOYMENT.md SHALL document obtaining and renewing a TLS certificate via Certbot (Let's Encrypt) and configuring Nginx to serve HTTPS on port 443.
6. THE DEPLOYMENT.md SHALL document the required `.env.local` environment variables: `GROQ_API_KEY`, `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`, `NEXT_PUBLIC_TOP_AD_SLOT_ID`, `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID`.

---

### Requirement 10: Cloudflare DNS Configuration

**User Story:** As the operator, I want Cloudflare to manage DNS and CDN for the domain, so that the app benefits from DDoS protection and global caching.

#### Acceptance Criteria

1. THE DEPLOYMENT.md SHALL document adding an `A` record in Cloudflare pointing `transcribe.dmnstech.com` to the EC2 public IP address with the Cloudflare proxy (orange cloud) enabled.
2. THE DEPLOYMENT.md SHALL document setting the Cloudflare SSL/TLS mode to "Full (strict)" to encrypt traffic between Cloudflare and the EC2 origin.
3. THE DEPLOYMENT.md SHALL document creating a Cloudflare Page Rule (or Cache Rule) to bypass caching for the `/api/*` path so that rate-limit state is not served stale.
