import { ChevronDown } from "lucide-react";
import {
  homeLocations,
  type HomeLocation,
} from "@/features/home/types/homeTypes";

type LocationSelectorProps = {
  selectedLocation: HomeLocation;
  isOpen: boolean;
  hint?: string;
  onToggle: () => void;
  onSelect: (location: HomeLocation) => void;
};

export function LocationSelector({
  selectedLocation,
  isOpen,
  hint = "방문할 곳을 변경할 수 있어요",
  onToggle,
  onSelect,
}: LocationSelectorProps) {
  return (
    <div className="relative mt-5 flex flex-wrap items-center gap-3">
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-(--spot-app-surface) px-4 py-2.5 text-[1.15rem] font-black text-(--spot-app-text) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="방문할 동네 변경"
      >
        {selectedLocation}
        <ChevronDown
          className={
            isOpen ? "rotate-180 transition-transform" : "transition-transform"
          }
          size={22}
          strokeWidth={3}
        />
      </button>
      <span className="relative rounded-2xl bg-(--spot-app-surface) px-3.5 py-3.5 text-xs font-black text-(--spot-app-text-soft) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors before:absolute before:left-[-6px] before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rotate-45 before:bg-(--spot-app-surface)">
        {hint}
      </span>

      {isOpen ? (
        <div className="absolute left-0 top-[52px] z-20 w-[180px] overflow-hidden rounded-2xl bg-(--spot-app-surface) p-1 shadow-[0_18px_40px_var(--spot-app-shadow-strong)]">
          {homeLocations.map((location) => (
            <button
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-black ${
                selectedLocation === location
                  ? "bg-(--spot-app-soft-accent) text-[#FF4300]"
                  : "text-(--spot-app-text)"
              }`}
              key={location}
              type="button"
              onClick={() => onSelect(location)}
            >
              {location}
              {selectedLocation === location ? <span>선택</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
