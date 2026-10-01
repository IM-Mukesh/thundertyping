"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

function LoginForm() {
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") || "/profile";
  const urlError = searchParams.get("error");

  const { signInWithGoogle, user } = useAuth();

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

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle(nextParam);
      if (error) {
        setErrorMessage(error);
        setSubmitting(false);
      }
    } catch {
      setErrorMessage("Failed to initiate Google sign-in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={submitting}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-sub-alt/40 px-4 py-3 font-display text-xs font-semibold text-foreground transition-all hover:border-accent hover:bg-sub-alt/80 active:scale-[0.99] disabled:opacity-50"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

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
