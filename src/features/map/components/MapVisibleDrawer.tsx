import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronLeft, ChevronRight, Crosshair, Plus } from "lucide-react";
import { courses } from "@/shared/data/mockData";
import type { MapPoint } from "../types";
import { MapListCard } from "./MapListCard";

export type DrawerSnap = "hidden" | "default" | "full";

const SNAP_ORDER: DrawerSnap[] = ["full", "default", "hidden"];

function getSnapOffset(
  snap: DrawerSnap,
  drawerHeight: number,
  hasSelectedPoint: boolean,
) {
  if (snap === "full") return 0;
  if (snap === "hidden") return drawerHeight + 24;

  const defaultHeight = hasSelectedPoint
    ? Math.min(260, window.innerHeight * 0.32)
    : window.innerHeight * 0.36;
  return Math.max(0, drawerHeight - defaultHeight);
}

export function MapVisibleDrawer({
  drawerSnap,
  onRequestLocation,
  onSelectPoint,
  onSnapChange,
  selectedPointId,
  selectedPoint,
  visiblePoints,
}: {
  drawerSnap: DrawerSnap;
  onRequestLocation: () => void;
  onSelectPoint: (point: MapPoint) => void;
  onSnapChange: (snap: DrawerSnap) => void;
  selectedPointId: string | null;
  selectedPoint: MapPoint | null;
  visiblePoints: MapPoint[];
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const dragStartRef = useRef({ offset: 0, time: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const [courseTarget, setCourseTarget] = useState<MapPoint | null>(null);
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const updateDrawerHeight = () => setDrawerHeight(drawer.clientHeight);
    updateDrawerHeight();
    window.addEventListener("resize", updateDrawerHeight);

    return () => window.removeEventListener("resize", updateDrawerHeight);
  }, []);

  const hasSelectedPoint = selectedPoint !== null;
  const restingOffset = drawerHeight
    ? getSnapOffset(drawerSnap, drawerHeight, hasSelectedPoint)
    : 0;
  const currentOffset = dragOffset ?? restingOffset;

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drawerHeight) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragMovedRef.current = false;
    dragStartRef.current = {
      offset: restingOffset,
      time: performance.now(),
      y: event.clientY,
    };
    setDragOffset(restingOffset);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragOffset === null) return;

    const distance = event.clientY - dragStartRef.current.y;
    if (Math.abs(distance) > 3) {
      dragMovedRef.current = true;
    }

    setDragOffset(
      Math.min(
        drawerHeight + 24,
        Math.max(0, dragStartRef.current.offset + distance),
      ),
    );
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragOffset === null) return;

    const distance = event.clientY - dragStartRef.current.y;
    const elapsed = Math.max(1, performance.now() - dragStartRef.current.time);
    const velocity = distance / elapsed;
    const currentIndex = SNAP_ORDER.indexOf(drawerSnap);
    let nextSnap: DrawerSnap;

    if (Math.abs(velocity) > 0.45 && Math.abs(distance) > 18) {
      const direction = velocity > 0 ? 1 : -1;
      nextSnap =
        SNAP_ORDER[
          Math.min(SNAP_ORDER.length - 1, Math.max(0, currentIndex + direction))
        ];
    } else {
      nextSnap = SNAP_ORDER.reduce((nearest, snap) => {
        const nearestDistance = Math.abs(
          dragOffset - getSnapOffset(nearest, drawerHeight, hasSelectedPoint),
        );
        const snapDistance = Math.abs(
          dragOffset - getSnapOffset(snap, drawerHeight, hasSelectedPoint),
        );
        return snapDistance < nearestDistance ? snap : nearest;
      }, SNAP_ORDER[0]);
    }

    setDragOffset(null);
    onSnapChange(nextSnap);
  }

  function handleHandleClick() {
    if (dragMovedRef.current) {
      dragMovedRef.current = false;
      return;
    }

    onSnapChange(drawerSnap === "full" ? "default" : "full");
  }

  const drawerStyle = {
    transform: `translateY(${currentOffset}px)`,
    transition: dragOffset === null ? "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
  } satisfies CSSProperties;

  return (
    <aside
      aria-hidden={drawerSnap === "hidden"}
      className={`pointer-events-auto fixed inset-x-0 top-[calc(124px+env(safe-area-inset-top))] bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mx-auto w-full max-w-[430px] rounded-t-[22px] bg-white shadow-[0_-14px_34px_rgba(17,17,17,0.18)] will-change-transform sm:border-x sm:border-black/10 ${
        drawerSnap === "hidden" && dragOffset === null ? "pointer-events-none" : ""
      }`}
      ref={drawerRef}
      style={drawerStyle}
    >
      <div
        className={`absolute -top-16 right-4 transition-opacity duration-200 ${
          drawerSnap === "full"
            ? "pointer-events-none opacity-0"
            : "pointer-events-auto opacity-100"
        }`}
      >
        <button
          className="grid size-11 touch-manipulation select-none place-items-center rounded-full border border-black/5 bg-white text-[#1e2a26] shadow-[0_7px_18px_rgba(17,17,17,0.18)]"
          onClick={onRequestLocation}
          type="button"
          aria-label="현재 위치"
        >
          <Crosshair size={20} strokeWidth={2.4} />
        </button>
      </div>

      <button
        aria-label={
          drawerSnap === "full" ? "드로어 기본 높이로 내리기" : "드로어 전체로 펼치기"
        }
        className="mx-auto block h-6 w-full cursor-grab touch-none border-0 bg-transparent active:cursor-grabbing"
        onClick={handleHandleClick}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        type="button"
      >
        <span className="mx-auto mt-1.5 block h-1 w-11 rounded-full bg-[#cfcfcf]" />
      </button>

      <div
        className="h-[calc(100%-30px)] touch-pan-y overflow-y-auto px-4 pt-3 pb-4"
      >
        {courseTarget ? (
          <div>
            <div className="mb-4 flex items-start gap-3">
              <button
                aria-label="장소 목록으로 돌아가기"
                className="grid size-9 flex-none place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#4B4741]"
                onClick={() => setCourseTarget(null)}
                type="button"
              >
                <ChevronLeft size={19} />
              </button>
              <div className="min-w-0">
                <p className="m-0 text-xs font-black text-[#6A665F]">
                  추가할 코스 선택
                </p>
                <h2 className="m-0 mt-1 truncate text-lg font-black text-[#171717]">
                  {courseTarget.name}
                </h2>
              </div>
            </div>

            <div className="grid gap-2">
              {courses.map((course) => (
                <button
                  className="flex items-center gap-3 rounded-xl border border-[#EEEAE2] bg-white p-3 text-left"
                  key={course.id}
                  onClick={() => setCourseTarget(null)}
                  type="button"
                >
                  <span className="grid size-10 flex-none place-items-center rounded-lg bg-[#F4F3EF] text-[#3E4A43]">
                    <Check size={18} strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-black text-[#171717]">
                      {course.title}
                    </strong>
                    <small className="mt-0.5 block text-xs font-bold text-[#807A72]">
                      {course.area} · {course.stopCount}개 장소
                    </small>
                  </span>
                </button>
              ))}
              <button
                className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-[#D8D3C9] bg-[#FAF9F6] p-3 text-left"
                type="button"
              >
                <span className="grid size-10 flex-none place-items-center rounded-lg bg-white text-[#3E4A43]">
                  <Plus size={18} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-black text-[#171717]">
                    새 코스 만들기
                  </strong>
                  <small className="mt-0.5 block text-xs font-bold text-[#807A72]">
                    이 장소로 새 여행 코스를 시작해요.
                  </small>
                </span>
                <ChevronRight size={18} className="text-[#AAA49B]" />
              </button>
            </div>
          </div>
        ) : selectedPoint ? (
          <MapListCard
            point={selectedPoint}
            featured
            onAddToCourse={setCourseTarget}
            selected={selectedPoint.id === selectedPointId}
          />
        ) : visiblePoints.length > 0 ? (
          <div className="grid gap-2.5">
            {visiblePoints.map((point) => (
              <MapListCard
                key={point.id}
                point={point}
                onAddToCourse={setCourseTarget}
                onSelect={() => onSelectPoint(point)}
                selected={point.id === selectedPointId}
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
