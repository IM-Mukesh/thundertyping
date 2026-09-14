import type { ReactNode } from "react";

interface ContentPageProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function ContentPage({ title, subtitle, children }: ContentPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-sub">{subtitle}</p>}
      </div>
      <div
        className="flex flex-col gap-4 text-sm leading-relaxed text-sub
          [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2
          [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground
          [&_li]:ml-4 [&_li]:list-disc
          [&_strong]:font-medium [&_strong]:text-foreground"
      >
        {children}
      </div>
    </div>
  );
}
