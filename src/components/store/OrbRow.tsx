import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OrbStage } from "@/components/orbs/OrbStage";
import { ORB_PRICE, formatPrice } from "@/config/pricing";
import { ORBS } from "@/lib/orbs/catalog";
import type { Orb, OrbId } from "@/lib/orbs/types";

/**
 * A clean table-like grid of orbs: 2 on very small screens, 3 on tablets,
 * 4 on desktop. Every orb is the real animated 3D object. Hovering wakes it
 * up and scales it; clicking opens it full size.
 */
export function OrbRow({
  ownedIds,
  activeOrb,
  pending,
  onUse,
  onBuy,
}: {
  ownedIds: Set<OrbId>;
  activeOrb: OrbId;
  pending: OrbId | "subscription" | null;
  onUse: (orb: Orb) => void;
  onBuy: (orb: Orb) => void;
}) {
  const [enlarged, setEnlarged] = useState<Orb | null>(null);
  const [hovered, setHovered] = useState<OrbId | null>(null);
  const [visible, setVisible] = useState<Set<OrbId>>(new Set());
  const [bigSize, setBigSize] = useState(0);

  // the enlarged orb gets a fixed pixel square, measured before it mounts
  useEffect(() => {
    if (!enlarged) {
      setBigSize(0);
      return;
    }
    const measure = () =>
      setBigSize(Math.round(Math.min(window.innerHeight * 0.7, window.innerWidth * 0.7)));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enlarged]);

  const register = useCallback((id: OrbId, el: HTMLElement | null) => {
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible((prev) => {
          const next = new Set(prev);
          if (entry?.isIntersecting) next.add(id);
          else next.delete(id);
          return next;
        }),
      { root: null, rootMargin: "100px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = useMemo(
    () =>
      ORBS.map((orb) => ({
        orb,
        owned: orb.included || ownedIds.has(orb.id),
      })),
    [ownedIds],
  );

  useEffect(() => {
    if (!enlarged) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEnlarged(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarged]);

  return (
    <>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 px-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
        {items.map(({ orb, owned }) => (
          <OrbGridItem
            key={orb.id}
            orb={orb}
            owned={owned}
            active={activeOrb === orb.id}
            busy={pending === orb.id}
            live={visible.has(orb.id) && !enlarged}
            hot={hovered === orb.id}
            onHover={(on) => setHovered(on ? orb.id : null)}
            register={register}
            onOpen={() => setEnlarged(orb)}
            onUse={() => onUse(orb)}
            onBuy={() => onBuy(orb)}
          />
        ))}
      </div>

      {enlarged ? (
        <div
          className="fixed inset-0 z-50 grid grid-rows-[auto_1fr_auto] bg-[#050a14]/95 backdrop-blur-sm"
          onClick={() => setEnlarged(null)}
        >
          <div className="flex items-start justify-between px-6 py-5">
            <div>
              <p className="text-sm tracking-wide text-[#eaf2ff]">{enlarged.name}</p>
              <p className="text-[11px] text-[#8ba4c4]">{enlarged.behaviour}</p>
            </div>
            <button
              type="button"
              onClick={() => setEnlarged(null)}
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] tracking-wide text-[#b3c6de] transition-colors hover:border-white/40 hover:text-white"
            >
              Close
            </button>
          </div>
          <div
            className="flex min-h-0 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {bigSize > 0 ? (
              <div className="relative" style={{ width: bigSize, height: bigSize }}>
                <OrbStage
                  key={`${enlarged.id}-${bigSize}`}
                  orbId={enlarged.id}
                  mode="preview"
                  detail={1}
                  bloom={0.22}
                />
              </div>
            ) : null}
          </div>
          <div
            className="flex items-center justify-center gap-3 px-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {enlarged.included || ownedIds.has(enlarged.id) ? (
              <button
                type="button"
                onClick={() => {
                  onUse(enlarged);
                  setEnlarged(null);
                }}
                disabled={activeOrb === enlarged.id}
                className="rounded-full border border-[#7ceaff]/40 px-6 py-3 text-[12px] tracking-wide text-[#dcebff] transition-colors hover:border-[#7ceaff] disabled:opacity-40"
              >
                {activeOrb === enlarged.id ? "In use" : "Use now"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onBuy(enlarged)}
                disabled={pending === enlarged.id}
                className="rounded-full border border-[#a793ff]/50 px-6 py-3 text-[12px] tracking-wide text-[#e6dcff] transition-colors hover:border-[#a793ff] disabled:opacity-40"
              >
                {pending === enlarged.id ? "Opening…" : `Buy ${formatPrice(ORB_PRICE)}`}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function OrbGridItem({
  orb,
  owned,
  active,
  busy,
  live,
  hot,
  onHover,
  register,
  onOpen,
  onUse,
  onBuy,
}: {
  orb: Orb;
  owned: boolean;
  active: boolean;
  busy: boolean;
  live: boolean;
  hot: boolean;
  onHover: (on: boolean) => void;
  register: (id: OrbId, el: HTMLElement | null) => void;
  onOpen: () => void;
  onUse: () => void;
  onBuy: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => register(orb.id, ref.current), [orb.id, register]);

  return (
    <div ref={ref} className="orb-float flex flex-col items-center">
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        aria-label={`Enlarge ${orb.name}`}
        className={`relative block aspect-square w-full max-w-[220px] cursor-zoom-in rounded-full outline-none transition-transform duration-500 ease-out sm:max-w-[248px] lg:max-w-[260px] ${
          hot ? "scale-[1.10]" : "scale-100"
        }`}
      >
        <span
          className="absolute inset-0 rounded-full transition-opacity duration-500"
          style={{
            opacity: hot ? 1 : 0.55,
            background:
              "radial-gradient(circle at 50% 42%, rgba(120,200,255,0.16) 0%, rgba(10,18,34,0.0) 62%)",
          }}
        />
        {live ? (
          <OrbStage
            orbId={orb.id}
            mode="preview"
            detail={0.55}
            interactive={false}
            energy={hot ? 1 : 0}
            bloom={hot ? 0.34 : 0.12}
          />
        ) : null}
        {active ? (
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-white/12 px-3 py-1 text-[10px] tracking-[0.2em] text-white">
            IN USE
          </span>
        ) : null}
      </button>

      <div className="mt-3 text-center">
        <p className="text-[13px] tracking-wide text-[#eaf2ff]">{orb.name}</p>
        {orb.included || owned ? (
          <p className="mt-1 text-[11px] text-[#93aac8]">{orb.included ? "Included" : "Owned"}</p>
        ) : null}
        <div className="mt-3 flex justify-center">
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
              disabled={busy}
              className="rounded-full border border-[#a793ff]/45 px-4 py-2 text-[11px] tracking-wide text-[#e6dcff] transition-colors hover:border-[#a793ff] disabled:opacity-40"
            >
              {busy ? "Opening…" : `Buy ${formatPrice(ORB_PRICE)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
