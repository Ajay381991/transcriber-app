# Requirements Document

## Introduction

This document captures the requirements for improving the `transcriber-app` — a Next.js 16 production audio transcription application with Google OAuth, server-side Groq API calls, translation, and AdSense. The improvements span six areas: UX feedback, silent failure handling, server-side history persistence, security hardening, code quality cleanup, and AdSense configuration. The goal is to make the app production-ready for live hosting at a custom domain.

## Glossary

- **App**: The `transcriber-app` Next.js 16 application.
- **TranscriberClient**: The client-side React component (`app/components/TranscriberClient.js`) that handles file upload, transcription, and transcript display.
- **HistoryPanel**: The client-side React component (`app/components/HistoryPanel.js`) that displays and manages transcription history.
- **History_API**: The server-side Next.js route at `/api/history` (GET/POST/DELETE) that persists transcription history to disk.
- **Transcribe_API**: The server-side Next.js route at `/api/transcribe` (POST) that calls Groq for transcription and optional translation.
- **Rate_Limiter**: The in-memory or file-based mechanism that enforces per-user request limits on the Transcribe_API.
- **AdBanner**: The client-side React component (`app/components/AdBanner.js`) that renders Google AdSense ad units.
- **Slot_ID**: The numeric identifier assigned by Google AdSense to a specific ad unit.
- **Session**: An authenticated user session managed by NextAuth.js.
- **History_Entry**: A single transcription record containing `id`, `fileName`, `fileSize`, `language`, `transcript`, and `createdAt` fields.

---

## Requirements

### Requirement 1: Stepped Progress Feedback During Transcription

**User Story:** As a user, I want to see descriptive status messages during transcription, so that I know what the app is doing and how long to wait.

#### Acceptance Criteria

1. WHEN the user clicks the Transcribe button, THE TranscriberClient SHALL display the status message "Uploading…" while the file is being sent to the server.
2. WHEN the Transcribe_API begins processing the audio with Groq, THE TranscriberClient SHALL display the status message "Transcribing…".
3. WHEN a translation language is selected and transcription is complete, THE TranscriberClient SHALL display the status message "Translating…" while the translation request is in progress.
4. WHEN transcription (and optional translation) completes successfully, THE TranscriberClient SHALL replace the status message with the completed transcript.
5. THE TranscriberClient SHALL display the current status message alongside the existing loading spinner so that the user sees both a visual indicator and a text description.

---

### Requirement 2: Audio File Duration Display

**User Story:** As a user, I want to see the duration of my audio file before submitting it, so that I can set expectations for how long transcription will take.

#### Acceptance Criteria

1. WHEN a valid audio file is selected or dropped, THE TranscriberClient SHALL read the file's duration using the Web Audio API and display it alongside the file name and size.
2. THE TranscriberClient SHALL display the duration in `mm:ss` format for files under one hour, and `h:mm:ss` format for files one hour or longer.
3. IF the browser cannot determine the file duration, THEN THE TranscriberClient SHALL omit the duration field without displaying an error.

---

### Requirement 3: Translation Failure Notification

**User Story:** As a user, I want to be notified when translation fails, so that I know the displayed text is the original transcript rather than a translation.

#### Acceptance Criteria

1. WHEN the Transcribe_API translation request to Groq fails or returns an empty result, THE Transcribe_API SHALL include a `translationFailed: true` flag in the JSON response alongside the original transcript text.
2. WHEN the TranscriberClient receives a response with `translationFailed: true`, THE TranscriberClient SHALL display a visible warning message stating that translation failed and the original transcript is shown.
3. THE warning message SHALL be visually distinct from the error state (e.g. amber/yellow styling) so that the user understands the transcription itself succeeded.
4. WHEN `translationFailed` is absent or `false`, THE TranscriberClient SHALL display the transcript without any warning.

---

### Requirement 4: History Badge Live Update

**User Story:** As a user, I want the history badge count to update immediately after a new transcription, so that I can see my latest entry without reopening the history panel.

#### Acceptance Criteria

1. WHEN a transcription completes successfully, THE TranscriberClient SHALL notify the HistoryPanel of the new History_Entry without requiring the user to close and reopen the panel.
2. WHEN the HistoryPanel is closed, THE HistoryPanel SHALL display a badge showing the total count of stored History_Entries, and this count SHALL reflect entries added since the panel was last opened.
3. WHEN the HistoryPanel is open, THE HistoryPanel SHALL prepend the new History_Entry to the displayed list in real time without requiring a manual refresh.

---

### Requirement 5: Server-Side History Persistence

**User Story:** As a signed-in user, I want my transcription history stored on the server, so that I can access it from any device or browser.

#### Acceptance Criteria

