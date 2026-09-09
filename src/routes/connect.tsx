import { Link, createFileRoute } from "@tanstack/react-router";

import { SITE, connectorDownloadUrl } from "@/config/site";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/connect")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Connect your AI to ${SITE.name} — 3 steps` },
      {
        name: "description",
        content:
          "Add the Neural Orb browser companion in three simple steps and watch your sphere react to ChatGPT, Claude, Gemini or Copilot.",
      },
      { property: "og:title", content: `Connect your AI to ${SITE.name}` },
      {
        property: "og:description",
        content: "Three steps, no technical setup, no personal data sent.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConnectorGuide,
});

function ConnectorGuide() {
  const { t } = useI18n();
  const steps = [
    { title: t("connect.s1.t"), body: t("connect.s1.b") },
    { title: t("connect.s2.t"), body: t("connect.s2.b") },
    { title: t("connect.s3.t"), body: t("connect.s3.b") },
  ];

  return (
    <main
      className="min-h-screen px-6 py-14 text-[#c9d8ee]"
      style={{
        background:
          "linear-gradient(180deg, #22304f 0%, #1a2540 40%, #141d33 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">
            {SITE.name}
          </Link>
        </div>

        <h1 className="text-3xl font-light text-white/90">{t("connect.title")}</h1>
        <p className="mt-3 text-[#a9bdd8]">{t("connect.intro")}</p>

        {SITE.releaseReady ? (
          <a
            href={connectorDownloadUrl}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#7ceaff]/40 bg-[#7ceaff]/10 px-6 py-3 text-sm text-white/90 transition hover:bg-[#7ceaff]/20"
          >
            <span className="h-2 w-2 rounded-full bg-[#7ceaff]" />
            {t("connect.download")}
          </a>
        ) : (
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm text-[#a9bdd8]">
            <span className="h-2 w-2 rounded-full bg-white/40" />
            {t("connect.pending")}
          </p>
        )}

        <ol className="mt-12 space-y-6">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-sm text-white/75">
                {i + 1}
              </span>
              <span>
                <span className="block text-white/90">{s.title}</span>
                <span className="mt-1 block text-sm text-[#a1b5d0]">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-white/85">{t("connect.privacy.t")}</h2>
          <p className="mt-2 text-sm text-[#a1b5d0]">{t("connect.privacy.b")}</p>
        </section>
      </div>
    </main>
  );
}
