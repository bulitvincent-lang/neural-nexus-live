/**
 * Neural Orb — browser companion (background).
 *
 * Forwards activity metadata to the Neural Orb app running on the same
 * computer. Nothing leaves the machine, and nothing but numbers and event names
 * is ever sent.
 */
const APP_ENDPOINT = "http://127.0.0.1:4319/activity";

let queue = [];
let flushing = false;

async function flush() {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const signals = queue.splice(0, 24);
  try {
    await fetch(APP_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ signals }),
    });
  } catch {
    // app not running: drop silently, the next launch reconnects by itself
  }
  flushing = false;
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.kind !== "activity" || !message.signal) return;
  if (queue.length > 96) queue.splice(0, queue.length - 96);
  queue.push(message.signal);
  void flush();
});

setInterval(flush, 500);
