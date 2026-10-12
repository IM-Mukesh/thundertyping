"use client";

import { useServerInsertedHTML } from "next/navigation";
import { THEME_INIT_SCRIPT } from "./theme-script";

export function ThemeInitScript() {
  useServerInsertedHTML(() => {
    return <script id="theme-init" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
  });
  return null;
}
