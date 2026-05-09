# Implementation Tasks — transcriber-app-improvements

- [x] 1. Credentials & dead code cleanup
- [x] 2. AdSense slot IDs via environment variables
- [x] 3. API rate limiting on /api/transcribe
- [x] 4. Translation failure notification
- [x] 5. Stepped progress feedback
- [x] 6. Audio file duration display
- [x] 7. Server-side history persistence
- [x] 8. History badge live update
- [x] 9. Test coverage baseline

- [x] 10. Download transcript button
  - [x] 10.1 Add a "Download .txt" button next to the Copy button in the transcript section
  - [x] 10.2 Filename should be derived from the original audio file name (e.g. `interview.mp3` → `interview.txt`)

- [x] 11. Word and character count on transcript
  - [x] 11.1 Display word count and character count below the transcript box

- [x] 12. Rate limit remaining indicator
  - [x] 12.1 Return `requestsRemaining` and `limitResetAt` in the transcribe API response
  - [x] 12.2 Display remaining requests as a subtle indicator in the UI (e.g. "8 of 10 requests remaining today")

- [x] 13. File size warning before upload
  - [x] 13.1 Show an amber warning when selected file is over 20 MB (but under the 25 MB hard limit)

- [x] 14. Groq API retry logic
  - [x] 14.1 Wrap the Groq transcription fetch in a retry helper (max 2 retries, exponential backoff) for transient 5xx errors
  - [x] 14.2 Only retry on 429 (rate limit from Groq) and 5xx — not on 4xx client errors

- [x] 15. Toast notification system
  - [x] 15.1 Create a lightweight `Toast` component (top-right, auto-dismiss after 4s, supports success/error/warning variants)
  - [x] 15.2 Replace the inline "history saved" / "history save failed" silent handling with toast notifications
  - [x] 15.3 Show a success toast when transcript is copied to clipboard
