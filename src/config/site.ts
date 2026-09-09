/**
 * Single place to configure the public site + download links.
 * Point RELEASE_BASE at the release host once the domain is live.
 */
export const SITE = {
  name: "Neural Orb",
  domain: "neuralorb.app",
  url: "https://neuralorb.app",
  tagline: "See your AI live and work.",
  /** GitHub releases (or any static host) that serves the packaged installers. */
  releaseBase: "https://github.com/neural-orb/neural-orb/releases/latest/download",
  releasesPage: "https://github.com/neural-orb/neural-orb/releases/latest",
  version: "0.1.0",
} as const;

export type PlatformId = "macos-arm" | "macos-intel" | "windows" | "linux";

export interface DownloadTarget {
  id: PlatformId;
  label: string;
  note: string;
  file: string;
}

/** File names produced by the Tauri release workflow. */
export const DOWNLOADS: DownloadTarget[] = [
  {
    id: "macos-arm",
    label: "macOS",
    note: "Apple Silicon · .dmg",
    file: `Neural.Orb_${SITE.version}_aarch64.dmg`,
  },
  {
    id: "macos-intel",
    label: "macOS",
    note: "Intel · .dmg",
    file: `Neural.Orb_${SITE.version}_x64.dmg`,
  },
  {
    id: "windows",
    label: "Windows",
    note: "64-bit · .msi",
    file: `Neural.Orb_${SITE.version}_x64_en-US.msi`,
  },
  {
    id: "linux",
    label: "Linux",
    note: "x86_64 · .AppImage",
    file: `Neural.Orb_${SITE.version}_amd64.AppImage`,
  },
];

export const downloadUrl = (t: DownloadTarget) => `${SITE.releaseBase}/${t.file}`;

/** Best guess of the visitor's platform, for the primary button. */
export function guessPlatform(ua: string): PlatformId {
  const s = ua.toLowerCase();
  if (s.includes("win")) return "windows";
  if (s.includes("mac")) return "macos-arm";
  if (s.includes("linux") || s.includes("x11")) return "linux";
  return "macos-arm";
}
