import { useEffect, useMemo, useState } from "react";

import { SITE, connectorDownloadUrl } from "@/config/site";
import { AI_OPTIONS, aiOption, connectorManager, type AiId } from "@/lib/neural/connectors";

/**
 * First launch only. Three taps at most: pick your AI, connect, done.
 * No port, no key, no file to edit — and it disappears for good afterwards.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"pick" | "connect">("pick");
  const [choice, setChoice] = useState<AiId | null>(null);
  const [live, setLive] = useState(false);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    const off = connectorManager.subscribe((s) => setDetected(s.live));
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    if (!choice || step !== "connect") return;
    const id = window.setInterval(() => setLive(connectorManager.isLive(choice)), 600);
    return () => window.clearInterval(id);
  }, [choice, step]);

  const option = useMemo(() => (choice ? aiOption(choice) : null), [choice]);
  const needsCompanion = option?.channel === "browser";

  const start = async (id: AiId) => {
    setChoice(id);
    await connectorManager.connect(id);
    setStep("connect");
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#01030a]/80 backdrop-blur-md">
      <div className="w-[min(560px,92vw)] rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
        {step === "pick" ? (
          <>
            <h1 className="text-2xl font-light text-white/90">Quelle IA utilisez-vous ?</h1>
            <p className="mt-2 text-sm text-white/45">
              Choisissez-en une. Vous pourrez en ajouter d'autres plus tard.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AI_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => void start(o.id)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-5 transition hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs tracking-wider"
                    style={{ background: `${o.accent}22`, color: o.accent }}
                  >
                    {o.mark}
                  </span>
                  <span className="text-sm text-white/85">{o.label}</span>
                  <span className="text-[11px] text-white/35">{o.hint}</span>
                </button>
              ))}
            </div>
            {detected ? (
              <p className="mt-6 text-xs text-[#38d6f0]/80">Une activité IA est déjà détectée.</p>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-light text-white/90">
              {live ? `${option?.label} est connecté` : `Connexion de ${option?.label}`}
            </h1>
            {live ? (
              <p className="mt-2 text-sm text-white/45">
                Continuez à utiliser {option?.label} normalement : la sphère suit.
              </p>
            ) : needsCompanion ? (
              <>
                <p className="mt-2 text-sm text-white/45">
                  Une dernière étape, une seule fois : ajoutez le connecteur navigateur.
                </p>
                <a
                  href={connectorDownloadUrl}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#38d6f0]/40 bg-[#38d6f0]/10 px-6 py-3 text-sm text-white/90 transition hover:bg-[#38d6f0]/20"
                >
                  <span className="h-2 w-2 rounded-full bg-[#38d6f0]" />
                  Ajouter le connecteur navigateur
                </a>
                <p className="mt-4 text-xs text-white/35">
                  Besoin d'aide ? Tout est expliqué en trois images sur {SITE.domain}
                  {SITE.connectorPage}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/45">
                Lancez {option?.label} comme d'habitude : la connexion se fait toute seule.
              </p>
            )}

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="rounded-full px-4 py-2 text-xs text-white/40 transition hover:text-white/70"
              >
                Changer d'IA
              </button>
              <button
                type="button"
                onClick={onDone}
                className="rounded-full border border-white/15 bg-white/[0.06] px-6 py-2.5 text-sm text-white/85 transition hover:bg-white/[0.12]"
              >
                {live ? "Voir ma sphère" : "Terminer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
