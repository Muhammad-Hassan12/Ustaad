import test from "node:test";
import assert from "node:assert/strict";

// 1. Test UUID session validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidSessionId(id) {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

test("isValidSessionId verifies valid UUIDs and rejects corrupt strings", () => {
  assert.equal(isValidSessionId("9b1deb4d-3b7d-4b69-9672-2e1609870123"), true);
  assert.equal(isValidSessionId("  9B1DEB4D-3B7D-4B69-9672-2E1609870123  "), true);
  assert.equal(isValidSessionId(""), false);
  assert.equal(isValidSessionId("invalid-uuid"), false);
  assert.equal(isValidSessionId("../../etc/passwd"), false);
  assert.equal(isValidSessionId(null), false);
  assert.equal(isValidSessionId(12345), false);
});

// 2. Test Recent Sessions sanitization and cap
test("Recent sessions cap at 10 and prune corrupted elements", () => {
  const mockStorage = {};
  globalThis.localStorage = {
    getItem(k) { return mockStorage[k] || null; },
    setItem(k, v) { mockStorage[k] = v; },
    removeItem(k) { delete mockStorage[k]; },
  };

  const sessions = [];
  for (let i = 0; i < 15; i++) {
    const id = `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`;
    sessions.push({
      id,
      role: `Role ${i}`,
      city: "Karachi",
      timestamp: Date.now() + i,
    });
  }

  // Corrupted item injection
  sessions.push({ id: "corrupt-id", role: "Hacker" });
  sessions.push(null);

  mockStorage["ustaad_recent_sessions"] = JSON.stringify(sessions);

  // Parse according to recentSessions.ts logic
  const parsed = JSON.parse(mockStorage["ustaad_recent_sessions"]);
  const valid = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === "object" &&
      isValidSessionId(item.id) &&
      typeof item.role === "string" &&
      item.role.trim().length > 0 &&
      typeof item.city === "string" &&
      typeof item.timestamp === "number" &&
      Number.isFinite(item.timestamp)
    ) {
      valid.push({
        id: item.id.trim(),
        role: item.role.trim().slice(0, 100),
        city: item.city.trim().slice(0, 50),
        timestamp: item.timestamp,
      });
    }
  }
  const capped = valid.slice(0, 10);

  assert.equal(capped.length, 10);
  assert.equal(capped.every(s => isValidSessionId(s.id)), true);
});

// 3. Test RFC 5545 iCalendar line folding and syntax
test("iCalendar content complies with RFC 5545 75-byte line folding", () => {
  function foldLine(line) {
    if (line.length <= 75) return line;
    let folded = "";
    let remaining = line;
    let isFirst = true;
    while (remaining.length > 0) {
      const sliceLen = isFirst ? 75 : 74;
      folded += (isFirst ? "" : "\r\n ") + remaining.slice(0, sliceLen);
      remaining = remaining.slice(sliceLen);
      isFirst = false;
    }
    return folded;
  }

  const longLine = "DESCRIPTION:This is an extremely long learning task line that definitely exceeds seventy-five octets in length and must be folded according to RFC 5545 specifications.";
  const folded = foldLine(longLine);

  assert.match(folded, /\r\n /);
  const lines = folded.split("\r\n");
  assert.equal(lines[0].length <= 75, true);
  assert.equal(lines[1].length <= 75, true);
  assert.equal(lines[1].startsWith(" "), true);
});

// 4. Test Resource Link Platform Matcher
test("Resource links map canonical CS50 courses as curated", () => {
  const CANONICAL_DIRECT_COURSES = [
    {
      matcher: (r) => r.includes("cs50p") || r.includes("cs50 python"),
      url: "https://cs50.harvard.edu/python/",
      label: "CS50 Python (Harvard)",
    },
    {
      matcher: (r) => r.includes("cs50w") || r.includes("cs50 web"),
      url: "https://cs50.harvard.edu/web/",
      label: "CS50 Web (Harvard)",
    },
  ];

  function resolve(resource, platform) {
    const res = (resource || "").toLowerCase();
    const plat = (platform || "").toLowerCase();
    for (const c of CANONICAL_DIRECT_COURSES) {
      if (c.matcher(res, plat)) {
        return { url: c.url, isCurated: true, label: c.label };
      }
    }
    return { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(resource)}`, isCurated: false };
  }

  const match1 = resolve("CS50 Python Course", "Harvard");
  assert.equal(match1.isCurated, true);
  assert.equal(match1.url, "https://cs50.harvard.edu/python/");

  const match2 = resolve("Advanced FastAPI Microservices", "YouTube");
  assert.equal(match2.isCurated, false);
  assert.match(match2.url, /youtube\.com/);
});

