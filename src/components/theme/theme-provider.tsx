"use client";

import { useEffect, type ReactNode } from "react";
import { useSettingsStore } from "@/lib/persistence/settings-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}
