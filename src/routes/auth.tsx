import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { SITE } from "@/config/site";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { next?: string | undefined } => ({
    next: typeof search["next"] === "string" ? (search["next"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — keep your orbs on every device | Neural Orb" },
      {
        name: "description",
        content:
          "Sign in to Neural Orb to keep your orbs, your subscription and your chosen visualisation on every computer you use.",
      },
      { property: "og:title", content: "Sign in to Neural Orb" },
      {
        property: "og:description",
        content: "Your orbs follow your account, on every device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/store";
}

function AuthPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const destination = safeNext(next);

  const withEmail = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: destination });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${destination}` },
        });
        if (error) throw error;
        setMessage("Check your inbox to confirm your address, then come back here.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const withGoogle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      sessionStorage.setItem("neural-orb.next", destination);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setMessage("Google sign-in did not complete. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: destination });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 text-[#eaf2ff]"
      style={{
        background: "linear-gradient(180deg, #22304f 0%, #1a2540 34%, #151e35 68%, #121a2c 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <p className="text-[11px] uppercase tracking-[0.42em] text-[#9db9de]">{SITE.name}</p>
        <h1 className="mt-6 text-2xl font-light tracking-tight">
          {mode === "in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-[#a9bdd8]">
          Your orbs and your subscription follow your account, on every computer you use.
        </p>

        <button
          type="button"
          onClick={withGoogle}
          disabled={busy}
          className="mt-7 w-full rounded-full border border-white/20 bg-white/[0.08] py-3 text-[13px] tracking-wide transition hover:bg-white/[0.14] disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-[11px] text-[#7f96b6]">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[13px] outline-none placeholder:text-[#7f96b6] focus:border-[#7ceaff]/50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          className="mt-3 w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[13px] outline-none placeholder:text-[#7f96b6] focus:border-[#7ceaff]/50"
        />
        <button
          type="button"
          onClick={withEmail}
          disabled={busy || !email || !password}
          className="mt-4 w-full rounded-full border border-[#7ceaff]/40 py-3 text-[13px] tracking-wide text-[#dcebff] transition hover:border-[#7ceaff] disabled:opacity-40"
        >
          {mode === "in" ? "Sign in" : "Create account"}
        </button>

        {message ? <p className="mt-4 text-[12px] text-[#ffd5d5]">{message}</p> : null}

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-6 text-[12px] text-[#9db9de] underline-offset-4 transition hover:text-white hover:underline"
        >
          {mode === "in" ? "I don't have an account yet" : "I already have an account"}
        </button>
      </div>
    </div>
  );
}
