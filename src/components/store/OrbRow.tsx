import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { OrbStage } from "@/components/orbs/OrbStage";
import { ORB_PRICE, formatPrice } from "@/config/pricing";
import { ORBS } from "@/lib/orbs/catalog";
import type { Orb, OrbId } from "@/lib/orbs/types";

/**
 * One single line of floating orbs that drifts on its own. Every orb is the
 * real animated 3D object — no thumbnails, no preview button. Hovering an orb
 * makes it grow and come alive; clicking it opens it full size.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [enlarged, setEnlarged] = useState<Orb | null>(null);
  const [hovered, setHovered] = useState<OrbId | null>(null);
  const [visible, setVisible] = useState<Set<OrbId>>(new Set(["neural", "galaxy", "liquid"]));

  // gentle drift, ping-ponging at both ends. Manual scroll always wins.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let dir = 1;
    let raf = 0;
    let last = performance.now();
    let pos = track.scrollLeft;
    const step = (now: number) => {
      const dt = Math.min(now - last, 40);
      last = now;
      if (!paused && !enlarged) {
        const max = track.scrollWidth - track.clientWidth;
        if (max > 4) {
          // resync if the user scrolled by hand
          if (Math.abs(track.scrollLeft - pos) > 2) pos = track.scrollLeft;
          pos += dir * dt * 0.055;
          if (pos >= max) {
            pos = max;
            dir = -1;
          } else if (pos <= 0) {
            pos = 0;
            dir = 1;
          }
          track.scrollLeft = pos;
        }
      } else {
        pos = track.scrollLeft;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, enlarged]);

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
      { root: trackRef.current, rootMargin: "300px" },
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
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setHovered(null);
        }}
        onTouchStart={() => setPaused(true)}
        className="orb-row flex gap-8 overflow-x-auto px-10 pb-10 pt-8"
      >
        {items.map(({ orb, owned }) => (
          <OrbRowItem
            key={orb.id}
            orb={orb}
            owned={owned}
            active={activeOrb === orb.id}
            busy={pending === orb.id}
            live={visible.has(orb.id)}
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
            <div
              className="relative"
              style={{ width: "min(74vh, 74vw)", height: "min(74vh, 74vw)" }}
            >
              <OrbStage key={enlarged.id} orbId={enlarged.id} mode="preview" detail={1} bloom={0.22} />
            </div>
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

function OrbRowItem({
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
    <div ref={ref} className="orb-float w-[248px] shrink-0 sm:w-[268px]">
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onFocus={() => onHover(true)}
        onBlur={() => onHover(false)}
        aria-label={`Enlarge ${orb.name}`}
        className={`relative block h-[248px] w-full cursor-zoom-in rounded-full outline-none transition-transform duration-500 ease-out sm:h-[268px] ${
          hot ? "scale-[1.16]" : "scale-100"
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
            detail={0.6}
            interactive={false}
            bloom={hot ? 0.3 : 0.14}
          />
        ) : null}
        {active ? (
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-white/12 px-3 py-1 text-[10px] tracking-[0.2em] text-white">
            IN USE
          </span>
        ) : null}
      </button>

      <div className="mt-1 text-center">
        <p className="text-[13px] tracking-wide text-[#eaf2ff]">{orb.name}</p>
        <p className="mt-1 text-[11px] text-[#93aac8]">
          {orb.included ? "Included" : owned ? "Owned" : `${formatPrice(ORB_PRICE)} · one-time`}
        </p>
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
