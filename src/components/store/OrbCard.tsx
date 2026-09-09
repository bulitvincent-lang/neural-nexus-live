import { useState } from "react";

import { OrbStage } from "@/components/orbs/OrbStage";
import { OrbThumb } from "@/components/store/OrbThumb";
import { ORB_PRICE, PAYMENTS_ENABLED, formatPrice } from "@/config/pricing";
import type { Orb, OrbState } from "@/lib/orbs/types";

/**
 * The CSS thumbnail is the resting poster; on hover the card loads the real
 * 3D orb, so the card and the preview always show the same thing.
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
  const [live, setLive] = useState(false);
  return (
    <article
      onMouseEnter={() => setLive(true)}
      onMouseLeave={() => setLive(false)}
      onFocus={() => setLive(true)}
      onTouchStart={() => setLive(true)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#182238]/85 transition-all duration-500 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <OrbThumb orb={orb} className="h-full w-full" />
        {live ? (
          <div className="absolute inset-0 animate-fade-in">
            <OrbStage orbId={orb.id} mode="preview" detail={0.6} interactive={false} />
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,transparent_40%,rgba(6,10,20,0.55)_100%)]" />
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
