import { formatBytes, validateFile } from "@/app/components/TranscriberClient";
import { timeAgo } from "@/app/components/HistoryPanel";

// ─── formatBytes ────────────────────────────────────────────────────────────

describe("formatBytes", () => {
  it("formats zero bytes as KB", () => {
    expect(formatBytes(0)).toBe("0.0 KB");
  });

  it("formats kilobyte values", () => {
    expect(formatBytes(512)).toBe("0.5 KB");
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats megabyte values", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(5.5 * 1024 * 1024)).toBe("5.5 MB");
  });
});

// ─── timeAgo ────────────────────────────────────────────────────────────────

describe("timeAgo", () => {
  const now = Date.now();

  it('returns "just now" for less than 1 minute ago', () => {
    expect(timeAgo(new Date(now - 30_000).toISOString())).toBe("just now");
  });

  it("returns minutes ago", () => {
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString())).toBe("5m ago");
  });

  it("returns hours ago", () => {
    expect(timeAgo(new Date(now - 3 * 60 * 60_000).toISOString())).toBe("3h ago");
  });

  it("returns days ago", () => {
    expect(timeAgo(new Date(now - 2 * 24 * 60 * 60_000).toISOString())).toBe("2d ago");
  });
});

// ─── validateFile ────────────────────────────────────────────────────────────

const MAX_SIZE_MB = 25;

function makeFile(name, sizeBytes) {
  return { name, size: sizeBytes };
}

describe("validateFile", () => {
  it("returns null for a valid file", () => {
    expect(validateFile(makeFile("audio.mp3", 1024 * 1024))).toBeNull();
  });

  it("returns an error for an unsupported extension", () => {
    const err = validateFile(makeFile("audio.xyz", 1024));
    expect(err).toMatch(/Unsupported format/);
    expect(err).toMatch(/\.xyz/);
  });

  it("returns an error when file exceeds max size", () => {
    const tooBig = (MAX_SIZE_MB + 1) * 1024 * 1024;
    const err = validateFile(makeFile("audio.mp3", tooBig));
    expect(err).toMatch(/too large/i);
    expect(err).toMatch(`${MAX_SIZE_MB} MB`);
  });
});
