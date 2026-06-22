import {
  ArrowLeft,
  CheckSquare,
  ChevronRight,
  Download,
  Link2,
  Map as MapIcon,
  Plane,
  Plus,
  ReceiptText,
  Star,
  Upload,
  UserPlus,
  UsersRound,
  WandSparkles,
  WalletCards,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Coordinates } from "@/shared/types/domain";
import {
  getSavedCourse,
  updateCourseCollaborators,
} from "@/features/course/courseStorage";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import type {
  KakaoCustomOverlay,
  KakaoMapInstance,
  KakaoPolyline,
} from "@/features/map/types";

type CourseStop = {
  id: number;
  accent: "violet" | "coral" | "mint";
  category: string;
  coordinates: Coordinates;
  distanceFromPrevious?: string;
  location: string;
  title: string;
};

const HEADER_EXPANDED_HEIGHT = 307;
const HEADER_COMPACT_HEIGHT = 74;
const HEADER_COLLAPSE_DISTANCE = HEADER_EXPANDED_HEIGHT - HEADER_COMPACT_HEIGHT;
const DRAWER_COLLAPSED_TOP = 236;

const defaultStops: CourseStop[] = [
  {
    id: 1,
    accent: "violet",
    category: "시장 · 망원",
    coordinates: { lat: 37.5567, lng: 126.9057 },
    location: "망원",
    title: "망원시장",
  },
  {
    id: 2,
    accent: "violet",
    category: "골목 산책 · 망원",
    coordinates: { lat: 37.5562, lng: 126.9049 },
    distanceFromPrevious: "650m",
    location: "망원",
    title: "망원시장 골목",
  },
  {
    id: 3,
    accent: "coral",
    category: "공원 · 한강",
    coordinates: { lat: 37.5545, lng: 126.897 },
    distanceFromPrevious: "1.2km",
    location: "망원",
    title: "망원한강공원 입구",
  },
  {
    id: 4,
    accent: "mint",
    category: "노을 산책 · 한강",
    coordinates: { lat: 37.5548, lng: 126.8959 },
    distanceFromPrevious: "480m",
    location: "망원",
    title: "한강 산책로",
  },
  {
    id: 5,
    accent: "violet",
    category: "소품 · 망원",
    coordinates: { lat: 37.5569, lng: 126.9036 },
    distanceFromPrevious: "320m",
    location: "망원",
    title: "망원 소품샵 거리",
  },
  {
    id: 6,
    accent: "coral",
    category: "카페 · 망원",
    coordinates: { lat: 37.5574, lng: 126.9027 },
    distanceFromPrevious: "210m",
    location: "망원",
    title: "골목 카페",
  },
  {
    id: 7,
    accent: "violet",
    category: "책방 · 망원",
    coordinates: { lat: 37.5582, lng: 126.9042 },
    distanceFromPrevious: "430m",
    location: "망원",
    title: "동네 책방",
  },
  {
    id: 8,
    accent: "mint",
    category: "디저트 · 망원",
    coordinates: { lat: 37.5578, lng: 126.9062 },
    distanceFromPrevious: "380m",
    location: "망원",
    title: "망원 디저트 바",
  },
];

const accentClass = {
  coral: "bg-[#F56565] text-white",
  mint: "bg-[#49BFB0] text-white",
  violet: "bg-[#7957F2] text-white",
} satisfies Record<CourseStop["accent"], string>;

const markerColorClass = {
  coral: "is-coral",
  mint: "is-mint",
  violet: "is-violet",
} satisfies Record<CourseStop["accent"], string>;

function getRouteCenter(routeStops: CourseStop[]) {
  return routeStops.reduce(
    (center, stop) => ({
      lat: center.lat + stop.coordinates.lat / routeStops.length,
      lng: center.lng + stop.coordinates.lng / routeStops.length,
    }),
    { lat: 0, lng: 0 },
  );
}

