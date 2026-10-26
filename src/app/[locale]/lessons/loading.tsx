export default function LessonsHubLoading() {
  return (
    <div
      role="status"
      aria-label="Loading typing lessons curriculum..."
      className="relative flex flex-1 flex-col items-center px-4 pb-16 pt-5 sm:px-8 animate-pulse motion-reduce:animate-none"
    >
      <span className="sr-only">Loading touch-typing lessons and curriculum...</span>

      {/* Top Breadcrumb / Title Area Skeleton */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-2 pb-6">
        <div className="h-4 w-28 rounded bg-sub-alt/40" />
        <div className="h-3 w-36 rounded bg-sub-alt/30" />
        <div className="h-9 w-80 rounded-lg bg-sub-alt/50" />
        <div className="h-4 w-full max-w-xl rounded bg-sub-alt/30" />
      </header>

      <div className="mx-auto w-full max-w-6xl flex flex-col gap-10">
        {/* Hero Next Recommended Unit Skeleton */}
        <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-sub-alt/10 p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3">
              <div className="h-3 w-32 rounded bg-sub-alt/40" />
              <div className="h-7 w-64 rounded-lg bg-sub-alt/50" />
              <div className="h-4 w-96 max-w-full rounded bg-sub-alt/30" />
              <div className="h-2 w-48 rounded-full bg-sub-alt/40 mt-1" />
            </div>
            <div className="h-12 w-48 rounded-xl bg-sub-alt/40" />
          </div>
        </section>

        {/* Stage Group Cards Grid Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-44 rounded bg-sub-alt/40" />
            <div className="h-4 w-24 rounded bg-sub-alt/30" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border/40 bg-sub-alt/10 p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-sub-alt/40" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-sub-alt/40" />
                    <div className="h-3 w-48 rounded bg-sub-alt/20" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border/20 pt-2">
                  <div className="h-2 w-20 rounded bg-sub-alt/30" />
                  <div className="h-7 w-16 rounded bg-sub-alt/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
