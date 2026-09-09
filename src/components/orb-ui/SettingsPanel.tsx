import { useEffect, useState } from "react";

import { connectorDownloadUrl } from "@/config/site";
import type { OrbSettings } from "@/hooks/useOrbSettings";
import { AI_OPTIONS, connectorManager, type AiId } from "@/lib/neural/connectors";

/**
 * Everyday settings, grand public only: my AIs, appearance, application.
 * Never a port, an address, a key or a file path.
 */
export function SettingsPanel({
  settings,
  update,
  onClose,
}: {
  settings: OrbSettings;
  update: (patch: Partial<OrbSettings>) => void;
  onClose: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => connectorManager.subscribe(() => setTick((t) => t + 1)), []);

  const label = (ai: AiId) =>
    connectorManager.isLive(ai) ? "Connecté" : connectorManager.isConnected(ai) ? "En veille" : "Connecter";

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#01030a]/75 backdrop-blur-md">
      <div className="max-h-[88vh] w-[min(520px,92vw)] overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl">
        <Section title="Mes IA">
          <div className="divide-y divide-white/5">
            {AI_OPTIONS.filter((o) => o.id !== "other").map((o) => {
              const connected = connectorManager.isConnected(o.id);
              return (
                <div key={o.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] tracking-wider"
                      style={{ background: `${o.accent}22`, color: o.accent }}
                    >
                      {o.mark}
                    </span>
                    <span className="text-sm text-white/85">{o.label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      connected ? connectorManager.disconnect(o.id) : void connectorManager.connect(o.id)
                    }
                    className={`rounded-full px-4 py-1.5 text-xs transition ${
                      connected
                        ? "text-[#38d6f0]/90 hover:text-white/70"
                        : "border border-white/15 bg-white/[0.05] text-white/80 hover:bg-white/[0.12]"
                    }`}
                  >
                    {label(o.id)}
                  </button>
                </div>
              );
            })}
          </div>
          <a
            href={connectorDownloadUrl}
            className="mt-3 inline-block text-xs text-white/40 underline-offset-4 transition hover:text-white/70 hover:underline"
          >
            Ajouter le connecteur navigateur
          </a>
        </Section>

        <Section title="Apparence">
          <Slider
            label="Taille"
            value={settings.size}
            min={0.6}
            max={1.4}
            onChange={(size) => update({ size })}
          />
          <Slider
            label="Intensité"
            value={settings.intensity}
            min={0.5}
            max={1.5}
            onChange={(intensity) => update({ intensity })}
          />
          <Slider
            label="Transparence"
            value={1 - settings.opacity}
            min={0}
            max={0.7}
            onChange={(v) => update({ opacity: 1 - v })}
          />
        </Section>

        <Section title="Application">
          <Toggle
            label="Démarrer avec l'ordinateur"
            value={settings.startWithComputer}
            onChange={(startWithComputer) => update({ startWithComputer })}
          />
          <Toggle
            label="Toujours visible"
            value={settings.alwaysVisible}
            onChange={(alwaysVisible) => update({ alwaysVisible })}
          />
          <Toggle
            label="Mode économie d'énergie"
            value={settings.powerSaving}
            onChange={(powerSaving) => update({ powerSaving })}
          />
        </Section>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full border border-white/15 bg-white/[0.06] py-2.5 text-sm text-white/85 transition hover:bg-white/[0.12]"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/35">{title}</h2>
      {children}
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-4 flex items-center gap-4 text-sm text-white/70">
      <span className="w-28 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.02}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full appearance-none rounded-full bg-white/15 accent-[#38d6f0]"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="mb-2 flex w-full items-center justify-between rounded-xl px-1 py-2 text-sm text-white/75 transition hover:text-white"
    >
      <span>{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${value ? "bg-[#38d6f0]/70" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            value ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
