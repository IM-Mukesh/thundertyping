"use client";

import { useEffect } from "react";

/**
 * Client-side language synchronizer for localized content pages and guides.
 * Avoids raw `<script>` tags in React component trees which cause React 19 / Next.js
 * console errors during client-side transitions.
 */
export function DocumentLangSync({ lang, dir }: { lang?: string; dir?: "ltr" | "rtl" }) {
  useEffect(() => {
    if (!lang) return;
    const prevLang = document.documentElement.lang;
    const prevDir = document.documentElement.dir;

    document.documentElement.lang = lang;
    if (dir) {
      document.documentElement.dir = dir;
    }

    return () => {
      document.documentElement.lang = prevLang;
      if (prevDir) {
        document.documentElement.dir = prevDir;
      } else {
        document.documentElement.removeAttribute("dir");
      }
    };
  }, [lang, dir]);

  return null;
}
