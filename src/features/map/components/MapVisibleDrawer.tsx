import type { MapPoint } from "../types";
import { MapListCard } from "./MapListCard";

export function MapVisibleDrawer({
  drawerExpanded,
  onSelectPoint,
  onToggleExpanded,
  selectedPoint,
  visiblePoints
}: {
  drawerExpanded: boolean;
  onSelectPoint: (point: MapPoint) => void;
  onToggleExpanded: () => void;
  selectedPoint: MapPoint | null;
  visiblePoints: MapPoint[];
}) {
  return (
    <aside
      className={`pointer-events-auto fixed inset-x-0 bottom-[calc(77px+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[430px] touch-none rounded-t-[22px] bg-white shadow-[0_-14px_34px_rgba(17,17,17,0.18)] transition-[height] duration-200 sm:border-x sm:border-black/10 ${
        drawerExpanded ? "h-[52vh]" : "h-[214px]"
      }`}
    >
      <button
        className="mx-auto mt-2 block h-7 w-full touch-manipulation border-0 bg-transparent"
        onClick={onToggleExpanded}
        type="button"
        aria-label={drawerExpanded ? "목록 접기" : "목록 펼치기"}
      >
        <span className="mx-auto block h-1 w-11 rounded-full bg-[#d8d8d8]" />
      </button>

      <div className="flex items-center justify-between px-4 pb-2">
        <div>
          <p className="m-0 text-xs font-black text-[#185B3D]">
            지도에 보이는 장소
          </p>
          <h2 className="m-0 mt-1 text-[1.05rem] font-black text-[#171717]">
            {visiblePoints.length}개 발견
          </h2>
        </div>
      </div>

      <div className="h-[calc(100%-92px)] touch-pan-y overflow-y-auto px-4 pb-4">
        {selectedPoint ? <MapListCard point={selectedPoint} featured /> : null}
        {visiblePoints.length > 0 ? (
          <div className="grid gap-2.5">
            {visiblePoints.map((point) => (
              <MapListCard
                key={point.id}
                point={point}
                onSelect={() => onSelectPoint(point)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F6F5F1] p-4 text-sm font-bold text-[#6d665d]">
            검색어나 필터에 맞는 장소가 지도 안에 없어요.
          </div>
        )}
      </div>
    </aside>
  );
}
