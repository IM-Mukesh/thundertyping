import { AdSlot } from "@/components/layout/ad-slot";

/**
 * A persistent ad column beside an active typing surface -- home, a lesson,
 * a game -- rather than only below the content. The point is the opposite of
 * a below-content slot: it stays visible the whole time someone is typing
 * without ever sitting inside the typing surface itself, so it can't be
 * mistaken for part of it or interrupt a run.
 *
 * Visibility is controlled by the call site's grid layout (a `1fr auto 1fr`
 * column split that keeps the content column dead-centered in the viewport
 * no matter what's in the side columns), not by this component -- see the
 * comment on that grid in page.tsx / lessons/[lessonId]/page.tsx for why a
 * plain flex row with a shrinkable content column visibly pushed the typing
 * area off-center once the rail's column existed, even with nothing inside
 * it yet.
 */
export function AdRail({ id }: { id: string }) {
  return (
    <aside aria-label="Advertisement" className="sticky top-24 w-[280px]">
      <AdSlot id={id} format="vertical" />
    </aside>
  );
}
