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
    <div className="relative mt-5 flex flex-wrap items-center gap-5">
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-(--spot-app-surface) px-4 py-2.5 text-lg font-bold text-(--spot-app-text) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors"
        type="button"
        onClick={onChange}
        aria-label="방문할 동네 변경"
      >
        {selectedLocation}
        <ChevronDown size={21} strokeWidth={3} />
      </button>
      <span className="relative rounded-lg bg-[#E6E6E6] px-4 py-3 text-xs leading-none font-bold text-neutral-800 transition-colors before:absolute before:left-[-4px] before:top-1/2 before:h-4 before:w-4 before:-translate-y-1/2 before:rotate-45 before:bg-[#E6E6E6]">
        {hint}
      </span>
    </div>
  );
}
