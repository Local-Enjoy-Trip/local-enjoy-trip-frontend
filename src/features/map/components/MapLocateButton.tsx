import { Crosshair } from "lucide-react";
import type { DrawerSnap } from "./MapVisibleDrawer";

export function MapLocateButton({
  drawerSnap,
  hasSelectedPoint,
  onRequestLocation,
}: {
  drawerSnap: DrawerSnap;
  hasSelectedPoint: boolean;
  onRequestLocation: () => void;
}) {
  return (
    <div
      className={`pointer-events-auto absolute right-4 transition-[bottom,opacity] duration-200 ${
        drawerSnap === "full"
          ? "pointer-events-none bottom-[calc(87px+env(safe-area-inset-bottom))] opacity-0"
          : drawerSnap === "hidden"
            ? "bottom-[calc(87px+env(safe-area-inset-bottom))]"
            : hasSelectedPoint
              ? "bottom-[calc(50vh+87px+env(safe-area-inset-bottom))]"
              : "bottom-[calc(36vh+87px+env(safe-area-inset-bottom))]"
      }`}
    >
      <button
        className="grid size-11 touch-manipulation select-none place-items-center rounded-full border-0 bg-white text-[#1e2a26] shadow-[0_7px_18px_rgba(17,17,17,0.18)]"
        onClick={onRequestLocation}
        type="button"
        aria-label="현재 위치"
      >
        <Crosshair size={20} strokeWidth={2.4} />
      </button>
    </div>
  );
}
