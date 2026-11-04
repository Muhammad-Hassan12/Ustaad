/**
 * Ustaad Recent Session Storage
 * 
 * Safely persists and validates session IDs in browser localStorage
 * with strict UUID format checking, length bounding, and corruption filtering.
 */

export interface RecentSession {
  id: string;
  role: string;
  city: string;
  timestamp: number;
}

const STORAGE_KEY = "ustaad_recent_sessions";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SESSIONS = 10;

export function isValidSessionId(id: unknown): id is string {
  return typeof id === "string" && UUID_REGEX.test(id.trim());
}

export function loadRecentSessions(): RecentSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const valid: RecentSession[] = [];
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
    return valid.slice(0, MAX_SESSIONS);
  } catch (err) {
    console.error("Failed to load recent sessions from localStorage:", err);
    return [];
  }
}

export function saveRecentSession(session: {
  id: string;
  role?: string | null;
  city?: string | null;
  timestamp?: number;
}): RecentSession[] {
  if (typeof window === "undefined") return [];
  if (!isValidSessionId(session.id)) return loadRecentSessions();

  try {
    const current = loadRecentSessions();
    const filtered = current.filter((s) => s.id !== session.id);
    const updated: RecentSession[] = [
      {
        id: session.id,
        role: (session.role || "Career Analysis").trim().slice(0, 100),
        city: (session.city || "Pakistan").trim().slice(0, 50),
        timestamp: session.timestamp ?? Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_SESSIONS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to save recent session:", err);
    return loadRecentSessions();
  }
}

export function clearRecentSessions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear recent sessions:", err);
  }
}
