import { create } from "zustand";

// Lets the SSR'd page intro (a sibling of the client-only typing island,
// not a descendant) hide itself once a test finishes, without pulling
// static intro copy into the ssr:false boundary and losing it from the
// server-rendered HTML crawlers see. Deliberately not persisted — this is
// transient view state, reset to false on every load.
interface TestStatusState {
  isFinished: boolean;
  setFinished: (finished: boolean) => void;
}

export const useTestStatusStore = create<TestStatusState>((set) => ({
  isFinished: false,
  setFinished: (finished) => set({ isFinished: finished }),
}));
