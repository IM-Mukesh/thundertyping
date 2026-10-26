export default function LessonLoading() {
  return (
    <div
      role="status"
      aria-label="Loading typing lesson..."
      className="relative flex flex-1 flex-col items-center px-3 pb-12 pt-2 sm:px-6 lg:px-8 animate-pulse motion-reduce:animate-none"
    >
      <span className="sr-only">Loading typing lesson...</span>

      {/* Grid container mirroring page layout */}
      <div className="grid w-full grid-cols-1 min-[1760px]:grid-cols-[1fr_auto_1fr] min-[1760px]:items-start">
        <div aria-hidden="true" className="hidden min-[1760px]:block" />
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex w-full items-center justify-between gap-3 pb-3">
            <div className="h-4 w-24 rounded bg-sub-alt/40" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-16 rounded bg-sub-alt/30" />
              <div className="h-4 w-24 rounded bg-sub-alt/30" />
            </div>
          </div>

          {/* Lesson Header */}
          <div className="mb-3 flex w-full flex-col items-start gap-2 min-[900px]:mb-2 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
            <div className="h-8 w-64 rounded-lg bg-sub-alt/50" />
            <div className="h-4 w-72 rounded bg-sub-alt/30" />
          </div>

          {/* Interactive Lesson Drill Skeleton matching LessonSkeleton */}
          <div
            role="region"
            aria-label="Typing lesson interface"
            className="flex h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-border/60 bg-sub-alt/10 p-8"
          >
            <div className="w-full max-w-xl space-y-4">
              <div className="mx-auto h-4 w-32 rounded bg-sub-alt/40" />
              <div className="h-10 w-full rounded-xl bg-sub-alt/30" />
              <div className="h-24 w-full rounded-xl bg-sub-alt/20" />
              <div className="flex justify-between pt-2">
                <div className="h-4 w-20 rounded bg-sub-alt/30" />
                <div className="h-4 w-20 rounded bg-sub-alt/30" />
              </div>
            </div>
          </div>

          {/* Introduced Keys Bar Skeleton */}
          <div className="mt-10 flex w-full flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-sub-alt/20 p-4">
              <div className="h-4 w-44 rounded bg-sub-alt/40" />
              <div className="h-7 w-8 rounded border border-border bg-background/50" />
              <div className="h-7 w-8 rounded border border-border bg-background/50" />
            </div>

            {/* Technique Guidance Skeleton */}
            <div className="rounded-xl border border-border/60 bg-sub-alt/10 p-5 space-y-2">
              <div className="h-4 w-48 rounded bg-sub-alt/40" />
              <div className="h-3 w-full rounded bg-sub-alt/20" />
              <div className="h-3 w-4/5 rounded bg-sub-alt/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
