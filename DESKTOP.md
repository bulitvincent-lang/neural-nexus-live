# Neural Orb — desktop notes

## Architecture

```
AI Provider  ->  Activity Adapter  ->  EventBus  ->  NeuralEngine  ->  Sphere
```

- `src/lib/neural/eventBus.ts` — provider-agnostic bus (`activityBus`) + `ActivityAdapter` contract.
- `src/lib/neural/mockActivity.ts` — development-only simulator (`import.meta.env.DEV`), no UI.
- `src/lib/neural/neuralEngine.ts` — turns events into graphics parameters with asymmetric easing
  (fast rise ~300–800 ms, slow calm-down over seconds).
- `src/lib/neural/network.ts` — the persistent, seeded neural anatomy (clusters, scaffolding, long tracts).
- `src/components/neural/` — GPU rendering: node points, edge line segments, pulse points, dust, bloom.

### Connecting a real AI

```ts
import { activityBus } from "@/lib/neural/eventBus";

activityBus.push("TOOL_CALL", { intensity: 0.8, complexity: 0.7, duration: 2400 });
```

Write one adapter per provider (OpenAI, Anthropic, Gemini, MCP, local models) that normalises its
stream into these events. The renderer never knows which provider is in use.

## Sizes / quality

`?quality=ULTRA|HIGH|BALANCED|LOW_POWER` forces a profile; otherwise it is auto-selected from window
size and CPU cores. Window sizes: MINI 100–150 px, STANDARD 300–500 px, LARGE fullscreen.

## Tauri

`src-tauri/tauri.conf.json` is ready: frameless, transparent, always-on-top, resizable, no taskbar
entry, `/` as the only view. The page root carries `data-tauri-drag-region` so the orb is draggable.

To finish the desktop build:

```bash
bun add -D @tauri-apps/cli && bunx tauri init --ci   # generates Cargo.toml / src / icons
bunx tauri dev
```

Useful additions in `src-tauri/src/main.rs`:

- `window.set_ignore_cursor_events(true)` for passive click-through mode.
- autostart via `tauri-plugin-autostart`.

Rendering pauses when the window is hidden and the engine drops to near-zero work when the AI is idle.