function FallbackRouteMapPreview({ routeStops }: { routeStops: CourseStop[] }) {
  const positions = ["left-[16%] top-[64%]", "left-[37%] top-[58%]", "left-[54%] top-[40%]", "left-[76%] top-[30%]", "left-[84%] top-[60%]"];
  const markers = routeStops.slice(0, 5).map((stop, index) => ({
    id: stop.id,
    className: positions[index],
    color: stop.accent === "coral" ? "bg-[#F56565]" : stop.accent === "mint" ? "bg-[#49BFB0]" : "bg-[#7957F2]",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#DDF0E3]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.56)_0_14%,transparent_14%_100%),linear-gradient(25deg,transparent_0_47%,rgba(118,190,216,0.45)_47%_70%,transparent_70%_100%)]" />
      <div className="absolute right-[-15%] top-[-18%] h-[230px] w-[230px] rounded-full bg-[#9DD8E8]" />
      <div className="absolute left-[-18%] top-[-12%] h-[230px] w-[230px] rounded-full bg-[#CFF1D7]" />
      <div className="absolute left-[12%] top-6 h-[180px] w-2 rotate-[28deg] rounded-full bg-[#BFC9D7]" />
      <div className="absolute left-[42%] top-0 h-[200px] w-1 rotate-[58deg] rounded-full bg-[#C9D1DC]" />
      <div className="absolute left-[6%] top-[38%] h-1 w-[72%] rotate-[-9deg] rounded-full bg-[#D2D7DF]" />
      <div className="absolute left-[22%] top-[72%] h-1 w-[58%] rotate-[3deg] rounded-full bg-[#D2D7DF]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 390 235"
      >
        <path
          d="M64 154 C118 143 129 144 146 137 C174 126 185 98 211 94 C237 89 250 111 276 92 C295 78 301 66 330 58"
          fill="none"
          stroke="#343434"
          strokeDasharray="8 7"
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>

      <span className="absolute left-[7%] top-[18%] text-sm font-black text-[#64726B]">
        망원동
      </span>
      <span className="absolute left-[48%] top-[23%] text-sm font-black text-[#64726B]">
        성산동
      </span>
      <span className="absolute left-[71%] top-[48%] text-sm font-black text-[#64726B]">
        한강
      </span>

      {markers.map((marker) => (
        <span
          className={`absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${marker.color} text-base font-black text-white shadow-[0_8px_18px_rgba(31,38,35,0.22)] ${marker.className}`}
          key={marker.id}
        >
          {marker.id}
        </span>
      ))}
    </div>
  );
}

function CourseRouteMap({
  activeStopId,
  className = "",
  routeStops,
}: {
  activeStopId: number;
  className?: string;
  routeStops: CourseStop[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerElementsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const overlaysByStopIdRef = useRef<Map<number, KakaoCustomOverlay>>(new Map());
  const polylineRef = useRef<KakaoPolyline | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    loadKakaoMap().then((nextStatus) => {
      if (cancelled) return;

      if (nextStatus !== "ready") {
        setStatus(nextStatus);
        return;
      }

      if (!containerRef.current || !window.kakao) {
        setStatus("error");
        return;
      }

      try {
        const kakaoMaps = window.kakao.maps;
        const center = getRouteCenter(routeStops);
        const map = new kakaoMaps.Map(containerRef.current, {
          center: new kakaoMaps.LatLng(center.lat, center.lng),
          level: 5,
        });

        mapRef.current = map;
        setStatus("ready");

        const relayout = () => {
          map.relayout();
          map.setCenter(new kakaoMaps.LatLng(center.lat, center.lng));
        };

        window.requestAnimationFrame(relayout);
        window.setTimeout(relayout, 120);
      } catch (error) {
        console.error("Failed to initialize course route map", error);
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      polylineRef.current?.setMap(null);
    };
  }, [routeStops]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;

    if (status !== "ready" || !kakaoMaps || !map) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const overlaysByStopId = overlaysByStopIdRef.current;
    overlaysByStopId.clear();
    const markerElements = markerElementsRef.current;
    markerElements.clear();
    polylineRef.current?.setMap(null);

    const path = routeStops.map(
      (stop) => new kakaoMaps.LatLng(stop.coordinates.lat, stop.coordinates.lng),
    );
    const polyline = new kakaoMaps.Polyline({
      path,
      strokeColor: "#303030",
      strokeOpacity: 0.86,
      strokeStyle: "shortdash",
      strokeWeight: 4,
    });
    polyline.setMap(map);
    polylineRef.current = polyline;

    routeStops.forEach((stop) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "course-route-marker";
      marker.setAttribute("aria-label", `${stop.id}. ${stop.title}`);
      markerElements.set(stop.id, marker);

      const markerDot = document.createElement("span");
      markerDot.className = `course-route-marker-dot ${markerColorClass[stop.accent]}`;
      markerDot.textContent = String(stop.id);
      marker.append(markerDot);

      const overlay = new kakaoMaps.CustomOverlay({
        content: marker,
        position: new kakaoMaps.LatLng(stop.coordinates.lat, stop.coordinates.lng),
        yAnchor: 0.5,
        zIndex: 20 + stop.id,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
      overlaysByStopId.set(stop.id, overlay);
    });

    const refreshRouteOverlays = () => {
      const currentMap = mapRef.current;
      if (!currentMap) return;

      window.requestAnimationFrame(() => {
        overlaysRef.current.forEach((overlay) => {
          overlay.setMap(null);
          overlay.setMap(currentMap);
        });
        polylineRef.current?.setMap(null);
        polylineRef.current?.setMap(currentMap);
      });
    };

    kakaoMaps.event.addListener(map, "zoom_changed", refreshRouteOverlays);
    kakaoMaps.event.addListener(map, "idle", refreshRouteOverlays);

    return () => {
      kakaoMaps.event.removeListener(map, "zoom_changed", refreshRouteOverlays);
      kakaoMaps.event.removeListener(map, "idle", refreshRouteOverlays);
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      overlaysRef.current = [];
      overlaysByStopId.clear();
      markerElements.clear();
      polylineRef.current?.setMap(null);
    };
  }, [routeStops, status]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;
    const activeStop = routeStops.find((stop) => stop.id === activeStopId);

    markerElementsRef.current.forEach((marker, stopId) => {
      marker.classList.toggle("is-active", stopId === activeStopId);
    });
    overlaysByStopIdRef.current.forEach((overlay, stopId) => {
      overlay.setZIndex(stopId === activeStopId ? 1000 : 20 + stopId);
    });

    if (status !== "ready" || !kakaoMaps || !map || !activeStop) return;

    map.panTo(
      new kakaoMaps.LatLng(
        activeStop.coordinates.lat,
        activeStop.coordinates.lng,
      ),
    );
  }, [activeStopId, routeStops, status]);

  return (
    <section
      className={`relative overflow-hidden bg-[#DDF0E3] ${className}`}
      data-testid="course-route-map"
    >
      {status === "missing-key" || status === "error" ? (
        <FallbackRouteMapPreview routeStops={routeStops} />
      ) : (
        <>
          <div ref={containerRef} className="h-full w-full" />
          {status === "loading" ? (
            <div className="absolute inset-0 grid place-items-center bg-[#DDF0E3] text-sm font-black text-[#64726B]">
              경로 지도를 준비하는 중...
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function CourseRouteDrawer({
  activeStopId,
  drawerCoverOffset,
  drawerTop,
  headerOffset,
  setActiveStopId,
  setDrawerCoverOffset,
  setHeaderOffset,
  routeStops,
  onOptimize,
}: {
  activeStopId: number;
  drawerCoverOffset: number;
  drawerTop: number;
  headerOffset: number;
  setActiveStopId: Dispatch<SetStateAction<number>>;
  setDrawerCoverOffset: Dispatch<SetStateAction<number>>;
  setHeaderOffset: Dispatch<SetStateAction<number>>;
  routeStops: CourseStop[];
  onOptimize: () => void;
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
  const isExpanded = drawerTop === 0;
  const isHeaderCollapsed = headerOffset >= HEADER_COLLAPSE_DISTANCE;

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragRef.current;
      if (!dragState) return;

      const delta = event.clientY - dragState.startY;
      const nextOffset = Math.min(
        DRAWER_COLLAPSED_TOP,
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
        dragState.currentOffset < DRAWER_COLLAPSED_TOP / 2
          ? 0
          : DRAWER_COLLAPSED_TOP,
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
  }, [setDrawerCoverOffset]);

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>) {
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
      headerOffset < HEADER_COLLAPSE_DISTANCE
    ) {
      const remainingCollapse = HEADER_COLLAPSE_DISTANCE - headerOffset;
      const collapseDelta = Math.min(remainingCollapse, deltaY);

      setHeaderOffset((current) =>
        Math.min(HEADER_COLLAPSE_DISTANCE, current + collapseDelta),
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
    if (moveHeaderFromRouteScroll(event.deltaY)) {
      event.preventDefault();
    }
  }

  function handleListTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleListTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
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
    const targetY = scrollerRect.top + 10;
    const stopElements = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-stop-id]"),
    );

    const closestStopId = stopElements.reduce<number | null>(
      (closestId, element) => {
        const currentDistance = Math.abs(
          element.getBoundingClientRect().top - targetY,
        );
        const closestElement = closestId
          ? scroller.querySelector<HTMLElement>(`[data-stop-id="${closestId}"]`)
          : null;
        const closestDistance = closestElement
          ? Math.abs(closestElement.getBoundingClientRect().top - targetY)
          : Number.POSITIVE_INFINITY;

        return currentDistance < closestDistance
          ? Number(element.dataset.stopId)
          : closestId;
      },
      null,
    );

    if (closestStopId) setActiveStopId(closestStopId);
  }

  return (
    <motion.section
      aria-label="day 1 경로"
      className="absolute inset-x-0 bottom-[-96px] z-20 flex flex-col bg-[#F2F2F0] shadow-[0_-14px_32px_rgba(17,17,17,0.12)]"
      initial={{ top: 278 }}
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
          className="grid h-11 w-full cursor-grab place-items-center border-0 bg-transparent p-0 touch-none active:cursor-grabbing"
          data-testid="course-route-drawer-handle"
          onClick={() => {
            if (ignoreClickRef.current) return;
            setDrawerCoverOffset((current) =>
              current >= DRAWER_COLLAPSED_TOP ? 0 : DRAWER_COLLAPSED_TOP,
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
        <button
          className="mb-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#DCE7DF] bg-[#EDF5EF] text-sm font-black text-[#1F3D35]"
          onClick={onOptimize}
          type="button"
        >
          <WandSparkles size={18} />
          AI로 걷기 좋은 순서 정리
        </button>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-lg font-black text-[#272727]">여행지 리스트</h2>
          <button className="border-0 bg-transparent p-0 text-sm font-black text-[#8B857C]" type="button">편집</button>
        </div>
        {routeStops.map((stop) => (
          <StopTimelineItem
            isActive={stop.id === activeStopId}
            key={stop.id}
            onSelect={() => setActiveStopId(stop.id)}
            stop={stop}
            totalStops={routeStops.length}
          />
        ))}
      </div>
    </motion.section>
  );
}

function StopTimelineItem({
  isActive,
  onSelect,
  stop,
  totalStops,
}: {
  isActive: boolean;
  onSelect: () => void;
  stop: CourseStop;
  totalStops: number;
}) {
  return (
    <div
      className="grid w-full cursor-pointer grid-cols-[58px_1fr] gap-2"
      data-stop-id={stop.id}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="relative flex min-h-[72px] flex-col items-center pt-2">
        <span
          className={`absolute left-1/2 w-px -translate-x-1/2 bg-[#DEDCD6] ${
            stop.id === 1 ? "top-[-14px]" : "top-[-26px]"
          } ${stop.id < totalStops ? "bottom-[-18px]" : "bottom-9"}`}
        />
        {stop.distanceFromPrevious ? (
          <span className="absolute top-[-26px] z-10 rounded-md border border-[#E4E1DA] bg-white px-2 py-0.5 text-[0.7rem] font-black text-[#5F5A54] shadow-[0_4px_12px_rgba(31,38,35,0.04)]">
            {stop.distanceFromPrevious}
          </span>
        ) : null}
        <span
          className={`z-10 grid size-8 place-items-center rounded-full text-sm font-black ${accentClass[stop.accent]}`}
        >
          {stop.id}
        </span>
      </div>

      <article
        className={`mb-3 rounded-xl bg-white px-3.5 py-3 shadow-[0_8px_18px_rgba(31,38,35,0.05)] transition ${
          isActive ? "ring-2 ring-[#7957F2]/20" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-[0.98rem] font-black text-[#272727]">
              {stop.title}
            </h3>
            <p className="mt-0.5 mb-0 text-xs font-bold text-[#9A958E]">
              {stop.category}
            </p>
          </div>
          <button
            aria-label={`${stop.title} 리뷰`}
            className="grid size-8 flex-none place-items-center rounded-full border-0 bg-transparent text-[#D7D4CF]"
            onClick={(event) => event.stopPropagation()}
            type="button"
          >
            <Star size={20} fill="currentColor" />
          </button>
        </div>
      </article>
    </div>
  );
}

const friends = [
  { name: "지우", note: "망원 산책 메이트", color: "bg-[#FFE1D5]" },
  { name: "민서", note: "카페 취향이 비슷해요", color: "bg-[#DDEADB]" },
  { name: "도윤", note: "맛집을 잘 찾아요", color: "bg-[#E2E0F8]" },
  { name: "하린", note: "사진 명소를 좋아해요", color: "bg-[#F6E7C9]" },
];

export function CourseDetailPage() {
  const navigate = useNavigate();
  const { courseId = "course-1" } = useParams();
  const [searchParams] = useSearchParams();
  const [savedCourse] = useState(() => getSavedCourse(courseId));
  const isReadOnly = searchParams.get("view") === "1";
  const routeStops = useMemo<CourseStop[]>(
    () =>
      savedCourse?.stops.map((stop, index) => ({
        id: stop.id,
        accent: (["violet", "coral", "mint"] as const)[index % 3],
        category: `${stop.category} · ${savedCourse.area}`,
        coordinates: { lat: stop.lat, lng: stop.lng },
        distanceFromPrevious: index === 0 ? undefined : `${320 + index * 110}m`,
        location: savedCourse.area,
        title: stop.title,
      })) ?? defaultStops,
    [savedCourse],
  );
  const courseTitle = savedCourse?.title ?? "망원 하루 코스";
  const companion = savedCourse?.companion ?? "혼자";
  const styleLabel = savedCourse?.styles.join(" · ") || "로컬 산책";
  const [activeStopId, setActiveStopId] = useState(routeStops[0]?.id ?? 1);
  const [drawerCoverOffset, setDrawerCoverOffset] = useState(0);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedFriends, setSelectedFriends] = useState(savedCourse?.collaborators ?? []);
  const headerHeight = HEADER_EXPANDED_HEIGHT - headerOffset;
  const drawerTop = DRAWER_COLLAPSED_TOP - drawerCoverOffset;
  const isHeaderCompact = headerOffset > 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function saveAsImage() {
    const lines = routeStops.map((stop, index) => `${index + 1}. ${stop.title}`).join(" · ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#F7F5F0"/><rect x="80" y="80" width="920" height="1190" rx="50" fill="white"/><text x="140" y="210" font-size="36" font-weight="700" fill="#FD4003">곳곳 COURSE</text><text x="140" y="310" font-size="68" font-weight="900" fill="#1F3D35">${courseTitle}</text><text x="140" y="375" font-size="30" font-weight="700" fill="#777">${companion} · ${styleLabel}</text><text x="140" y="500" font-size="28" font-weight="700" fill="#333">${lines}</text></svg>`;
    const link = document.createElement("a");
    link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    link.download = `${courseTitle}.svg`;
    link.click();
    setShareOpen(false);
    showNotice("일정 이미지를 저장했어요.");
  }

  async function copyViewLink() {
    const url = `${window.location.origin}/course/${courseId}?view=1`;
    try {
      await navigator.clipboard.writeText(url);
      showNotice("보기 전용 링크를 복사했어요.");
    } catch {
      showNotice("링크를 복사하지 못했어요.");
    }
    setShareOpen(false);
  }

  function saveFriends() {
    if (savedCourse) updateCourseCollaborators(savedCourse.id, selectedFriends);
    setFriendsOpen(false);
    showNotice(`${selectedFriends.length}명과 일정을 공유했어요.`);
  }

  const actionButtons = (
    <div className="flex items-center gap-1">
      <button aria-label="공유하기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setShareOpen(true)} type="button"><Upload size={23} /></button>
      <button aria-label="전체 지도 보기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setMapOpen(true)} type="button"><MapIcon size={24} /></button>
      {!isReadOnly ? <button aria-label="일행과 함께 일정 짜기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setFriendsOpen(true)} type="button"><UsersRound size={24} /></button> : null}
    </div>
  );

  return (
    <>
      <section className="flex h-dvh flex-col overflow-hidden bg-white text-[#111]">
        <motion.div animate={{ height: headerHeight }} className="relative flex-none overflow-hidden bg-white" transition={{ type: "spring", stiffness: 360, damping: 34 }}>
          <div className="absolute inset-x-0 top-0 px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-5" style={{ transform: `translateY(-${headerOffset}px)`, pointerEvents: isHeaderCompact ? "none" : "auto" }}>
            <header className="flex items-center justify-between">
              <button aria-label="뒤로 가기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={27} /></button>
              {actionButtons}
            </header>
            <div className="mt-5">
              <div className="flex items-end gap-2"><h1 className="m-0 truncate text-[1.85rem] leading-tight font-black text-[#333]">{courseTitle}</h1>{!isReadOnly ? <button className="mb-1 border-0 bg-transparent p-0 text-base font-black text-[#9A958E]" type="button">편집</button> : null}</div>
              <p className="mt-1.5 mb-0 text-lg font-black text-[#777]">2026.6.23</p>
              <p className="mt-1.5 mb-0 truncate text-base font-bold text-[#777]">{companion} | {styleLabel}</p>
            </div>
            {!isReadOnly ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#1F3D35] px-4 text-sm font-black text-white"><Plus size={20} />장소 추가하기</button>
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full border border-[#D9E5DC] bg-[#EDF5EF] px-4 text-sm font-black text-[#1F3D35]" onClick={() => setFriendsOpen(true)} type="button"><UserPlus size={18} />일행과 함께 일정 짜기</button>
            </div> : <div className="mt-5 inline-flex rounded-full bg-[#F3F3F3] px-3 py-2 text-xs font-black text-[#777]">보기 전용 일정</div>}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1"><button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"><Plane size={17} />교통</button><button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"><WalletCards size={17} />예산</button><button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"><ReceiptText size={17} />체크리스트</button></div>
          </div>

          <div className="absolute inset-x-0 top-0 z-10 bg-white px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-3" style={{ opacity: isHeaderCompact ? 1 : 0, pointerEvents: isHeaderCompact ? "auto" : "none" }}>
            <header className="flex items-center gap-2"><button aria-label="뒤로 가기" className="grid size-8 flex-none place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={23} /></button><div className="min-w-0 flex-1"><h1 className="m-0 truncate text-sm font-black text-[#555]">{courseTitle}</h1><p className="mt-0.5 mb-0 truncate text-xs font-bold text-[#9A958E]">{companion} · {styleLabel}</p></div>{actionButtons}</header>
          </div>
        </motion.div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E7F0E8]" data-testid="course-route-stage">
          <CourseRouteMap activeStopId={activeStopId} className="h-[278px]" routeStops={routeStops} />
          <CourseRouteDrawer activeStopId={activeStopId} drawerCoverOffset={drawerCoverOffset} drawerTop={drawerTop} headerOffset={headerOffset} onOptimize={() => setOptimizeOpen(true)} routeStops={routeStops} setActiveStopId={setActiveStopId} setDrawerCoverOffset={setDrawerCoverOffset} setHeaderOffset={setHeaderOffset} />
        </div>
      </section>

      {mapOpen ? <section className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col bg-white text-[#171717]">
        <header className="flex items-center gap-3 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-4"><button aria-label="지도 닫기" className="grid size-10 place-items-center rounded-full border-0 bg-[#F4F2EE]" onClick={() => setMapOpen(false)} type="button"><X size={21} /></button><div className="min-w-0 flex-1"><h2 className="m-0 truncate text-lg font-black">{courseTitle}</h2><p className="mt-0.5 mb-0 text-xs font-bold text-[#8B857C]">장소를 넘기며 동선을 확인해보세요</p></div></header>
        <CourseRouteMap activeStopId={activeStopId} className="min-h-0 flex-1" routeStops={routeStops} />
        <div className="flex flex-none snap-x gap-3 overflow-x-auto bg-white px-5 py-4 pb-[calc(18px+env(safe-area-inset-bottom))]">{routeStops.map((stop, index) => <button className={`flex w-[78%] flex-none snap-center items-center gap-3 rounded-2xl border p-3 text-left ${activeStopId === stop.id ? "border-[#1F3D35] bg-[#EEF4EF]" : "border-[#E7E3DC] bg-white"}`} key={stop.id} onClick={() => setActiveStopId(stop.id)} type="button"><span className="grid size-9 flex-none place-items-center rounded-full bg-[#1F3D35] text-sm font-black text-white">{index + 1}</span><span className="min-w-0"><strong className="block truncate text-sm font-black">{stop.title}</strong><span className="mt-1 block truncate text-xs font-bold text-[#8B857C]">{stop.category}</span></span></button>)}</div>
      </section> : null}

      <BottomSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} title="일정 공유하기"><div className="grid gap-3"><button className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E9E5DE] bg-white px-4 text-left" onClick={saveAsImage} type="button"><span className="grid size-11 place-items-center rounded-xl bg-[#EEF4EF] text-[#1F3D35]"><Download size={21} /></span><span><strong className="block text-sm font-black">일정 이미지로 저장하기</strong><span className="mt-1 block text-xs font-bold text-[#8B857C]">코스 요약을 한 장의 이미지로 보관해요</span></span></button><button className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E9E5DE] bg-white px-4 text-left" onClick={copyViewLink} type="button"><span className="grid size-11 place-items-center rounded-xl bg-[#FFF0EA] text-[#FD4003]"><Link2 size={21} /></span><span><strong className="block text-sm font-black">일정 링크 공유하기</strong><span className="mt-1 block text-xs font-bold text-[#8B857C]">받은 사람은 보기 전용으로 확인해요</span></span></button></div></BottomSheet>

      <BottomSheet isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} title="일행과 함께 일정 짜기"><p className="mt-0 text-sm font-bold text-[#8B857C]">함께 편집할 친구를 선택해주세요.</p><div className="mt-4 grid gap-2">{friends.map((friend) => { const selected = selectedFriends.includes(friend.name); return <button className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left ${selected ? "border-[#1F3D35] bg-[#F0F5F1]" : "border-[#EBE7E0] bg-white"}`} key={friend.name} onClick={() => setSelectedFriends((current) => selected ? current.filter((name) => name !== friend.name) : [...current, friend.name])} type="button"><span className={`grid size-11 place-items-center rounded-full text-sm font-black ${friend.color}`}>{friend.name[0]}</span><span className="min-w-0 flex-1"><strong className="block font-black">{friend.name}</strong><span className="mt-1 block text-xs font-bold text-[#928C84]">{friend.note}</span></span>{selected ? <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white"><CheckSquare size={15} /></span> : null}</button>; })}</div><button className="mt-5 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white" onClick={saveFriends} type="button">{selectedFriends.length > 0 ? `${selectedFriends.length}명과 함께하기` : "나만 편집하기"}</button></BottomSheet>

      <BottomSheet isOpen={optimizeOpen} onClose={() => setOptimizeOpen(false)} title="AI 동선 정리"><div className="rounded-2xl bg-[#EEF4EF] p-4"><div className="flex items-center gap-2 text-[#1F3D35]"><WandSparkles size={21} /><strong className="font-black">걷는 시간을 약 18분 줄일 수 있어요</strong></div><p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#667069]">가까운 장소끼리 묶고 마지막 장소가 대중교통과 이어지도록 순서를 정리했어요.</p></div><div className="mt-4 flex flex-wrap items-center gap-2">{routeStops.map((stop, index) => <span className="inline-flex items-center gap-1 text-xs font-black text-[#5D5852]" key={stop.id}><span className="grid size-6 place-items-center rounded-full bg-[#FD4003] text-white">{index + 1}</span>{stop.title}{index < routeStops.length - 1 ? <ChevronRight size={14} className="text-[#AAA49B]" /> : null}</span>)}</div><button className="mt-6 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white" onClick={() => { setOptimizeOpen(false); showNotice("AI 추천 동선으로 정리했어요."); }} type="button">이 순서로 적용하기</button></BottomSheet>

      {notice ? <div className="fixed inset-x-5 bottom-[calc(24px+env(safe-area-inset-bottom))] z-[90] mx-auto max-w-[390px] rounded-2xl bg-[#171717] px-4 py-3 text-center text-sm font-black text-white shadow-xl">{notice}</div> : null}
    </>
  );
}
