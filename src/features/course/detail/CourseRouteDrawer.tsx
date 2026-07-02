import { GripVertical, Pencil, WandSparkles } from "lucide-react";
import { motion, Reorder, useDragControls } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { CourseStop } from "./types";

export function CourseRouteDrawer({
  activeStopId,
  canEdit,
  drawerCoverOffset,
  drawerTop,
  headerOffset,
  setActiveStopId,
  setDrawerCoverOffset,
  setHeaderOffset,
  routeStops,
  onCommitStopsOrder,
  isRouteEditing,
  setIsRouteEditing,
  hasBackup,
  onRestore,
  clearBackup,
  hasApiCourse,
  onDirectOptimize,
  isOptimizing,
  drawerCollapsedTop,
  headerCollapseDistance,
}: {
  activeStopId: number;
  canEdit: boolean;
  drawerCoverOffset: number;
  drawerTop: number;
  headerOffset: number;
  setActiveStopId: Dispatch<SetStateAction<number>>;
  setDrawerCoverOffset: Dispatch<SetStateAction<number>>;
  setHeaderOffset: Dispatch<SetStateAction<number>>;
  routeStops: CourseStop[];
  onCommitStopsOrder?: (newStops: CourseStop[]) => void;
  isRouteEditing: boolean;
  setIsRouteEditing: Dispatch<SetStateAction<boolean>>;
  hasBackup: boolean;
  onRestore: () => void;
  clearBackup: () => void;
  hasApiCourse: boolean;
  onDirectOptimize: () => void;
  isOptimizing: boolean;
  drawerCollapsedTop: number;
  headerCollapseDistance: number;
}) {
  const dragRef = useRef<{
    currentOffset: number;
    moved: boolean;
    startOffset: number;
    startY: number;
  } | null>(null);
  const ignoreClickRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [draftStops, setDraftStops] = useState(routeStops);
  const isExpanded = drawerTop === 0;
  const isHeaderCollapsed = headerOffset >= headerCollapseDistance;
  const displayedStops = isRouteEditing ? draftStops : routeStops;

  useEffect(() => {
    if (!isRouteEditing) {
      setDraftStops(routeStops);
    }
  }, [isRouteEditing, routeStops]);

  function startRouteEditing() {
    setDraftStops(routeStops);
    setIsRouteEditing(true);
    setDrawerCoverOffset(drawerCollapsedTop);
    setHeaderOffset(headerCollapseDistance);
  }

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState) return;

      const delta = event.clientY - dragState.startY;
      const nextOffset = Math.min(
        drawerCollapsedTop,
        Math.max(0, dragState.startOffset - delta),
      );

      dragState.currentOffset = nextOffset;
      dragState.moved = dragState.moved || Math.abs(delta) > 4;
      setDrawerCoverOffset(nextOffset);
    };

    const handlePointerUp = () => {
      const dragState = dragRef.current;
      if (!dragState) return;

      ignoreClickRef.current = dragState.moved;
      setDrawerCoverOffset(
        dragState.currentOffset < drawerCollapsedTop / 2
          ? 0
          : drawerCollapsedTop,
      );
      dragRef.current = null;

      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [drawerCollapsedTop, setDrawerCoverOffset]);

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (isRouteEditing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      currentOffset: drawerCoverOffset,
      moved: false,
      startOffset: drawerCoverOffset,
      startY: event.clientY,
    };
  }

  function moveHeaderFromRouteScroll(deltaY: number) {
    const scroller = scrollerRef.current;
    const isMovingTowardLowerContent = deltaY > 0;
    const isMovingBackToTop = deltaY < 0;
    const isScrollerAtTop = !scroller || scroller.scrollTop <= 0;

    if (
      isMovingTowardLowerContent &&
      headerOffset < headerCollapseDistance
    ) {
      const remainingCollapse = headerCollapseDistance - headerOffset;
      const collapseDelta = Math.min(remainingCollapse, deltaY);

      setHeaderOffset((current) =>
        Math.min(headerCollapseDistance, current + collapseDelta),
      );

      return true;
    }

    if (isMovingBackToTop && headerOffset > 0 && isScrollerAtTop) {
      setHeaderOffset((current) => Math.max(0, current + deltaY));
      return true;
    }

    return false;
  }

  function handleListWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (isRouteEditing) return;
    if (moveHeaderFromRouteScroll(event.deltaY)) {
      event.preventDefault();
    }
  }

  function handleListTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (isRouteEditing) return;
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleListTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (isRouteEditing) return;
    const previousY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;

    if (previousY == null || currentY == null) return;

    const deltaY = previousY - currentY;
    touchStartYRef.current = currentY;

    if (moveHeaderFromRouteScroll(deltaY)) {
      event.preventDefault();
    }
  }

  function updateActiveStopFromScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const targetY = scrollerRect.top + 24;
    const stopElements = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-stop-id]"),
    );

    const firstVisibleStop =
      stopElements.find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.top <= targetY && rect.bottom > targetY;
      }) ??
      stopElements.find(
        (element) => element.getBoundingClientRect().top > targetY,
      );

    const firstVisibleStopId = Number(firstVisibleStop?.dataset.stopId);

    if (firstVisibleStopId) setActiveStopId(firstVisibleStopId);
  }



  return (
    <motion.section
      aria-label="day 1 경로"
      className="absolute inset-x-0 bottom-[-96px] z-20 flex flex-col bg-[#F2F2F0] shadow-[0_-14px_32px_rgba(17,17,17,0.12)]"
      initial={{ top: drawerCollapsedTop }}
      animate={{
        borderTopLeftRadius: isExpanded ? 0 : 28,
        borderTopRightRadius: isExpanded ? 0 : 28,
        top: drawerTop,
      }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="flex-none">
        <button
          aria-label={isExpanded ? "경로 드로어 내리기" : "경로 드로어 올리기"}
          className={`grid h-11 w-full place-items-center border-0 bg-transparent p-0 touch-none ${
            isRouteEditing
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing"
          }`}
          data-testid="course-route-drawer-handle"
          disabled={isRouteEditing}
          onClick={() => {
            if (isRouteEditing) return;
            if (ignoreClickRef.current) return;
            setDrawerCoverOffset((current) =>
              current >= drawerCollapsedTop ? 0 : drawerCollapsedTop,
            );
          }}
          onPointerDown={beginDrag}
          type="button"
        >
          <span className="h-1.5 w-12 rounded-full bg-[#D8D5CE]" />
        </button>
      </div>

      <div
        className={`flex-1 overscroll-contain px-5 pt-2 pb-[calc(60dvh+env(safe-area-inset-bottom))] ${
          isHeaderCollapsed ? "overflow-y-auto" : "overflow-hidden"
        }`}
        data-testid="course-route-drawer-scroller"
        onScroll={updateActiveStopFromScroll}
        onTouchMove={handleListTouchMove}
        onTouchStart={handleListTouchStart}
        onWheel={handleListWheel}
        ref={scrollerRef}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-lg font-black text-[#272727]">여행지 리스트</h2>
          {canEdit && routeStops.length > 1 && (
            <div className="flex items-center gap-2">
              {isRouteEditing ? (
                <>
                  {hasBackup && (
                    <button
                      className="text-xs font-black text-[#FD4003] border border-[#FCDAD0] bg-[#FFF0EC] rounded-full px-2.5 py-1"
                      onClick={onRestore}
                      type="button"
                    >
                      복구하기
                    </button>
                  )}
                  {hasApiCourse && (
                    <button
                      className="grid size-7 place-items-center rounded-full bg-[#EEF4EF] text-[#1F3D35] border border-[#DCE7DF] hover:bg-[#DCE7DF] disabled:opacity-50"
                      onClick={onDirectOptimize}
                      disabled={isOptimizing}
                      title="AI로 걷기 좋은 순서 정리"
                      type="button"
                    >
                      <WandSparkles size={13} className={isOptimizing ? "animate-pulse" : ""} />
                    </button>
                  )}
                  <button
                    className="inline-flex h-7 items-center justify-center rounded-full bg-[#FD4003] px-3.5 text-xs font-black text-white shadow-[0_4px_10px_rgba(253,64,3,0.12)]"
                    onClick={() => {
                      onCommitStopsOrder?.(draftStops);
                      setIsRouteEditing(false);
                      setDrawerCoverOffset(drawerCollapsedTop);
                      setHeaderOffset(0);
                      clearBackup();
                    }}
                    type="button"
                  >
                    완료
                  </button>
                </>
              ) : (
                <button
                  aria-label="경로 순서 편집"
                  className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white shadow-[0_4px_10px_rgba(31,61,53,0.12)] hover:bg-[#162B25] transition"
                  onClick={startRouteEditing}
                  title="일정 편집"
                  type="button"
                >
                  <Pencil size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>
        {displayedStops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D4CC] bg-white p-5 text-center">
            <p className="m-0 text-sm font-black text-[#514D47]">
              아직 추가한 장소가 없어요.
            </p>
            <p className="mt-1.5 mb-0 text-xs font-bold text-[#928C84]">
              상세 페이지에서 저장한 장소와 쪽지를 차례로 담아보세요.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            layoutScroll
            values={displayedStops.map((stop) => stop.id)}
            onReorder={(newStopIds) => {
              const newStops = newStopIds
                .map((id) => displayedStops.find((stop) => stop.id === id))
                .filter((stop): stop is CourseStop => !!stop);
              setDraftStops(newStops);
            }}
            className="flex flex-col gap-4"
          >
            {displayedStops.map((stop, index) => (
              <DraggableStopTimelineItem
                key={stop.id}
                isActive={stop.id === activeStopId}
                isRouteEditing={isRouteEditing}
                onSelect={() => setActiveStopId(stop.id)}
                order={index + 1}
                stop={stop}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </motion.section>
  );
}

function DraggableStopTimelineItem({
  isActive,
  isRouteEditing,
  onSelect,
  order,
  stop,
}: {
  isActive: boolean;
  isRouteEditing: boolean;
  onSelect: () => void;
  order: number;
  stop: CourseStop;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      className={`relative ${isRouteEditing ? "z-50" : "z-0"}`}
      data-stop-id={stop.id}
      drag={isRouteEditing ? "y" : false}
      dragControls={dragControls}
      dragListener={false}
      value={stop.id}
      whileDrag={{
        boxShadow:
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        scale: 1.03,
      }}
    >
      <StopTimelineItem
        dragControls={dragControls}
        isActive={isActive}
        isRouteEditing={isRouteEditing}
        onSelect={onSelect}
        order={order}
        stop={stop}
      />
    </Reorder.Item>
  );
}

function StopTimelineItem({
  dragControls,
  isActive,
  onSelect,
  order,
  stop,
  isRouteEditing,
}: {
  dragControls: ReturnType<typeof useDragControls>;
  isActive: boolean;
  onSelect: () => void;
  order: number;
  stop: CourseStop;
  isRouteEditing?: boolean;
}) {
  return (
    <div
      className={`w-full ${isRouteEditing ? "cursor-default" : "cursor-pointer"}`}
      onClick={() => {
        if (isRouteEditing) return;
        onSelect();
      }}
      onKeyDown={(event) => {
        if (isRouteEditing) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={isRouteEditing ? -1 : 0}
    >
      {!isRouteEditing && stop.distanceFromPrevious ? (
        <div className="mb-2 flex items-center justify-center gap-2 text-[0.7rem] font-black text-[#8B857C]">
          <span className="h-px w-10 bg-[#DEDAD2]" />
          <span className="rounded-full bg-white px-2.5 py-1 shadow-[0_4px_12px_rgba(31,38,35,0.04)]">
            {stop.distanceFromPrevious}
          </span>
          <span className="h-px w-10 bg-[#DEDAD2]" />
        </div>
      ) : null}
      <article
        className={`mb-5 rounded-[22px] bg-white p-3.5 shadow-[0_12px_28px_rgba(31,38,35,0.07)] transition ${
          isActive ? "ring-2 ring-[#FD4003]/20" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            alt=""
            className="size-[86px] flex-none rounded-[18px] object-cover"
            loading="lazy"
            src={stop.imageUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-7 flex-none place-items-center rounded-full bg-[#FD4003] text-[0.8rem] font-black text-white">
                {order}
              </span>
              <h3 className="m-0 truncate text-[1rem] font-black text-[#111111]">
                {stop.title}
              </h3>
            </div>
            <p className="mt-1.5 mb-0 truncate text-xs font-black text-[#807A73]">
              {stop.category}
            </p>
            <p className="mt-1 mb-0 line-clamp-2 text-xs leading-normal font-bold text-[#716C65]">
              {stop.description}
            </p>
          </div>
          {isRouteEditing && (
            <button
              aria-label={`${stop.title} 순서 변경`}
              className="grid size-9 flex-none touch-none place-items-center rounded-full border border-[#ECE8E1] bg-[#FAF9F7] p-0 text-[#9C978F] cursor-grab active:cursor-grabbing"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                dragControls.start(event);
              }}
              type="button"
            >
              <GripVertical size={18} />
            </button>
          )}
        </div>
      </article>
    </div>
  );
}
