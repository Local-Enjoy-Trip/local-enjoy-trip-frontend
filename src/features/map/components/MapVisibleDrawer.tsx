import { getAttractionDetail } from "@/features/attractions/attractionApi";
import { appendCourseItem, createCourse, getMyCourses, type CourseItemRequest, type CourseResponse } from "@/features/course/courseApi";
import { normalizeCourseTags } from "@/features/course/courseTags";
import { getNote } from "@/features/notes/noteApi";
import { resolveNoteImageSrc } from "@/features/notes/noteImage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Crosshair, Heart, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { MapPoint } from "../types";
import { getNeighborhoodLabel, MapListCard } from "./MapListCard";

export type DrawerSnap = "hidden" | "default" | "full";
type DrawerTab = "place" | "note";

const SNAP_ORDER: DrawerSnap[] = ["full", "default", "hidden"];
const listBatchSize = 20;
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

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
  mode = "default",
  onConfirmPoint,
  onRequestLocation,
  onSelectPoint,
  onSnapChange,
  onToggleSave,
  preferredTab,
  selectedPoint,
  visiblePoints,
}: {
  drawerSnap: DrawerSnap;
  mode?: "default" | "course-add";
  onConfirmPoint?: (point: MapPoint) => void;
  onRequestLocation: () => void;
  onSelectPoint: (point: MapPoint) => void;
  onSnapChange: (snap: DrawerSnap) => void;
  onToggleSave: (point: MapPoint) => void;
  preferredTab?: DrawerTab;
  selectedPoint: MapPoint | null;
  visiblePoints: MapPoint[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const myCoursesQuery = useQuery({
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    staleTime: 30_000,
  });
  const myCourses = myCoursesQuery.data ?? [];
  const drawerRef = useRef<HTMLElement>(null);
  const pointCardRefs = useRef(new Map<string, HTMLDivElement>());
  const lastAutoFocusedPointIdRef = useRef<string | null>(null);
  const dragStartRef = useRef({ offset: 0, time: 0, y: 0 });
  const dragOffsetRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);
  const dragStartedFromHandleRef = useRef(false);
  const suppressClickAfterDragRef = useRef(false);
  const [courseTarget, setCourseTarget] = useState<MapPoint | null>(null);
  const [courseNotice, setCourseNotice] = useState<string | null>(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDate, setNewCourseDate] = useState(() => formatDateInputValue(new Date()));
  const [isDateUndecided, setIsDateUndecided] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [drawerHeight, setDrawerHeight] = useState(0);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<DrawerTab>("place");
  const [tabDirection, setTabDirection] = useState(1);
  const [detailDismissedId, setDetailDismissedId] = useState<string | null>(null);
  const [pendingScrollPointId, setPendingScrollPointId] = useState<string | null>(null);
  const [visibleItemCount, setVisibleItemCount] = useState(listBatchSize);
  const canStartDrawerDragRef = useRef(false);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;

    const updateDrawerHeight = () => setDrawerHeight(drawer.clientHeight);
    updateDrawerHeight();
    const resizeObserver = new ResizeObserver(updateDrawerHeight);
    resizeObserver.observe(drawer);
    window.addEventListener("resize", updateDrawerHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDrawerHeight);
    };
  }, []);

  const hasSelectedPoint = selectedPoint !== null;
  const effectiveDrawerHeight =
    drawerHeight || Math.max(0, window.innerHeight - 196);
  const restingOffset = effectiveDrawerHeight
    ? getSnapOffset(drawerSnap, effectiveDrawerHeight, hasSelectedPoint)
    : 0;
  const currentOffset = dragOffset ?? restingOffset;
  const allVisibleNotes = useMemo(
    () => visiblePoints.filter((point) => point.kind === "spot"),
    [visiblePoints],
  );
  const allVisiblePlaces = useMemo(
    () => visiblePoints.filter((point) => point.kind === "place"),
    [visiblePoints],
  );
  const visibleNotes = allVisibleNotes.slice(0, visibleItemCount);
  const visiblePlaces = allVisiblePlaces.slice(0, visibleItemCount);
  const visiblePointKey = visiblePoints.map((point) => point.id).join("|");

  useEffect(() => {
    setVisibleItemCount(listBatchSize);
    setPendingScrollPointId(null);
  }, [visiblePointKey]);

  useEffect(() => {
    if (!preferredTab) return;

    setTabDirection(preferredTab === "note" ? 1 : -1);
    setActiveTab(preferredTab);
  }, [preferredTab]);

  useEffect(() => {
    if (
      activeTab === "place" &&
      allVisiblePlaces.length === 0 &&
      allVisibleNotes.length > 0
    ) {
      setActiveTab("note");
      setTabDirection(1);
    } else if (
      activeTab === "note" &&
      allVisibleNotes.length === 0 &&
      allVisiblePlaces.length > 0
    ) {
      setActiveTab("place");
      setTabDirection(-1);
    }
  }, [activeTab, allVisibleNotes.length, allVisiblePlaces.length]);

  useEffect(() => {
    if (selectedPoint?.kind !== "spot") {
      lastAutoFocusedPointIdRef.current = null;
      return;
    }

    if (lastAutoFocusedPointIdRef.current === selectedPoint.id) return;

    const selectedIndex = allVisibleNotes.findIndex(
      (point) => point.id === selectedPoint.id,
    );
    if (selectedIndex < 0) return;

    lastAutoFocusedPointIdRef.current = selectedPoint.id;

    if (selectedIndex >= visibleItemCount) {
      setVisibleItemCount(selectedIndex + 1);
    }
    setTabDirection(1);
    setActiveTab("note");
    const frame = window.requestAnimationFrame(() => {
      pointCardRefs.current.get(selectedPoint.id)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [allVisibleNotes, selectedPoint, visibleItemCount]);

  useEffect(() => {
    if (!pendingScrollPointId) return;

    const frame = window.requestAnimationFrame(() => {
      pointCardRefs.current.get(pendingScrollPointId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: activeTab === "note" ? "center" : "nearest",
      });
      setPendingScrollPointId(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, pendingScrollPointId, visibleItemCount]);

  function changeTab(nextTab: DrawerTab) {
    if (nextTab === activeTab) return;
    setTabDirection(nextTab === "note" ? 1 : -1);
    setActiveTab(nextTab);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!effectiveDrawerHeight) return;

    const target = event.target as HTMLElement;
    const isHandle = target.closest("[data-map-drawer-handle]") !== null;

    canStartDrawerDragRef.current = isHandle;
    if (!canStartDrawerDragRef.current) return;

    dragStartedFromHandleRef.current = isHandle;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragMovedRef.current = false;
    dragStartRef.current = {
      offset: restingOffset,
      time: performance.now(),
      y: event.clientY,
    };
    dragOffsetRef.current = restingOffset;
    setDragOffset(restingOffset);
  }

  const updateDrag = useCallback(
    (clientY: number) => {
      if (dragOffsetRef.current === null) return;

      const distance = clientY - dragStartRef.current.y;
      if (Math.abs(distance) > 3) {
        dragMovedRef.current = true;
      }

      const nextOffset = Math.min(
        effectiveDrawerHeight + 24,
        Math.max(0, dragStartRef.current.offset + distance),
      );
      dragOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    },
    [effectiveDrawerHeight],
  );

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    updateDrag(event.clientY);
  }

  const finishDrag = useCallback(
    (clientY: number) => {
      const finalOffset = dragOffsetRef.current;
      if (finalOffset === null) return;

      const distance = clientY - dragStartRef.current.y;
      const elapsed = Math.max(1, performance.now() - dragStartRef.current.time);
      const velocity = distance / elapsed;
      const currentIndex = SNAP_ORDER.indexOf(drawerSnap);
      let nextSnap: DrawerSnap;

      if (
        !dragMovedRef.current &&
        Math.abs(distance) <= 3 &&
        dragStartedFromHandleRef.current
      ) {
        nextSnap = drawerSnap === "full" ? "default" : "full";
      } else if (!dragMovedRef.current && Math.abs(distance) <= 3) {
        nextSnap = drawerSnap;
      } else if (Math.abs(velocity) > 0.45 && Math.abs(distance) > 18) {
        const direction = velocity > 0 ? 1 : -1;
        nextSnap =
          SNAP_ORDER[
            Math.min(SNAP_ORDER.length - 1, Math.max(0, currentIndex + direction))
          ];
      } else {
        nextSnap = SNAP_ORDER.reduce((nearest, snap) => {
          const nearestDistance = Math.abs(
            finalOffset -
              getSnapOffset(nearest, effectiveDrawerHeight, hasSelectedPoint),
          );
          const snapDistance = Math.abs(
            finalOffset - getSnapOffset(snap, effectiveDrawerHeight, hasSelectedPoint),
          );
          return snapDistance < nearestDistance ? snap : nearest;
        }, SNAP_ORDER[0]);
      }

      dragOffsetRef.current = null;
      setDragOffset(null);
      onSnapChange(nextSnap);
      suppressClickAfterDragRef.current = dragMovedRef.current;
      dragMovedRef.current = false;
      canStartDrawerDragRef.current = false;
      dragStartedFromHandleRef.current = false;
      window.setTimeout(() => {
        suppressClickAfterDragRef.current = false;
      }, 0);
    },
    [drawerSnap, effectiveDrawerHeight, hasSelectedPoint, onSnapChange],
  );

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    finishDrag(event.clientY);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLElement>) {
    finishDrag(event.clientY);
  }

  function handleHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    handlePointerDown(event);
  }

  function handleHandlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    handlePointerMove(event);
  }

  function handleHandlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    handlePointerUp(event);
  }

  function handleHandlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    handlePointerCancel(event);
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if (!suppressClickAfterDragRef.current) return;

    event.preventDefault();
    event.stopPropagation();
  }

  useEffect(() => {
    if (dragOffset === null) return;

    const handleWindowPointerMove = (event: PointerEvent) => {
      event.preventDefault();
      updateDrag(event.clientY);
    };
    const handleWindowPointerUp = (event: PointerEvent) => {
      finishDrag(event.clientY);
    };

    window.addEventListener("pointermove", handleWindowPointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [dragOffset, finishDrag, updateDrag]);

  function openCourseSelector(point: MapPoint) {
    if (mode === "course-add") {
      onConfirmPoint?.(point);
      return;
    }

    setCourseNotice(null);
    setCourseTarget(point);
    setIsCreatingCourse(false);
    setNewCourseTitle(`${point.name} 코스`);
    setNewCourseDate(formatDateInputValue(new Date()));
    setIsDateUndecided(false);
    setCalendarMonth(startOfMonth(new Date()));
  }

  function openPointDetail(point: MapPoint) {
    setDetailDismissedId(null);
    onSelectPoint(point);
    onSnapChange("full");
  }

  function showMoreItems() {
    const activeItems = activeTab === "note" ? allVisibleNotes : allVisiblePlaces;
    const firstNewItem = activeItems[visibleItemCount];

    setVisibleItemCount((current) => current + listBatchSize);
    if (firstNewItem) {
      setPendingScrollPointId(firstNewItem.id);
    }
  }

  async function addToExistingCourse(courseId: string, courseTitle: string) {
    if (!courseTarget) return;

    const item = toCourseItem(courseTarget);
    if (!item) {
      setCourseNotice("장소 정보를 읽을 수 없어요.");
      return;
    }

    setIsSubmittingCourse(true);
    const updated = await appendCourseItem(courseId, item).catch(() => null);
    setIsSubmittingCourse(false);

    if (!updated) {
      setCourseNotice("코스에 추가하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    queryClient.setQueryData<CourseResponse[]>(["courses", "me"], (prev) =>
      prev
        ? prev.map((c) => (c.id === updated.id ? updated : c))
        : [updated],
    );
    setCourseNotice(`${courseTarget.name}을(를) ${courseTitle}에 추가했어요.`);
    setCourseTarget(null);
  }

  function createCourseWithTarget() {
    if (!courseTarget) return;

    setCourseNotice(null);
    setIsCreatingCourse(true);
    setNewCourseTitle((current) => current || `${courseTarget.name} 코스`);
  }

  async function submitNewCourse() {
    if (!courseTarget || isSubmittingCourse) return;

    const title = newCourseTitle.trim() || `${courseTarget.name} 코스`;
    const courseItem = toCourseItem(courseTarget);
    const course = {
      id: `map-${Date.now()}`,
      items: courseItem ? [courseItem] : [],
      regionName: getCourseArea(courseTarget),
      status: "READY",
      tags: normalizeCourseTags(
        courseTarget.kind === "place"
          ? courseTarget.source.tags
          : [getCourseArea(courseTarget), "쪽지"],
        getCourseArea(courseTarget),
      ),
      title,
      visibility: "PRIVATE",
    };

    setIsSubmittingCourse(true);
    const createdCourse = await createCourse(course).catch(() => null);
    setIsSubmittingCourse(false);
    if (!createdCourse) {
      setCourseNotice("코스를 서버에 저장하지 못했어요.");
      return;
    }
    setCourseNotice(`${title} 코스를 만들었어요.`);
    setCourseTarget(null);
    setIsCreatingCourse(false);
    setNewCourseTitle("");
    queryClient.setQueryData<CourseResponse[]>(["courses", "me"], (courses) =>
      courses
        ? [createdCourse, ...courses.filter((item) => item.id !== createdCourse.id)]
        : [createdCourse],
    );
    navigate(`/course/${createdCourse.id}`, {
      state: { createdAsMyCourse: true, createdCourseId: createdCourse.id },
    });
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
      onClickCapture={handleClickCapture}
      ref={drawerRef}
      style={drawerStyle}
    >
      <div
        className={`absolute -top-[72px] right-4 transition-opacity duration-200 ${
          drawerSnap === "full"
            ? "pointer-events-none opacity-0"
            : "pointer-events-auto opacity-100"
        }`}
      >
        <button
          aria-label="현재 위치로 지도 이동"
          className="grid size-10 touch-manipulation select-none place-items-center rounded-full border border-black/5 bg-white text-[#1e2a26] shadow-[0_6px_15px_rgba(17,17,17,0.16)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
          onClick={onRequestLocation}
          type="button"
        >
          <Crosshair size={18} strokeWidth={2.4} />
        </button>
      </div>

      <button
        aria-expanded={drawerSnap === "full"}
        aria-label={
          drawerSnap === "full" ? "드로어 기본 높이로 내리기" : "드로어 전체로 펼치기"
        }
        className="mx-auto block h-10 w-full cursor-grab touch-none border-0 bg-transparent active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FD4003]"
        data-map-drawer-handle
        onPointerCancel={handleHandlePointerCancel}
        onPointerDown={handleHandlePointerDown}
        onPointerMove={handleHandlePointerMove}
        onPointerUp={handleHandlePointerUp}
        style={{ touchAction: "none" }}
        type="button"
      >
        <span className="mx-auto mt-1.5 block h-1 w-11 rounded-full bg-[#cfcfcf]" />
      </button>

      <div
        className="h-[calc(100%-40px)] touch-pan-y overflow-y-auto bg-white px-4 pt-0"
        data-map-drawer-scroller
        style={{
          paddingBottom: `calc(${currentOffset + 16}px + env(safe-area-inset-bottom))`,
        }}
      >
        {courseNotice ? (
          <p className="mb-3 rounded-xl bg-[#fff1ec] px-3 py-2.5 text-sm font-extrabold text-[#C83200]">
            {courseNotice}
          </p>
        ) : null}
        {courseTarget ? (
          <div>
            <div className="mb-4 flex items-start gap-3">
              <button
                aria-label="장소 목록으로 돌아가기"
                className="grid size-9 flex-none place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#4B4741] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
                onClick={() => {
                  if (isCreatingCourse) {
                    setIsCreatingCourse(false);
                    return;
                  }
                  setCourseTarget(null);
                }}
                type="button"
              >
                <ChevronLeft size={19} />
              </button>
              <div className="min-w-0">
                <p className="m-0 text-xs font-black text-[#6A665F]">
                  {isCreatingCourse ? "새 코스 만들기" : "추가할 코스 선택"}
                </p>
                <h2 className="m-0 mt-1 truncate text-lg font-black text-[#171717]">
                  {courseTarget.name}
                </h2>
              </div>
            </div>

            {isCreatingCourse ? (
              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-black text-[#6A665F]">
                    코스 이름
                  </span>
                  <input
                    className="h-12 rounded-2xl border border-[#E7E1D8] bg-[#FAF9F6] px-4 text-sm font-black text-[#171717] outline-none transition focus:border-[#FD4003] focus:bg-white"
                    maxLength={30}
                    onChange={(event) => setNewCourseTitle(event.target.value)}
                    placeholder={`${courseTarget.name} 코스`}
                    value={newCourseTitle}
                  />
                </label>

                <CourseDateCalendar
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelectDate={(date) => {
                    setNewCourseDate(date);
                    setIsDateUndecided(false);
                  }}
                  onToggleUndecided={() =>
                    setIsDateUndecided((current) => !current)
                  }
                  selectedDate={newCourseDate}
                  undecided={isDateUndecided}
                />

                <button
                  aria-label={`${newCourseTitle.trim() || courseTarget.name} 코스 생성하기`}
                  className="mt-1 h-12 rounded-2xl border-0 bg-[#1F3D35] text-sm font-black text-white shadow-[0_10px_22px_rgba(31,61,53,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
                  disabled={isSubmittingCourse}
                  onClick={submitNewCourse}
                  type="button"
                >
                  코스 생성하기
                </button>
              </div>
            ) : (
              <div className="grid gap-2">
              {myCourses.length === 0 && !myCoursesQuery.isLoading ? (
                <p className="rounded-2xl bg-[#F7F6F3] px-4 py-4 text-center text-xs font-bold text-[#817A71]">
                  아직 만든 코스가 없어요.
                </p>
              ) : (
                <div className="max-h-[280px] overflow-y-auto grid gap-2 pr-0.5">
                  {myCourses.map((course) => (
                    <button
                      aria-label={`${course.title}에 ${courseTarget.name} 추가`}
                      className="flex items-center gap-3 rounded-xl border border-[#EEEAE2] bg-white p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
                      disabled={isSubmittingCourse}
                      key={course.id}
                      onClick={() => addToExistingCourse(course.id, course.title)}
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
                          {course.regionName ?? "로컬"} · {course.items.length}개 장소
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button
                aria-label={`${courseTarget.name}으로 새 코스 만들기`}
                className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-[#D8D3C9] bg-[#FAF9F6] p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
                onClick={createCourseWithTarget}
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
            )}
          </div>
        ) : visiblePoints.length > 0 ? (
          <div>
            <div className="sticky top-0 z-40 -mx-4 mb-3 bg-white px-4 pt-1 pb-2">
              {mode === "course-add" ? (
                <p className="mt-0 mb-2 rounded-xl bg-[#EEF4EF] px-3 py-2 text-xs font-black text-[#1F3D35]">
                  장소나 쪽지를 하나 선택한 뒤 코스에 넣어주세요.
                </p>
              ) : null}
              <div
                aria-label="지도 목록 종류"
                className="grid grid-cols-2 rounded-2xl bg-white p-1"
                role="tablist"
              >
                {([
                  ["place", "장소", allVisiblePlaces.length],
                  ["note", "쪽지", allVisibleNotes.length],
                ] as const).map(([value, label, count]) => (
                  <button
                    aria-controls={`map-drawer-${value}-panel`}
                    aria-selected={activeTab === value}
                    className={`h-10 rounded-xl text-sm font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003] ${
                      activeTab === value
                        ? "bg-white text-[#171717]"
                        : "bg-transparent text-[#888178]"
                    }`}
                    id={`map-drawer-${value}-tab`}
                    key={value}
                    onClick={() => changeTab(value)}
                    role="tab"
                    type="button"
                  >
                    {label} <span className="text-[11px]">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence custom={tabDirection} initial={false} mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                aria-labelledby={`map-drawer-${activeTab}-tab`}
                className="min-h-[280px]"
                custom={tabDirection}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                exit={{ opacity: 0, x: tabDirection > 0 ? -36 : 36 }}
                initial={{ opacity: 0, x: tabDirection > 0 ? 36 : -36 }}
                key={activeTab}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -45) changeTab("note");
                  if (info.offset.x > 45) changeTab("place");
                }}
                id={`map-drawer-${activeTab}-panel`}
                role="tabpanel"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === "note" ? (
                  allVisibleNotes.length > 0 ? (
                    <section aria-label="쪽지 목록" className="-mx-4">
                      <div className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {visibleNotes.map((point) => (
                          <div
                            className="snap-center"
                            key={point.id}
                            ref={(element) => {
                              if (element) pointCardRefs.current.set(point.id, element);
                              else pointCardRefs.current.delete(point.id);
                            }}
                          >
                            <MapListCard
                              point={point}
                              onAddToCourse={openCourseSelector}
                              onSelect={() => openPointDetail(point)}
                              onToggleSave={onToggleSave}
                              selected={selectedPoint?.id === point.id}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <EmptyTabMessage label="쪽지" />
                  )
                ) : allVisiblePlaces.length > 0 ? (
                  <div className="grid gap-2.5">
                    {visiblePlaces.map((point) => (
                      <div
                        key={point.id}
                        ref={(element) => {
                          if (element) pointCardRefs.current.set(point.id, element);
                          else pointCardRefs.current.delete(point.id);
                        }}
                      >
                        <MapListCard
                          point={point}
                          onAddToCourse={openCourseSelector}
                          onSelect={() => openPointDetail(point)}
                          onToggleSave={onToggleSave}
                          selected={selectedPoint?.id === point.id}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyTabMessage label="장소" />
                )}
              </motion.div>
            </AnimatePresence>

            {(activeTab === "note"
              ? allVisibleNotes.length
              : allVisiblePlaces.length) > visibleItemCount ? (
              <button
                aria-label={`${activeTab === "note" ? "쪽지" : "장소"} 더 보기`}
                className="mt-3 h-11 w-full rounded-xl border border-[#E6E1D8] bg-white text-sm font-black text-[#514D47] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
                onClick={showMoreItems}
                type="button"
              >
                더 보기
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F6F5F1] p-4 text-sm font-bold text-[#6d665d]">
            검색어나 필터에 맞는 장소가 지도 안에 없어요.
          </div>
        )}
      </div>

      {selectedPoint && detailDismissedId !== selectedPoint.id && !courseTarget ? (
        <div className="absolute inset-x-0 top-10 bottom-0 z-50 overflow-y-auto bg-white px-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <PointDetailPanel
            onAddToCourse={openCourseSelector}
            onBack={() => setDetailDismissedId(selectedPoint.id)}
            onToggleSave={onToggleSave}
            point={selectedPoint}
            confirmLabel={mode === "course-add" ? "코스에 넣기" : undefined}
          />
        </div>
      ) : null}
    </aside>
  );
}

function CourseDateCalendar({
  month,
  onMonthChange,
  onSelectDate,
  onToggleUndecided,
  selectedDate,
  undecided,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
  onToggleUndecided: () => void;
  selectedDate: string;
  undecided: boolean;
}) {
  const days = getCalendarDays(month);
  const monthLabel = new Intl.DateTimeFormat("ko", {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <section className="rounded-2xl border border-[#ECE6DC] bg-[#FAF9F6] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 flex-none place-items-center rounded-xl bg-white text-[#FD4003]">
            <CalendarDays size={17} strokeWidth={2.4} />
          </span>
          <strong className="truncate text-sm font-black text-[#171717]">
            {monthLabel}
          </strong>
        </div>
        <div className="flex flex-none items-center gap-1">
          <button
            aria-label="이전 달"
            className="grid size-8 place-items-center rounded-full border-0 bg-white text-[#514D47] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
            onClick={() => onMonthChange(addMonths(month, -1))}
            type="button"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            aria-label="다음 달"
            className="grid size-8 place-items-center rounded-full border-0 bg-white text-[#514D47] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
            onClick={() => onMonthChange(addMonths(month, 1))}
            type="button"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <button
        aria-label="날짜 미정 선택"
        aria-pressed={undecided}
        className={`mt-3 h-10 w-full rounded-xl border text-xs font-black transition ${
          undecided
            ? "border-[#1F3D35] bg-[#1F3D35] text-white"
            : "border-[#E3DDD3] bg-white text-[#68625B]"
        }`}
        onClick={onToggleUndecided}
        type="button"
      >
        날짜 미정
      </button>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {weekdayLabels.map((label) => (
          <span
            className="py-1 text-[11px] font-black text-[#8B857C]"
            key={label}
          >
            {label}
          </span>
        ))}
        {days.map((date, index) => {
          if (!date) {
            return <span aria-hidden="true" key={`blank-${index}`} />;
          }

          const dateValue = formatDateInputValue(date);
          const selected = !undecided && selectedDate === dateValue;
          const today = dateValue === formatDateInputValue(new Date());

          return (
            <button
              aria-label={`${dateValue} 선택`}
              aria-pressed={selected}
              className={`grid aspect-square place-items-center rounded-xl text-xs font-black transition ${
                selected
                  ? "bg-[#FD4003] text-white shadow-[0_7px_14px_rgba(253,64,3,0.22)]"
                  : today
                    ? "bg-white text-[#FD4003]"
                    : "bg-transparent text-[#2E2A25]"
              }`}
              key={dateValue}
              onClick={() => onSelectDate(dateValue)}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PointDetailPanel({
  confirmLabel = "코스",
  onAddToCourse,
  onBack,
  onToggleSave,
  point,
}: {
  confirmLabel?: string;
  onAddToCourse: (point: MapPoint) => void;
  onBack: () => void;
  onToggleSave: (point: MapPoint) => void;
  point: MapPoint;
}) {
  const isPlace = point.kind === "place";
  const attractionId = isPlace ? getNumericPointId(point.id) : null;
  const noteId = !isPlace ? getNumericPointId(point.id) : null;
  const attractionDetailQuery = useQuery({
    enabled: attractionId !== null,
    queryFn: () => getAttractionDetail(attractionId ?? 0),
    queryKey: ["attraction", "detail", attractionId],
  });
  const noteDetailQuery = useQuery({
    enabled: noteId !== null,
    queryFn: () => getNote(noteId ?? 0),
    queryKey: ["notes", "detail", noteId],
  });
  const imageUrl = isPlace
    ? point.source.imageUrl
    : (noteDetailQuery.data ? resolveNoteImageSrc(noteDetailQuery.data) : null) ||
      point.source.imageUrl;
  const title = (isPlace ? point.name : point.source.placeName) || point.name;
  const fullLocation = isPlace ? point.source.area : point.source.placeName;
  const neighborhood = getNeighborhoodLabel(fullLocation);
  const tags = isPlace ? point.source.tags : [getNoteVisibilityLabel(point.source.visibility)];
  const summary = isPlace ? point.source.summary : point.source.body;
  const detailText =
    attractionDetailQuery.data?.detail?.trim() ||
    attractionDetailQuery.data?.overview?.trim() ||
    (isPlace && summary.trim() !== fullLocation.trim() ? summary.trim() : "");
  const favoriteCount = getFavoriteCount(point);
  const [primaryTag, ...secondaryTags] = tags;
  const authorName = !isPlace ? point.authorName?.trim() || "익명" : "";

  return (
    <article className="pb-4">
      <div className="sticky top-0 z-10 -mx-4 mb-4 grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 bg-white px-4 pt-4 pb-3">
        <button
          aria-label="목록으로 돌아가기"
          className="grid size-9 flex-none place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#4B4741] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft size={19} />
        </button>
        <div className="min-w-0">
          <h2 className="m-0 min-w-0 truncate text-xl leading-none font-black text-[#171717]">
            {title}
          </h2>
          {primaryTag ? (
            <span className="mt-1.5 block truncate text-[11px] font-black text-[#8B857C]">
              {primaryTag}
            </span>
          ) : null}
        </div>
        <div className="flex flex-none items-start gap-4">
          <button
            aria-label={point.saved ? "저장 해제" : "저장"}
            aria-pressed={point.saved}
            className="grid min-w-7 place-items-center border-0 bg-transparent text-[#FD4003] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
            onClick={() => onToggleSave(point)}
            type="button"
          >
            <Heart size={20} fill={point.saved ? "#FD4003" : "none"} strokeWidth={2.3} />
            <span className="mt-1 text-[10px] leading-none font-black">
              {favoriteCount}
            </span>
          </button>
          <button
            aria-label="코스에 추가하기"
            className="grid min-w-7 place-items-center border-0 bg-transparent text-[#171717] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FD4003]"
            onClick={() => onAddToCourse(point)}
            type="button"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="mt-1 text-[10px] leading-none font-black">
              {confirmLabel}
            </span>
          </button>
        </div>
      </div>

      {isPlace ? (
        <>
          {imageUrl ? (
            <img
              alt=""
              className="h-44 w-full rounded-2xl object-cover"
              loading="lazy"
              src={imageUrl}
            />
          ) : null}
          <p className={`${imageUrl ? "mt-4" : "mt-0"} mb-0 text-sm font-bold text-[#746F67]`}>
            {neighborhood} · {fullLocation}
          </p>
        </>
      ) : (
        <div className="flex items-center gap-3">
          {point.authorAvatarUrl ? (
            <img
              alt=""
              className="size-10 rounded-full object-cover"
              loading="lazy"
              src={point.authorAvatarUrl}
            />
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-[#111] text-sm font-black text-white">
              {authorName.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <strong className="block truncate text-sm font-black text-[#171717]">
              {authorName}
            </strong>
            <span className="mt-0.5 block truncate text-xs font-bold text-[#746F67]">
              {fullLocation}
              {point.source.createdAt
                ? ` · ${formatRelativeTime(point.source.createdAt)}`
                : ""}
            </span>
          </div>
        </div>
      )}

      {!isPlace && imageUrl ? (
        <img
          alt=""
          className="mt-4 h-44 w-full rounded-2xl bg-[#F4F3EF] object-contain"
          loading="lazy"
          src={imageUrl}
        />
      ) : null}

      <div className="mt-4">
        {secondaryTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {secondaryTags.map((tag) => (
            <span
              className="rounded-full bg-[#F4F3EF] px-2.5 py-1 text-[11px] font-black text-[#5E5850]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        ) : null}

        {isPlace ? (
          <p className={`${secondaryTags.length > 0 ? "mt-4" : "mt-0"} mb-0 whitespace-pre-wrap text-sm leading-relaxed font-semibold text-[#49443E]`}>
            <span className="font-black text-[#171717]">상세 내용: </span>
            {attractionDetailQuery.isLoading
              ? "불러오는 중이에요."
              : detailText || "등록된 상세 내용이 없어요."}
          </p>
        ) : (
          <p className={`${secondaryTags.length > 0 ? "mt-4" : "mt-0"} mb-0 whitespace-pre-wrap text-sm leading-relaxed font-semibold text-[#49443E]`}>
            {summary}
          </p>
        )}
      </div>
    </article>
  );
}

function EmptyTabMessage({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-[#F6F5F1] p-4 text-sm font-bold text-[#6d665d]">
      현재 지도 영역에 표시할 {label}가 없어요.
    </div>
  );
}

function getNoteVisibilityLabel(
  visibility: Extract<MapPoint, { kind: "spot" }>["source"]["visibility"],
) {
  if (visibility === "private") return "나만 보기";
  if (visibility === "friends") return "친구 공개";
  return "공개 쪽지";
}

function getFavoriteCount(point: MapPoint) {
  return point.source.favoriteCount;
}

function toCourseItem(point: MapPoint): CourseItemRequest | null {
  const numericId = getNumericPointId(point.id);
  if (numericId === null) return null;

  return {
    attractionId: point.kind === "place" ? numericId : undefined,
    day: 1,
    itemType: point.kind === "place" ? "ATTRACTION" : "NOTE",
    memo: point.kind === "spot" ? point.source.body : undefined,
    noteId: point.kind === "spot" ? numericId : undefined,
    position: 1,
    stayMinutes: 60,
  };
}

function getCourseArea(point: MapPoint) {
  return point.kind === "place"
    ? getNeighborhoodLabel(point.source.area)
    : getNeighborhoodLabel(point.source.placeName);
}

function getNumericPointId(id: string) {
  const match = id.match(/\d+$/);
  const value = match ? Number(match[0]) : null;
  return value !== null && Number.isFinite(value) ? value : null;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getCalendarDays(month: Date) {
  const firstDay = startOfMonth(month);
  const dayCount = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const blanks = Array.from<null>({ length: firstDay.getDay() }).fill(null);
  const dates = Array.from({ length: dayCount }, (_, index) =>
    new Date(month.getFullYear(), month.getMonth(), index + 1),
  );

  return [...blanks, ...dates];
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatRelativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "방금 전";

  const seconds = Math.round((timestamp - Date.now()) / 1_000);
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }

  return formatter.format(seconds, "second");
}
