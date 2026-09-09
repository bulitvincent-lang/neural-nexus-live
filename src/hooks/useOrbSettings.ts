import { useCallback, useEffect, useState } from "react";

export interface OrbSettings {
  /** 0.6 .. 1.4 */
  size: number;
  /** 0.5 .. 1.5 */
  intensity: number;
  /** 0 .. 1 (1 = fully opaque) */
  opacity: number;
  startWithComputer: boolean;
  alwaysVisible: boolean;
  powerSaving: boolean;
}

export const DEFAULT_SETTINGS: OrbSettings = {
  size: 1,
  intensity: 1,
  opacity: 1,
  startWithComputer: true,
  alwaysVisible: true,
  powerSaving: false,
};

const KEY = "neural-sphere.settings.v1";

function read(): OrbSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<OrbSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useOrbSettings() {
  const [settings, setSettings] = useState<OrbSettings>(DEFAULT_SETTINGS);

  useEffect(() => setSettings(read()), []);

  const update = useCallback((patch: Partial<OrbSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { settings, update };
}
