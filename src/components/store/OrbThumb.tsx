import { useMemo } from "react";

import type { Orb, OrbId } from "@/lib/orbs/types";

/**
 * Signature artwork for each orb: pure SVG + CSS, so a full grid stays cheap
 * while still reading as a distinct object even without colour.
 */
export function OrbThumb({ orb, className = "" }: { orb: Orb; className?: string }) {
  const [a, b] = orb.thumb;
  const uid = `orb-${orb.id}`;

  return (
    <div
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 100% at 50% 118%, ${a}22 0%, transparent 62%), radial-gradient(80% 70% at 50% 12%, ${b}1f 0%, transparent 70%), #0b1120`,
      }}
    >
      {/* soft bloom behind the shape */}
      <div
        className="orb-breathe pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${a}66 0%, ${b}33 45%, transparent 72%)` }}
      />
      <svg
        viewBox="0 0 200 200"
        className="relative h-full w-full"
        role="img"
        aria-label={`${orb.name} orb`}
      >
        <defs>
          <radialGradient id={`${uid}-core`} cx="42%" cy="36%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={a} stopOpacity="0.9" />
            <stop offset="100%" stopColor={b} stopOpacity="0.15" />
          </radialGradient>
          <linearGradient id={`${uid}-line`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={a} />
            <stop offset="100%" stopColor={b} />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id={`${uid}-clip`}>
            <circle cx="100" cy="100" r="66" />
          </clipPath>
        </defs>

        <g filter={`url(#${uid}-glow)`}>
          <Art id={orb.id} uid={uid} a={a} b={b} />
        </g>

        {/* shared glassy sphere finish keeps the family coherent */}
        <circle cx="100" cy="100" r="66" fill="none" stroke={`${a}44`} strokeWidth="0.8" />
        <ellipse cx="80" cy="72" rx="26" ry="16" fill="#ffffff" opacity="0.07" />
      </svg>
    </div>
  );
}

