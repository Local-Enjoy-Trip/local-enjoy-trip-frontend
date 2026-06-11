import { create } from "zustand";
import type { PinKind } from "../../shared/types/domain";

type MapFilter = "all" | PinKind;

type MapState = {
  filter: MapFilter;
  selectedPinId: string | null;
  setFilter: (filter: MapFilter) => void;
  selectPin: (pinId: string | null) => void;
};

export const useMapStore = create<MapState>((set) => ({
  filter: "all",
  selectedPinId: null,
  setFilter: (filter) => set({ filter }),
  selectPin: (selectedPinId) => set({ selectedPinId })
}));
