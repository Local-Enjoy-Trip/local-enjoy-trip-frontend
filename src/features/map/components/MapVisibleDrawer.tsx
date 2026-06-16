import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Crosshair } from "lucide-react";
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

      {!selectedPoint ? (
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
      ) : null}

      <div
        className={`touch-pan-y overflow-y-auto px-4 pb-4 ${
          selectedPoint
            ? "h-[calc(100%-30px)] pt-3"
            : "h-[calc(100%-78px)] pt-2"
        }`}
      >
        {selectedPoint ? (
          <MapListCard
            point={selectedPoint}
            featured
            selected={selectedPoint.id === selectedPointId}
          />
        ) : visiblePoints.length > 0 ? (
          <div className="grid gap-2.5">
            {visiblePoints.map((point) => (
              <MapListCard
                key={point.id}
                point={point}
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
