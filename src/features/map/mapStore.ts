import { create } from "zustand";

export type MapFilter = "all" | "place" | "spot" | "friend" | "saved";

type MapState = {
  filter: MapFilter;
  selectedFriend: string | null;
  selectedPinId: string | null;
  setFilter: (filter: MapFilter) => void;
  setSelectedFriend: (friendName: string | null) => void;
  selectPin: (pinId: string | null) => void;
};

export const useMapStore = create<MapState>((set) => ({
  filter: "all",
  selectedFriend: null,
  selectedPinId: null,
  setFilter: (filter) =>
    set((state) => ({
      filter,
      selectedFriend: filter === "friend" ? state.selectedFriend : null
    })),
  setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
  selectPin: (selectedPinId) => set({ selectedPinId })
}));
