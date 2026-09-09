import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const ITEMS: { to: string; label: string; hint: string }[] = [
  { to: "/store", label: "Orb Store", hint: "Browse and buy new spheres" },
  { to: "/orb", label: "Live sphere", hint: "See it running in your browser" },
  { to: "/connect", label: "Connect your AI", hint: "Link your assistants" },
  { to: "/privacy", label: "Privacy", hint: "What we never read" },
  { to: "/auth", label: "Sign in", hint: "Restore your orbs" },
];

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[#c3d6f2] transition-colors hover:border-white/20 hover:bg-white/[0.08]"
      >
        Menu
        <span
          className={`inline-block text-[9px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#151e35]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 transition-colors hover:bg-white/[0.06]"
            >
              <span className="block text-sm text-[#eaf2ff]">{item.label}</span>
              <span className="block text-[11px] text-[#8ea8cd]">{item.hint}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
