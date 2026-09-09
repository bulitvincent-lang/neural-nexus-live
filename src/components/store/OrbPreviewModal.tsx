import { useEffect, useState } from "react";

import { OrbStage } from "@/components/orbs/OrbStage";
import { PREVIEW_DURATION_MS } from "@/lib/orbs/previewScript";
import type { Orb } from "@/lib/orbs/types";

/** Free 26-second demonstration: the orb behaves exactly as it would live. */
export function OrbPreviewModal({ orb, onClose }: { orb: Orb; onClose: () => void }) {
  const [left, setLeft] = useState(Math.round(PREVIEW_DURATION_MS / 1000));
  const [run, setRun] = useState(0);

  useEffect(() => {
    setLeft(Math.round(PREVIEW_DURATION_MS / 1000));
    const id = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(id);
  }, [run]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const finished = left === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#080d18]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm tracking-wide text-[#eaf2ff]">{orb.name}</p>
          <p className="text-[11px] text-[#8ba4c4]">{orb.behaviour}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/15 px-4 py-2 text-[11px] tracking-wide text-[#b3c6de] transition-colors hover:border-white/40 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="relative flex-1">
        {finished ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-[#b3c6de]">Preview finished.</p>
            <button
              type="button"
              onClick={() => setRun((v) => v + 1)}
              className="rounded-full border border-[#7ceaff]/40 px-6 py-3 text-[12px] tracking-wide text-[#dcebff] transition-colors hover:border-[#7ceaff]"
            >
              Play again
            </button>
          </div>
        ) : (
          <OrbStage key={`${orb.id}-${run}`} orbId={orb.id} mode="preview" />
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#7ceaff] to-[#a793ff] transition-[width] duration-1000 ease-linear"
            style={{ width: `${(left / (PREVIEW_DURATION_MS / 1000)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
