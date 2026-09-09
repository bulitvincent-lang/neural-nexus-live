import { useEffect, useState } from "react";

import { NeuralCanvas } from "@/components/neural/NeuralCanvas";
import { Onboarding } from "@/components/orb-ui/Onboarding";
import { SettingsPanel } from "@/components/orb-ui/SettingsPanel";
import { useOrbSettings } from "@/hooks/useOrbSettings";
import { connectorManager } from "@/lib/neural/connectors";

const SEEN_KEY = "neural-sphere.onboarded.v1";

export function OrbApp() {
  const { settings, update } = useOrbSettings();
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
        <NeuralCanvas managed powerSaving={settings.powerSaving} />
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
