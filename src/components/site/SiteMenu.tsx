import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const ITEMS: { to: string; label: string; hint: string }[] = [
  { to: "/store", label: "Orb Store", hint: "Browse and buy new spheres" },
  { to: "/pricing", label: "Pricing", hint: "What it costs, explained" },
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
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:border-white/20 hover:bg-white/[0.08]"
      >
        <span
          aria-hidden
          className={`block h-px w-4 bg-[#c3d6f2] transition-transform duration-200 ${open ? "translate-y-[6px] rotate-45" : ""}`}
        />
        <span
          aria-hidden
          className={`block h-px w-4 bg-[#c3d6f2] transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        />
        <span
          aria-hidden
          className={`block h-px w-4 bg-[#c3d6f2] transition-transform duration-200 ${open ? "-translate-y-[6px] -rotate-45" : ""}`}
        />
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
