import { create } from "zustand";

export type MapFilter = "all" | "place" | "spot" | "friend" | "saved";
export type PlaceCategory =
  | "관광지"
  | "문화시설"
  | "축제"
  | "레포츠"
  | "숙박"
  | "쇼핑"
  | "음식점";

type MapState = {
  filter: MapFilter;
  selectedFriend: string | null;
  selectedPlaceCategory: PlaceCategory | null;
  selectedPinId: string | null;
  setFilter: (filter: MapFilter) => void;
  setSelectedFriend: (friendName: string | null) => void;
  setSelectedPlaceCategory: (category: PlaceCategory | null) => void;
  selectPin: (pinId: string | null) => void;
};

export const useMapStore = create<MapState>((set) => ({
  filter: "all",
  selectedFriend: null,
  selectedPlaceCategory: null,
  selectedPinId: null,
  setFilter: (filter) =>
    set((state) => ({
      filter,
      selectedFriend: filter === "friend" ? state.selectedFriend : null,
      selectedPlaceCategory:
        filter === "place" ? state.selectedPlaceCategory : null,
    })),
  setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
  setSelectedPlaceCategory: (selectedPlaceCategory) =>
    set({ selectedPlaceCategory }),
  selectPin: (selectedPinId) => set({ selectedPinId })
}));