1. WHEN a transcription completes successfully, THE TranscriberClient SHALL save the History_Entry by calling the History_API POST endpoint instead of writing to localStorage.
2. WHEN the HistoryPanel is opened, THE HistoryPanel SHALL fetch the user's History_Entries from the History_API GET endpoint instead of reading from localStorage.
3. WHEN the user deletes a single History_Entry, THE HistoryPanel SHALL call the History_API DELETE endpoint with the entry's `id` instead of modifying localStorage.
4. WHEN the user clears all history, THE HistoryPanel SHALL call the History_API DELETE endpoint with `id: "all"` instead of clearing localStorage.
5. THE History_API SHALL store History_Entries in per-user JSON files under `.data/history/` keyed by the user's email address.
6. THE History_API SHALL retain at most 50 History_Entries per user, discarding the oldest entries when the limit is exceeded.
7. IF the History_API returns an error during save, THEN THE TranscriberClient SHALL display a non-blocking warning that history could not be saved, while still displaying the transcript.
8. IF the History_API returns an error during fetch, THEN THE HistoryPanel SHALL display a message indicating history could not be loaded.

---

### Requirement 6: API Rate Limiting

**User Story:** As the app operator, I want to limit how many transcriptions a single user can request per day, so that the Groq API quota is not exhausted by a single account.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL allow each authenticated user a maximum of 10 transcription requests per 24-hour rolling window.
2. WHEN an authenticated user exceeds the 10-request limit within the 24-hour window, THE Transcribe_API SHALL return HTTP 429 with a JSON error body containing the message "Daily transcription limit reached. Please try again tomorrow."
3. WHEN the Transcribe_API returns HTTP 429, THE TranscriberClient SHALL display the error message to the user in the existing error display area.
4. THE Rate_Limiter SHALL track request counts per user using an in-memory store with a fallback reset on server restart, keyed by the user's email from the Session.
5. IF a user's Session is invalid or absent, THEN THE Transcribe_API SHALL return HTTP 401 before the Rate_Limiter is consulted.

---

### Requirement 7: Credentials Removed from Version Control

**User Story:** As the app operator, I want real credentials removed from committed files, so that API keys and OAuth secrets are not exposed in the repository.

#### Acceptance Criteria

1. THE App's `.gitignore` SHALL include `.env.local` so that the file is not tracked by Git.
2. THE repository SHALL contain a `.env.local.example` file listing all required environment variable names with placeholder values and no real secrets.
3. THE `.env.local.example` file SHALL document the following variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GROQ_API_KEY`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, `NEXT_PUBLIC_TOP_AD_SLOT_ID`, and `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID`.

---

### Requirement 8: AdSense Slot IDs via Environment Variables

**User Story:** As the app operator, I want AdSense slot IDs and the publisher client ID to be configurable via environment variables, so that I can set real values without modifying source code.

#### Acceptance Criteria

1. THE AdBanner component SHALL read the top ad slot ID from the `NEXT_PUBLIC_TOP_AD_SLOT_ID` environment variable instead of the hardcoded string `"TOP_AD_SLOT_ID"`.
2. THE AdBanner component SHALL read the bottom ad slot ID from the `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID` environment variable instead of the hardcoded string `"BOTTOM_AD_SLOT_ID"`.
3. THE AdBanner component SHALL read the AdSense publisher client ID from the `NEXT_PUBLIC_ADSENSE_CLIENT_ID` environment variable.
4. IF `NEXT_PUBLIC_TOP_AD_SLOT_ID` or `NEXT_PUBLIC_BOTTOM_AD_SLOT_ID` is not set, THEN THE AdBanner component SHALL render nothing for that slot rather than rendering a broken ad unit.

---

### Requirement 9: Dead Code Removal

**User Story:** As a developer, I want vestigial files and unused styles removed, so that the codebase is easier to understand and maintain.

#### Acceptance Criteria

1. THE App SHALL not contain the `auth.js` stub file at the project root, as its functionality is fully provided by `lib/authOptions.js`.
2. THE `app/globals.css` file SHALL not define CSS custom properties (variables) that are not referenced anywhere in the application's component or layout files.
3. WHEN dead CSS variables are removed from `globals.css`, THE App's visual appearance SHALL remain unchanged.

---

### Requirement 10: Test Coverage Baseline

**User Story:** As a developer, I want a baseline test suite for the app's core logic, so that regressions can be caught before deployment.

#### Acceptance Criteria

1. THE App SHALL include a test framework (Jest with React Testing Library) configured to run with `npm test`.
2. THE test suite SHALL include unit tests for the `formatBytes` utility function covering: zero bytes, kilobyte values, and megabyte values.
3. THE test suite SHALL include unit tests for the `timeAgo` utility function covering: less than one minute ago, minutes ago, hours ago, and days ago.
4. THE test suite SHALL include unit tests for the `validateFile` function covering: a valid file format and size, an unsupported file extension, and a file exceeding the maximum size.
5. THE test suite SHALL include an integration test for the Transcribe_API route verifying that an unauthenticated request returns HTTP 401.
6. THE test suite SHALL include an integration test for the History_API GET route verifying that an unauthenticated request returns HTTP 401.
7. WHEN `npm test` is run, THE test suite SHALL execute all tests and report results without requiring a running development server.
