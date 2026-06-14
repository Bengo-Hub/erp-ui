import { create } from "zustand";

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
  setOutlets: (outlets: OutletOption[]) => void;
  selectOutlet: (outlet: OutletOption | null) => void;
  clearOutlet: () => void;
}

export const useOutletFilterStore = create<OutletFilterState>((set) => ({
  selectedOutlet: null,
  outlets: [],
  setOutlets: (outlets) => set({ outlets }),
  selectOutlet: (outlet) => set({ selectedOutlet: outlet }),
  clearOutlet: () => set({ selectedOutlet: null }),
}));
