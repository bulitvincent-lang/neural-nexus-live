import { useCallback, useEffect, useState } from "react";

import {
  grantOrb,
  readLibrary,
  reconcile,
  startTrial,
  writeLibrary,
} from "@/lib/orbs/library";
import type { OrbId, OrbLibrary } from "@/lib/orbs/types";

export function useOrbLibrary({ beginTrial = false }: { beginTrial?: boolean } = {}) {
  const [library, setLibrary] = useState<OrbLibrary | null>(null);

  useEffect(() => {
    let lib = reconcile(readLibrary());
    if (beginTrial) lib = startTrial(lib);
    writeLibrary(lib);
    setLibrary(lib);
  }, [beginTrial]);

  const apply = useCallback((next: OrbLibrary) => {
    setLibrary(writeLibrary(next));
  }, []);

  const setActiveOrb = useCallback(
    (orbId: OrbId) => {
      setLibrary((prev) => (prev ? writeLibrary({ ...prev, active_orb: orbId }) : prev));
    },
    [],
  );

  /** Only real billing calls this; the UI never grants an orb for free. */
  const grant = useCallback((orbId: OrbId, paymentIntentId: string | null = null) => {
    setLibrary((prev) => (prev ? writeLibrary(grantOrb(prev, orbId, paymentIntentId)) : prev));
  }, []);

  return { library, apply, setActiveOrb, grant };
}
