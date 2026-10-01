"use client";

import { useEffect, useRef, useState } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

interface GoogleSignInButtonProps {
  clientId: string;
  onToken: (idToken: string, nonce: string) => void;
  onError: (message: string) => void;
}

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services, entirely client-side -- unlike Supabase's hosted OAuth redirect
 * (signInWithOAuth), this never leaves this site's origin, so the account
 * picker Google shows is attributed to this site rather than a Supabase
 * project subdomain. The resulting ID token is still verified server-side by
 * Supabase in signInWithIdToken(), the same security guarantee as the
 * redirect flow.
 */
export function GoogleSignInButton({ clientId, onToken, onError }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        await loadGisScript();
        if (cancelled || !containerRef.current || !window.google) return;

        const rawNonce = `${crypto.randomUUID()}${crypto.randomUUID()}`;
        const hashedNonce = await sha256Hex(rawNonce);
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          callback: (response) => {
            if (!cancelled) onToken(response.credential, rawNonce);
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          width: Math.min(containerRef.current.clientWidth || 300, 400),
        });
      } catch (err) {
        if (!cancelled) {
          setFailed(true);
          onError(err instanceof Error ? err.message : "Failed to load Google sign-in");
        }
      }
    }

    setup();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (failed) {
    return (
      <p className="text-xs text-rose-400">
        Google sign-in failed to load. Please refresh the page and try again.
      </p>
    );
  }

  return <div ref={containerRef} className="flex w-full justify-center" />;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            nonce: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            container: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              shape?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}
