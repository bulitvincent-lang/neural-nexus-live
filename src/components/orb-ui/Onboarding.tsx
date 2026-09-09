import { useEffect, useMemo, useState } from "react";

import { SITE, connectorDownloadUrl } from "@/config/site";
import { useI18n } from "@/lib/i18n";
import { AI_OPTIONS, aiOption, connectorManager, type AiId } from "@/lib/neural/connectors";

/**
 * First launch only. Three taps at most: pick your AI, connect, done.
 * No port, no key, no file to edit — and it disappears for good afterwards.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
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
  const ai = option?.label ?? "";

  const start = async (id: AiId) => {
    setChoice(id);
    await connectorManager.connect(id);
    setStep("connect");
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 flex items-center justify-center bg-[#0a1223]/85 backdrop-blur-md">
      <div className="w-[min(560px,92vw)] rounded-3xl border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
        </div>
        {step === "pick" ? (
          <>
            <h1 className="text-2xl font-light text-white/90">{t("onb.q")}</h1>
            <p className="mt-2 text-sm text-white/50">{t("onb.qsub")}</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AI_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => void start(o.id)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-5 transition hover:border-white/25 hover:bg-white/[0.09]"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs tracking-wider"
                    style={{ background: `${o.accent}22`, color: o.accent }}
                  >
                    {o.mark}
                  </span>
                  <span className="text-sm text-white/85">{o.label}</span>
                  <span className="text-[11px] text-white/40">{o.hint}</span>
                </button>
              ))}
            </div>
            {detected ? (
              <p className="mt-6 text-xs text-[#7ceaff]/85">{t("onb.detected")}</p>
            ) : null}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-light text-white/90">
              {live ? t("onb.connected", { ai }) : t("onb.connecting", { ai })}
            </h1>
            {live ? (
              <p className="mt-2 text-sm text-white/50">{t("onb.keepUsing", { ai })}</p>
            ) : needsCompanion ? (
              <>
                <p className="mt-2 text-sm text-white/50">{t("onb.lastStep")}</p>
                <a
                  href={connectorDownloadUrl}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#7ceaff]/40 bg-[#7ceaff]/10 px-6 py-3 text-sm text-white/90 transition hover:bg-[#7ceaff]/20"
                >
                  <span className="h-2 w-2 rounded-full bg-[#7ceaff]" />
                  {t("onb.addCompanion")}
                </a>
                <p className="mt-4 text-xs text-white/40">
                  {t("onb.help")} {SITE.domain}
                  {SITE.connectorPage}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/50">{t("onb.launch", { ai })}</p>
            )}

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep("pick")}
                className="rounded-full px-4 py-2 text-xs text-white/45 transition hover:text-white/80"
              >
                {t("onb.change")}
              </button>
              <button
                type="button"
                onClick={onDone}
                className="rounded-full border border-white/15 bg-white/[0.08] px-6 py-2.5 text-sm text-white/85 transition hover:bg-white/[0.14]"
              >
                {live ? t("onb.see") : t("onb.finish")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
