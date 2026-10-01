"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/profile";
  const urlError = searchParams.get("error");

  const { signInWithGoogleIdToken, user } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errorMessage = formError ?? (urlError ? decodeURIComponent(urlError) : null);
  const setErrorMessage = (msg: string | null) => setFormError(msg);

  // If already logged in, show synced notice and button to profile
  if (user) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">You are signed in</h2>
        <p className="mt-2 text-xs text-sub max-w-sm">
          Connected as <span className="font-medium text-foreground">{user.email}</span>. Your progress and high scores are synced to the cloud.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/profile"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-background shadow-md hover:brightness-110 transition-all"
          >
            <span>View Profile</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center rounded-xl border border-border bg-sub-alt/40 px-4 py-2.5 font-display text-xs font-medium text-sub hover:text-foreground transition-all"
          >
            Typing Test
          </Link>
        </div>
      </div>
    );
  }

  const handleGoogleToken = async (idToken: string, nonce: string) => {
    setSubmitting(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogleIdToken(idToken, nonce);
    setSubmitting(false);
    if (error) {
      setErrorMessage(error);
      return;
    }
    router.push(nextParam);
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Google Sign-In (client-side Google Identity Services -- the account
          picker is attributed to this site's own origin, not a Supabase
          subdomain, since there's no redirect through Supabase's hosted
          /authorize endpoint) */}
      {GOOGLE_CLIENT_ID ? (
        <div aria-busy={submitting} className={submitting ? "pointer-events-none opacity-60" : undefined}>
          <GoogleSignInButton
            clientId={GOOGLE_CLIENT_ID}
            onToken={handleGoogleToken}
            onError={setErrorMessage}
          />
        </div>
      ) : (
        <p className="text-xs text-rose-400">
          Google sign-in is not configured (missing NEXT_PUBLIC_GOOGLE_CLIENT_ID).
        </p>
      )}

      {/* Guest Mode Reassurance */}
      <div className="mt-8 rounded-xl border border-border/60 bg-sub-alt/20 p-4">
        <div className="flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles size={14} />
          <span>Local Guest Mode Is Free</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-sub">
          HeroTyping does not require an account. You can practice tests, lessons, and arcade games anytime as a guest.
        </p>
        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-foreground/80">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Signing in starts fresh cloud-synced progress for your account — it won&apos;t pull in scores from this browser&apos;s guest session, so stats never mix between accounts on a shared device.</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background/80 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Link href="/" className="mb-3 flex items-center gap-2">
            <Image
              src="/brand/hero-mark-icon.png"
              alt="HeroTyping"
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-xl font-extrabold uppercase tracking-tight text-foreground">
              Hero<span className="text-accent">typing</span>
            </span>
          </Link>
          <h1 className="font-display text-lg font-bold text-foreground">
            Sign In / Cloud Sync
          </h1>
          <p className="mt-1 text-xs text-sub">
            Sync your speed records, lesson stars, and arcade achievements across devices.
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-sub-alt/30" />}>
          <LoginForm />
        </Suspense>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="font-display text-[11px] text-sub hover:text-foreground transition-colors"
          >
            ← Back to Typing Practice
          </Link>
        </div>
      </div>
    </div>
  );
}
