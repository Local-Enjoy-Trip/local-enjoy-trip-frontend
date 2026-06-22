import {
  Bookmark,
  ChevronDown,
  Footprints,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import type { MapFilter, PlaceCategory } from "../mapStore";

const filters: Array<{
  value: MapFilter;
  label: string;
  icon?: typeof Sparkles;
}> = [
  { value: "all", label: "전체", icon: Sparkles },
  { value: "place", label: "장소", icon: Star },
  { value: "spot", label: "쪽지", icon: Footprints },
  { value: "friend", label: "친구", icon: UsersRound },
  { value: "saved", label: "저장됨", icon: Bookmark },
];

const placeCategories: Array<{ label: PlaceCategory; color: string }> = [
  { label: "관광지", color: "#3B82F6" },
  { label: "문화시설", color: "#8B5CF6" },
  { label: "축제", color: "#EC4899" },
  { label: "레포츠", color: "#22A06B" },
  { label: "숙박", color: "#6366F1" },
  { label: "쇼핑", color: "#F59E0B" },
  { label: "음식점", color: "#FD4003" },
];

export function MapFilterChips({
  filter,
  onFilterChange,
  onSelectedPlaceCategoryChange,
  selectedPlaceCategory,
}: {
  filter: MapFilter;
  onFilterChange: (filter: MapFilter) => void;
  onSelectedPlaceCategoryChange: (category: PlaceCategory | null) => void;
  selectedPlaceCategory: PlaceCategory | null;
}) {
  const handleFilterClick = (nextFilter: MapFilter) => {
    if (
      (nextFilter === "friend" || nextFilter === "place") &&
      filter === nextFilter
    ) {
      onFilterChange("all");
      return;
    }

    onFilterChange(nextFilter);
  };

  return (
    <>
      <div
        className="mt-2.5 flex touch-pan-x select-none gap-2 overflow-x-auto px-4 py-2 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="지도 필터"
      >
        {filters.map((item) => {
          const active = filter === item.value;
          const Icon = item.icon;

          return (
            <button
              className={`inline-flex h-9 flex-none items-center gap-1.5 rounded-full border px-3.5 text-[15px] font-extrabold tracking-normal transition ${
                active
                  ? "border-[#FD4003] bg-white text-[#202124] shadow-[0_4px_11px_rgba(253,64,3,0.18)]"
                  : "border-[#e6e8eb] bg-white text-[#33383f] shadow-[0_3px_9px_rgba(36,48,65,0.14)]"
              }`}
              key={item.value}
              onClick={() => handleFilterClick(item.value)}
              role="tab"
              aria-selected={active}
              type="button"
            >
              {Icon ? (
                <Icon
                  className="text-[#FD4003]"
                  size={18}
                  strokeWidth={active ? 3 : 2.8}
                />
              ) : null}
              {item.label}
              {item.value === "place" ? (
                <ChevronDown
                  className={`text-[#FD4003] transition-transform ${active ? "rotate-180" : ""}`}
                  size={15}
                  strokeWidth={3}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {filter === "place" ? (
        <div className="mt-0.5 flex max-w-full touch-pan-x select-none gap-2 overflow-x-auto px-4 py-2 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            className={`inline-flex h-9 flex-none items-center rounded-full border bg-white px-3 text-[14px] font-extrabold shadow-[0_3px_9px_rgba(36,48,65,0.12)] ${
              selectedPlaceCategory === null
                ? "border-[#FD4003] text-[#202124]"
                : "border-[#e6e8eb] text-[#33383f]"
            }`}
            onClick={() => onSelectedPlaceCategoryChange(null)}
            type="button"
          >
            모두
          </button>
          {placeCategories.map((category) => {
            const active = selectedPlaceCategory === category.label;

            return (
              <button
                className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full border bg-white px-3 text-[14px] font-extrabold text-[#33383f] shadow-[0_3px_9px_rgba(36,48,65,0.12)]"
                key={category.label}
                onClick={() => onSelectedPlaceCategoryChange(category.label)}
                style={
                  active
                    ? {
                        borderColor: category.color,
                        boxShadow: `0 4px 11px ${category.color}33`,
                      }
                    : undefined
                }
                type="button"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                {category.label}
              </button>
            );
          })}
        </div>
      ) : null}

    </>
  );
}
