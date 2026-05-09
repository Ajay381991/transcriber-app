/**
 * Integration tests for /api/transcribe
 * No auth required — tests rate limiting and missing file handling.
 *
 * @jest-environment node
 */

// Mock fetch so we don't hit real Groq API
global.fetch = jest.fn();

// Set required env var
process.env.GROQ_API_KEY = "test-key";

describe("POST /api/transcribe — missing file", () => {
  it("returns 400 when no file is provided", async () => {
    const { POST } = await import("@/app/api/transcribe/route");
    const formData = new FormData();
    const req = new Request("http://localhost/api/transcribe", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no file/i);
  });
});

describe("POST /api/transcribe — missing GROQ_API_KEY", () => {
  it("returns 500 when GROQ_API_KEY is not set", async () => {
    const savedKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    // Re-import to get fresh module with no key
    jest.resetModules();
    const { POST } = await import("@/app/api/transcribe/route");
    const req = new Request("http://localhost/api/transcribe", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/configuration/i);

    process.env.GROQ_API_KEY = savedKey;
  });
});
