import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface OutletOption {
  id: string;
  code: string;
  name: string;
  useCase?: string;
  isHq?: boolean;
}

interface OutletFilterState {
  selectedOutlet: OutletOption | null;
  outlets: OutletOption[];
  /** True once we've applied the login-time default-outlet preselect for this session. */
  autoInitialized: boolean;
  setOutlets: (outlets: OutletOption[]) => void;
  selectOutlet: (outlet: OutletOption | null) => void;
  clearOutlet: () => void;
  setAutoInitialized: (v: boolean) => void;
  /** Clear all outlet-filter state (called on logout so the next user re-initialises). */
  reset: () => void;
}

export const useOutletFilterStore = create<OutletFilterState>()(
  persist(
    (set) => ({
      selectedOutlet: null,
      outlets: [],
      autoInitialized: false,
      setOutlets: (outlets) => set({ outlets }),
      selectOutlet: (outlet) => set({ selectedOutlet: outlet }),
      clearOutlet: () => set({ selectedOutlet: null }),
      setAutoInitialized: (v) => set({ autoInitialized: v }),
      reset: () => set({ selectedOutlet: null, outlets: [], autoInitialized: false }),
    }),
    {
      name: "erp-outlet-filter",
      storage: createJSONStorage(() => localStorage),
      // `outlets` is refetched each load; only the user's chosen outlet + init flag persist.
      partialize: (s) => ({ selectedOutlet: s.selectedOutlet, autoInitialized: s.autoInitialized }),
    },
  ),
);
