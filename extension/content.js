/**
 * Neural Orb — browser companion (content script).
 *
 * PRIVACY FIRST. This script never reads text, never reads answers, never reads
 * files, never reads conversations. It only counts *how much the page changes*
 * to know whether the AI is thinking, answering or done, and reports activity
 * metadata (a type and a number) to the local Neural Orb app.
 */
(() => {
  const HEARTBEAT_MS = 30_000;
  const STREAM_TICK_MS = 1200;
  const QUIET_MS = 2500;

  let mutations = 0;
  let startedAt = 0;
  let lastBurst = 0;
  let streaming = false;

  const send = (type, extra = {}) => {
    try {
      chrome.runtime.sendMessage({ kind: "activity", signal: { type, source: "browser", ...extra } });
    } catch {
      /* app closed — nothing to do, the sphere reconnects on its own */
    }
  };

  // ---- user asked something (no key, no text, only the gesture) ----
  const onAsk = () => {
    const now = Date.now();
    if (now - startedAt < 800) return;
    startedAt = now;
    lastBurst = now;
    send("USER_INPUT", { intensity: 0.8 });
    send("AI_STARTED", { intensity: 0.7 });
  };

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const el = e.target;
      if (!el) return;
      const editable = el.isContentEditable || el.tagName === "TEXTAREA";
      if (editable) onAsk();
    },
    true,
  );

  document.addEventListener(
    "click",
    (e) => {
      const el = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.dataset.testid || "").toLowerCase();
      if (/send|submit|envoyer|prompt/.test(label)) onAsk();
    },
    true,
  );

  // ---- is the AI answering? measured by change volume only ----
  new MutationObserver((records) => {
    mutations += records.length;
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  setInterval(() => {
    const now = Date.now();
    const rate = mutations;
    mutations = 0;
    if (!startedAt) return;

    if (rate > 6) {
      lastBurst = now;
      streaming = true;
      const elapsed = (now - startedAt) / 1000;
      send("STREAMING", {
        intensity: Math.min(1, 0.4 + rate / 120),
        complexity: Math.min(1, 0.3 + elapsed / 25),
      });
    } else if (streaming && now - lastBurst > QUIET_MS) {
      streaming = false;
      startedAt = 0;
      send("AI_COMPLETED", { intensity: 0.75, durationMs: now - lastBurst });
    } else if (!streaming && now - startedAt > 90_000) {
      startedAt = 0;
    }
  }, STREAM_TICK_MS);

  // ---- presence: lets the app show "Connecté" without any setup ----
  const beat = () => send("IDLE", { intensity: 0 });
  beat();
  setInterval(beat, HEARTBEAT_MS);
})();
