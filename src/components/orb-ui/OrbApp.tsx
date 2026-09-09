import { useEffect, useState } from "react";

import { Onboarding } from "@/components/orb-ui/Onboarding";
import { SettingsPanel } from "@/components/orb-ui/SettingsPanel";
import { OrbStage } from "@/components/orbs/OrbStage";
import { useOrbLibrary } from "@/hooks/useOrbLibrary";
import { useOrbSettings } from "@/hooks/useOrbSettings";
import { connectorManager } from "@/lib/neural/connectors";
import { DEFAULT_ORB } from "@/lib/orbs/catalog";

const SEEN_KEY = "neural-sphere.onboarded.v1";

export function OrbApp() {
  const { settings, update } = useOrbSettings();
  // the free trial starts silently on first launch — nothing is ever displayed
  const { library } = useOrbLibrary({ beginTrial: true });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => connectorManager.start(), []);

  useEffect(() => {
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen && !connectorManager.hasAnyLink()) setShowOnboarding(true);
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setShowOnboarding(false);
  };

  return (
    <main
      data-tauri-drag-region
      className="fixed inset-0 select-none overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 50% 46%, rgba(30,56,104,0.26) 0%, rgba(5,9,20,0.96) 38%, #01030a 100%)",
      }}
      onDoubleClick={() => !showOnboarding && setShowSettings((v) => !v)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!showOnboarding) setShowSettings((v) => !v);
      }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          transform: `scale(${settings.size})`,
          opacity: settings.opacity * (0.55 + settings.intensity * 0.45),
        }}
      >
        <OrbStage
          orbId={library?.active_orb ?? DEFAULT_ORB}
          managed
          detail={settings.powerSaving ? 0.5 : 1}
        />
      </div>

      {showOnboarding ? <Onboarding onDone={finishOnboarding} /> : null}
      {showSettings ? (
        <SettingsPanel
          settings={settings}
          update={update}
          onClose={() => setShowSettings(false)}
        />
      ) : null}
    </main>
  );
}
