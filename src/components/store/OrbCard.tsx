import { ORB_PRICE, PAYMENTS_ENABLED, formatPrice } from "@/config/pricing";
import type { Orb, OrbState } from "@/lib/orbs/types";

/**
 * Lightweight card: the thumbnail is pure CSS, so eight cards cost nothing.
 * The real 3D orb only loads when previewed or selected.
 */
export function OrbCard({
  orb,
  state,
  active,
  onPreview,
  onUse,
  onBuy,
}: {
  orb: Orb;
  state: OrbState;
  active: boolean;
  onPreview: () => void;
  onUse: () => void;
  onBuy: () => void;
}) {
  const owned = state !== "available";
  const [a, b] = orb.thumb;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#182238]/85">
      <div
        className="relative h-40 w-full"
        style={{
          background: `radial-gradient(circle at 50% 55%, ${a}55 0%, ${b}33 42%, rgba(6,10,20,0.95) 78%)`,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
          style={{
            background: `radial-gradient(circle at 42% 38%, ${a} 0%, ${b} 55%, transparent 72%)`,
            opacity: 0.85,
          }}
        />
        {active ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-[10px] tracking-[0.2em] text-white">
            IN USE
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-base tracking-tight text-[#eaf2ff]">{orb.name}</h3>
          <span className="text-[12px] text-[#9db9de]">
            {state === "included"
              ? "Included"
              : state === "owned"
                ? "Owned"
                : `${formatPrice(ORB_PRICE)} · one-time`}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[#a9bdd8]">{orb.summary}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#7f96b6]">{orb.behaviour}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="rounded-full border border-white/15 px-4 py-2 text-[11px] tracking-wide text-[#cfe0f5] transition-colors hover:border-white/40 hover:text-white"
          >
            Preview
          </button>
          {owned ? (
            <button
              type="button"
              onClick={onUse}
              disabled={active}
              className="rounded-full border border-[#7ceaff]/40 px-4 py-2 text-[11px] tracking-wide text-[#dcebff] transition-colors hover:border-[#7ceaff] disabled:opacity-40"
            >
              {active ? "In use" : "Use"}
            </button>
          ) : (
            <button
              type="button"
              onClick={onBuy}
              className="rounded-full border border-[#a793ff]/40 px-4 py-2 text-[11px] tracking-wide text-[#e6dcff] transition-colors hover:border-[#a793ff]"
            >
              {PAYMENTS_ENABLED ? `Buy ${formatPrice(ORB_PRICE)}` : "Notify me"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