function Art({ id, uid, a, b }: { id: OrbId; uid: string; a: string; b: string }) {
  const rnd = useMemo(() => seeded(id.length * 97), [id]);

  switch (id) {
    case "neural": {
      const nodes = Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2 + rnd() * 0.4;
        const r = 20 + rnd() * 42;
        return { x: 100 + Math.cos(ang) * r, y: 100 + Math.sin(ang) * r * 0.95 };
      });
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          {nodes.map((n, i) =>
            nodes.slice(i + 1, i + 4).map((m, j) => (
              <line
                key={`${i}-${j}`}
                x1={n.x}
                y1={n.y}
                x2={m.x}
                y2={m.y}
                stroke={`url(#${uid}-line)`}
                strokeWidth="0.7"
                opacity="0.5"
              />
            )),
          )}
          {nodes.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={i % 4 === 0 ? 3.2 : 1.8}
              fill={i % 3 === 0 ? "#ffffff" : a}
              className="orb-pulse"
              style={{ animationDelay: `${(i % 6) * 0.32}s` }}
            />
          ))}
          <circle cx="100" cy="100" r="11" fill={`url(#${uid}-core)`} />
        </g>
      );
    }

    case "galaxy": {
      const arms = [0, 1, 2];
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          <g className="orb-spin-slow" style={{ transformOrigin: "100px 100px" }}>
            {arms.map((arm) =>
              Array.from({ length: 34 }, (_, i) => {
                const t = i / 34;
                const ang = t * 3.1 + (arm * Math.PI * 2) / 3;
                const r = 8 + t * 62;
                return (
                  <circle
                    key={`${arm}-${i}`}
                    cx={100 + Math.cos(ang) * r}
                    cy={100 + Math.sin(ang) * r * 0.42}
                    r={2.4 - t * 1.6}
                    fill={i % 5 === 0 ? "#ffffff" : t > 0.5 ? b : a}
                    opacity={0.9 - t * 0.45}
                  />
                );
              }),
            )}
          </g>
          <ellipse cx="100" cy="100" rx="46" ry="19" fill={`${b}22`} />
          <circle cx="100" cy="100" r="13" fill={`url(#${uid}-core)`} className="orb-breathe" />
        </g>
      );
    }

    case "liquid":
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="100" cy="100" r="64" fill={`${b}30`} />
          <circle cx="100" cy="100" r="64" fill={`url(#${uid}-core)`} opacity="0.55" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={wave(120 - i * 6, 9 - i, 62 + i * 16)}
              fill="none"
              stroke={i % 2 ? b : a}
              strokeWidth={1.5 - i * 0.15}
              opacity={0.7 - i * 0.1}
              className="orb-drift"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <ellipse
              key={`v${i}`}
              cx={100 + (i - 1) * 20}
              cy={96 + i * 10}
              rx={16 - i * 3}
              ry={9 - i * 2}
              fill="none"
              stroke="#ffffff"
              strokeOpacity={0.3 - i * 0.07}
              strokeWidth="1"
              transform={`rotate(${-25 + i * 22} ${100 + (i - 1) * 20} ${96 + i * 10})`}
              className="orb-drift"
              style={{ animationDelay: `${i * 1.1}s` }}
            />
          ))}
          <ellipse cx="84" cy="78" rx="14" ry="9" fill="#ffffff" opacity="0.28" />
        </g>
      );

    case "synapse": {
      const branches: string[] = [];
      const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
        if (depth === 0 || len < 5) return;
        const nx = x + Math.cos(ang) * len;
        const ny = y + Math.sin(ang) * len;
        branches.push(`M${x} ${y} Q${x + Math.cos(ang + 0.5) * len * 0.6} ${y + Math.sin(ang + 0.5) * len * 0.6} ${nx} ${ny}`);
        grow(nx, ny, ang - 0.55 - rnd() * 0.2, len * 0.68, depth - 1);
        grow(nx, ny, ang + 0.55 + rnd() * 0.2, len * 0.68, depth - 1);
      };
      for (let i = 0; i < 5; i++) grow(100, 100, (i / 5) * Math.PI * 2, 26, 4);
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          {branches.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i % 3 === 0 ? a : b}
              strokeWidth={Math.max(0.6, 2 - i * 0.03)}
              strokeLinecap="round"
              opacity="0.8"
            />
          ))}
          {branches.slice(0, 10).map((d, i) => (
            <circle key={`t${i}`} r="2" fill="#ffffff" className="orb-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
              <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite" path={d} />
            </circle>
          ))}
          <circle cx="100" cy="100" r="9" fill={`url(#${uid}-core)`} />
        </g>
      );
    }

    case "singularity":
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          <ellipse
            cx="100"
            cy="100"
            rx="62"
            ry="17"
            fill="none"
            stroke={`url(#${uid}-line)`}
            strokeWidth="7"
            opacity="0.85"
          />
          <ellipse cx="100" cy="100" rx="62" ry="17" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.5" />
          <path d="M38 100 A62 62 0 0 1 162 100" fill="none" stroke={a} strokeWidth="4" opacity="0.55" />
          <circle cx="100" cy="100" r="26" fill="#02040a" />
          <circle cx="100" cy="100" r="27" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.55" className="orb-pulse" />
          <g className="orb-spin-slow" style={{ transformOrigin: "100px 100px" }}>
            {Array.from({ length: 22 }, (_, i) => {
              const ang = (i / 22) * Math.PI * 2;
              const r = 34 + (i % 4) * 8;
              return (
                <circle
                  key={i}
                  cx={100 + Math.cos(ang) * r}
                  cy={100 + Math.sin(ang) * r * 0.3}
                  r="1.4"
                  fill={i % 3 ? b : "#ffffff"}
                  opacity="0.8"
                />
              );
            })}
          </g>
        </g>
      );

    case "crystal": {
      const facets = Array.from({ length: 11 }, (_, i) => {
        const ang = (i / 11) * Math.PI * 2;
        const r1 = 30 + rnd() * 28;
        const r2 = 30 + rnd() * 28;
        const a2 = ang + Math.PI / 11;
        return `M100 100 L${100 + Math.cos(ang) * r1} ${100 + Math.sin(ang) * r1} L${100 + Math.cos(a2) * r2} ${100 + Math.sin(a2) * r2}Z`;
      });
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          {facets.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={i % 2 ? `${a}66` : `${b}7a`}
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="0.7"
              className="orb-facet"
              style={{ animationDelay: `${i * 0.28}s` }}
            />
          ))}
          <path d="M100 44 L128 100 L100 156 L72 100Z" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1" />
          <circle cx="100" cy="100" r="8" fill="#ffffff" opacity="0.85" className="orb-pulse" />
        </g>
      );
    }

    case "plasma": {
      const arcs = Array.from({ length: 9 }, (_, i) => {
        const ang = (i / 9) * Math.PI * 2;
        const pts = Array.from({ length: 6 }, (_, k) => {
          const r = 12 + (k / 5) * 54;
          const jitter = (rnd() - 0.5) * 0.5;
          return `${100 + Math.cos(ang + jitter) * r} ${100 + Math.sin(ang + jitter) * r}`;
        });
        return `M${pts.join(" L")}`;
      });
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          <circle cx="100" cy="100" r="60" fill={`${b}1c`} />
          {arcs.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i % 2 ? a : b}
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.85"
              className="orb-flicker"
              style={{ animationDelay: `${i * 0.17}s` }}
            />
          ))}
          <circle cx="100" cy="100" r="15" fill={`url(#${uid}-core)`} className="orb-pulse" />
        </g>
      );
    }

    case "aurora":
      return (
        <g clipPath={`url(#${uid}-clip)`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M${34 + i * 4} 150 C${60 + i * 6} ${110 - i * 12}, ${120 - i * 6} ${132 - i * 14}, ${160 - i * 4} ${52 + i * 10}`}
              fill="none"
              stroke={i % 2 ? a : b}
              strokeWidth={10 - i}
              strokeLinecap="round"
              opacity={0.34 - i * 0.04}
              className="orb-drift"
              style={{ animationDelay: `${i * 0.7}s` }}
            />
          ))}
          <ellipse cx="100" cy="118" rx="50" ry="26" fill={`${a}1f`} className="orb-breathe" />
          <circle cx="100" cy="100" r="7" fill="#ffffff" opacity="0.7" />
        </g>
      );
  }
}

function wave(width: number, amp: number, y = 100) {
  const x0 = 100 - width / 2;
  return `M${x0} ${y} Q${x0 + width * 0.25} ${y - amp} ${x0 + width * 0.5} ${y} T${x0 + width} ${y}`;
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}
