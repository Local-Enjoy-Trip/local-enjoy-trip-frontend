import { ChevronDown } from "lucide-react";

type LocationSelectorProps = {
  selectedLocation: string;
  hint?: string;
  onChange: () => void;
};

export function LocationSelector({
  selectedLocation,
  hint = "방문할 곳을 변경할 수 있어요",
  onChange,
}: LocationSelectorProps) {
  return (
    <div className="relative mt-5 flex flex-wrap items-center gap-3">
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-(--spot-app-surface) px-4 py-2.5 text-[1.15rem] font-black text-(--spot-app-text) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors"
        type="button"
        onClick={onChange}
        aria-label="방문할 동네 변경"
      >
        {selectedLocation}
        <ChevronDown size={21} strokeWidth={3} />
      </button>
      <span className="relative rounded-2xl bg-(--spot-app-surface) px-3.5 py-3.5 text-xs font-black text-(--spot-app-text-soft) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors before:absolute before:left-[-6px] before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rotate-45 before:bg-(--spot-app-surface)">
        {hint}
      </span>
    </div>
  );
}
