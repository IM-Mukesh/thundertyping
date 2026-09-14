export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 pb-16 pt-8 sm:px-10">
      <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Free Online Typing Speed Test
        </h1>
        <p className="text-sm text-sub sm:text-base">
          Measure your words per minute and accuracy. No sign-up required.
        </p>
      </div>

      <div className="mt-12 flex w-full max-w-4xl items-center justify-center rounded-md border border-dashed border-border py-24 text-sub">
        Typing test goes here
      </div>
    </div>
  );
}
