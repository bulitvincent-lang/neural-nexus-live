/**
 * Private activity channel key.
 *
 * The sphere and whatever reports activity on the same computer share a random
 * key kept locally. It makes each stream private: activity from one person can
 * never reach another person's sphere, and nobody can push fake activity into
 * a stream they don't own.
 */
const STORAGE_KEY = "neural-orb.channel-key";

function randomKey() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `k${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getChannelKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = randomKey();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return randomKey();
  }
}
