import { useAuthUser } from "@/features/auth/authStore";
import {
  appendCourseItem,
  createCourse,
  getCachedApiCourse,
  getMyCourses,
  getPublicCourse,
  recommendCourseOrder,
  updateCourse,
  type CourseCreateRequest,
  type CourseItemRequest,
  type CourseItemResponse,
  type CourseResponse,
} from "@/features/course/courseApi";
import {
  appendCourseStop,
  appendCourseStops,
  getSavedCourse,
  getSavedCourses,
  saveCourse,
  updateCourseCollaborators,
  updateCourseDetails,
  type SavedCourse,
  type SavedCourseStop,
} from "@/features/course/courseStorage";
import { CourseDraftCalendar } from "@/features/course/components/CourseCreatePanel";
import {
  getAttractionDetail,
  type AttractionDetailResponse,
} from "@/features/attractions/attractionApi";
import { getFriends as getServiceFriends } from "@/features/friends/friendApi";
import { LocationConsentDialog } from "@/features/map/components/LocationConsentDialog";
import { getNeighborhoodLabel } from "@/features/map/components/MapListCard";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { mapCenter } from "@/features/map/constants";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import {
  readLocationConsent,
  saveLocationConsent,
} from "@/features/map/lib/locationConsent";
import { getFallbackPosition, toMapPoints } from "@/features/map/lib/mapPoints";
import { searchMap } from "@/features/map/mapApi";
import type {
  KakaoCustomOverlay,
  KakaoMapInstance,
  KakaoPolyline,
  MapPoint,
} from "@/features/map/types";
import { NoteCard } from "@/features/notes/components/NoteCard";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import type { Coordinates } from "@/shared/types/domain";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Crosshair,
  Download,
  Map as MapIcon,
  Plus,
  Star,
  UserPlus,
  WandSparkles,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Pencil,
} from "lucide-react";
import { motion, Reorder } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

type CourseStop = {
  id: number;
  accent: "violet" | "coral" | "mint";
  category: string;
  coordinates: Coordinates;
  description: string;
  distanceFromPrevious?: string;
  imageUrl: string;
  location: string;
  sourceItem?: CourseItemResponse;
  title: string;
};

const HEADER_EXPANDED_HEIGHT = 255;
const HEADER_COMPACT_HEIGHT = 74;
const HEADER_COLLAPSE_DISTANCE = HEADER_EXPANDED_HEIGHT - HEADER_COMPACT_HEIGHT;
const DRAWER_COLLAPSED_TOP = 236;

const defaultStops: CourseStop[] = [
  {
    id: 1,
    accent: "violet",
    category: "시장 · 망원",
    coordinates: { lat: 37.5567, lng: 126.9057 },
    description: "동네 간식으로 가볍게 하루를 시작해요.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원시장",
  },
  {
    id: 2,
    accent: "violet",
    category: "골목 산책 · 망원",
    coordinates: { lat: 37.5562, lng: 126.9049 },
    description: "작은 가게와 오래된 주택 사이를 천천히 걸어요.",
    distanceFromPrevious: "650m",
    imageUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원시장 골목",
  },
  {
    id: 3,
    accent: "coral",
    category: "공원 · 한강",
    coordinates: { lat: 37.5545, lng: 126.897 },
    description: "강바람을 맞으며 노을이 드는 시간을 즐겨요.",
    distanceFromPrevious: "1.2km",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원한강공원 입구",
  },
  {
    id: 4,
    accent: "mint",
    category: "노을 산책 · 한강",
    coordinates: { lat: 37.5548, lng: 126.8959 },
    description: "한강을 따라 이어지는 길에서 천천히 쉬어가요.",
    distanceFromPrevious: "480m",
    imageUrl:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "한강 산책로",
  },
  {
    id: 5,
    accent: "violet",
    category: "소품 · 망원",
    coordinates: { lat: 37.5569, lng: 126.9036 },
    description: "작은 소품과 로컬 가게를 둘러보며 취향을 찾아요.",
    distanceFromPrevious: "320m",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원 소품샵 거리",
  },
  {
    id: 6,
    accent: "coral",
    category: "카페 · 망원",
    coordinates: { lat: 37.5574, lng: 126.9027 },
    description: "골목 안쪽 카페에서 잠깐 숨을 고르며 쉬어가요.",
    distanceFromPrevious: "210m",
    imageUrl:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "골목 카페",
  },
  {
    id: 7,
    accent: "violet",
    category: "책방 · 망원",
    coordinates: { lat: 37.5582, lng: 126.9042 },
    description: "동네 큐레이션이 담긴 책방에서 조용히 머물러요.",
    distanceFromPrevious: "430m",
    imageUrl:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "동네 책방",
  },
  {
    id: 8,
    accent: "mint",
    category: "디저트 · 망원",
    coordinates: { lat: 37.5578, lng: 126.9062 },
    description: "가벼운 디저트로 하루 코스를 기분 좋게 마무리해요.",
    distanceFromPrevious: "380m",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원 디저트 바",
  },
];

const fallbackCourseImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";

const markerColorClass = {
  coral: "is-coral",
  mint: "is-mint",
  violet: "is-violet",
} satisfies Record<CourseStop["accent"], string>;
const seoulMapRadiusMeters = 30_000;

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

    if (routeStops.length === 0) {
      setStatus("ready");
      return;
    }

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

    if (routeStops.length === 0 || status !== "ready" || !kakaoMaps || !map) return;

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
      {routeStops.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center bg-[#E7F0E8] px-6 text-center">
          <div>
            <p className="m-0 text-sm font-black text-[#1F3D35]">
              아직 지도에 표시할 장소가 없어요.
            </p>
            <p className="mt-1.5 mb-0 text-xs font-bold text-[#718078]">
              장소 추가하기로 첫 장소를 담아주세요.
            </p>
          </div>
        </div>
      ) : status === "missing-key" || status === "error" ? (
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
  canEdit,
  drawerCoverOffset,
  drawerTop,
  headerOffset,
  setActiveStopId,
  setDrawerCoverOffset,
  setHeaderOffset,
  routeStops,
  onOptimize,
  onUpdateStopsOrder,
  onSaveReorderedStops,
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
  onOptimize: () => void;
  onUpdateStopsOrder?: (newStops: CourseStop[], saveToApi?: boolean) => void;
  onSaveReorderedStops?: () => void;
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
  const isExpanded = drawerTop === 0;
  const isHeaderCollapsed = headerOffset >= headerCollapseDistance;

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
                      setIsRouteEditing(false);
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
                  onClick={() => setIsRouteEditing(true)}
                  title="일정 편집"
                  type="button"
                >
                  <Pencil size={13} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>
        {routeStops.length === 0 ? (
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
            values={routeStops.map((stop) => stop.id)}
            onReorder={(newStopIds) => {
              const newStops = newStopIds
                .map((id) => routeStops.find((stop) => stop.id === id))
                .filter((stop): stop is CourseStop => !!stop);
              onUpdateStopsOrder?.(newStops, false);
            }}
            className="flex flex-col gap-4"
          >
            {routeStops.map((stop, index) => (
              <Reorder.Item
                key={stop.id}
                value={stop.id}
                drag={isRouteEditing ? "y" : false}
                whileDrag={{
                  scale: 1.03,
                  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                }}
                className={`relative ${isRouteEditing ? "z-50" : "z-0"}`}
                onDragEnd={() => {
                  onSaveReorderedStops?.();
                }}
              >
                <StopTimelineItem
                  isActive={stop.id === activeStopId}
                  onSelect={() => setActiveStopId(stop.id)}
                  order={index + 1}
                  stop={stop}
                  isRouteEditing={isRouteEditing}
                  isLast={index === routeStops.length - 1}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </motion.section>
  );
}

function StopTimelineItem({
  isActive,
  onSelect,
  order,
  stop,
  isRouteEditing,
  isLast,
}: {
  isActive: boolean;
  onSelect: () => void;
  order: number;
  stop: CourseStop;
  isRouteEditing?: boolean;
  isLast?: boolean;
}) {
  return (
    <div
      className={`w-full ${isRouteEditing ? "cursor-grab touch-none" : "cursor-pointer"}`}
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
            <div className="text-[#C8C5BD] p-1 flex-none cursor-grab active:cursor-grabbing">
              <GripVertical size={18} />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function sortedCourseItems(course: CourseResponse) {
  return [...course.items].sort((a, b) => a.position - b.position);
}

function toDisplayRouteStops(
  course: CourseResponse,
  details: Record<number, AttractionDetailResponse>,
): CourseStop[] {
  const items = sortedCourseItems(course);
  const base = course.startLocation
    ? { lat: course.startLocation.latitude, lng: course.startLocation.longitude }
    : defaultStops[0].coordinates;

  return items.map((item, index) => {
    const fallbackStop = defaultStops[index % defaultStops.length];
    const segment = course.segments?.find(
      (candidate) => candidate.toPosition === item.position,
    );
    const detail = item.attractionId ? details[item.attractionId] : undefined;

    return {
      id: item.position || index + 1,
      accent: (["violet", "coral", "mint"] as const)[index % 3],
      category: detail
        ? `${getAttractionCategoryLabel(detail.contentTypeId)} · ${course.regionName ?? "코스"}`
        : `${getCourseItemTypeLabel(item)} · ${course.regionName ?? "코스"}`,
      coordinates: detail
        ? { lat: detail.latitude, lng: detail.longitude }
        : {
            lat: base.lat + index * 0.0018 + (index % 2) * 0.001,
            lng: base.lng + index * 0.0022 - (index % 2) * 0.001,
          },
      description:
        item.memo?.trim() ||
        detail?.overview?.trim() ||
        course.description?.trim() ||
        `${course.regionName ?? "이 동네"}에서 이어지는 추천 코스예요.`,
      distanceFromPrevious:
        index === 0
          ? undefined
          : segment
            ? `${Math.max(1, Math.round(segment.distanceMeters))}m`
            : `${320 + index * 110}m`,
      imageUrl: detail?.imageUrl || course.coverImageUrl || fallbackStop.imageUrl || fallbackCourseImage,
      location: course.regionName ?? fallbackStop.location,
      sourceItem: item,
      title: item.title?.trim() || detail?.title || `${getCourseItemTypeLabel(item)} ${index + 1}`,
    };
  });
}

function getAttractionCategoryLabel(contentTypeId?: string | null) {
  if (!contentTypeId) return "장소";
  const mapping: Record<string, string> = {
    "12": "관광지",
    "14": "문화시설",
    "15": "축제공연행사",
    "25": "여행코스",
    "28": "레포츠",
    "32": "숙박",
    "38": "쇼핑",
    "39": "음식점",
  };
  return mapping[contentTypeId] || "장소";
}

function getCourseItemTypeLabel(item: CourseItemResponse) {
  if (item.itemType === "NOTE") return "쪽지";
  if (item.itemType === "ATTRACTION") return "장소";
  return item.itemType || "장소";
}

function toCourseUpdateRequest(course: CourseResponse) {
  return {
    coverImageUrl: course.coverImageUrl ?? undefined,
    description: course.description ?? undefined,
    items: sortedCourseItems(course).map((item) => ({
      attractionId: item.attractionId ?? undefined,
      day: item.day,
      itemType: item.itemType,
      memo: item.memo ?? undefined,
      noteId: item.noteId ?? undefined,
      position: item.position,
      stayMinutes: item.stayMinutes ?? undefined,
    })),
    regionName: course.regionName ?? undefined,
    status: course.status,
    title: course.title,
    visibility: course.visibility,
  };
}

export function CourseDetailPage() {
  const [isRouteEditing, setIsRouteEditing] = useState(false);
  const [backupCourse, setBackupCourse] = useState<CourseResponse | null>(null);
  const navigate = useNavigate();
  const { courseId = "course-1" } = useParams();
  const [searchParams] = useSearchParams();
  const authUserQuery = useAuthUser();
  const userId = authUserQuery.data?.id;
  const [savedCourse, setSavedCourse] = useState<SavedCourse | undefined>(() =>
    getSavedCourse(courseId),
  );
  const [apiCourse, setApiCourse] = useState<CourseResponse | null>(
    () => getCachedApiCourse(courseId) ?? null,
  );
  const [attractionDetails, setAttractionDetails] = useState<
    Record<number, AttractionDetailResponse>
  >({});
  const myCoursesQuery = useQuery({
    enabled: !!userId,
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    retry: 1,
  });
  const isMyApiCourse = useMemo(() => {
    if (!apiCourse) return false;
    return myCoursesQuery.data?.some((c) => c.id === apiCourse.id) ?? false;
  }, [apiCourse, myCoursesQuery.data]);

  const isReadOnly =
    searchParams.get("view") === "1" ||
    (!savedCourse && (!apiCourse || (myCoursesQuery.isSuccess && !isMyApiCourse)));
  const canEditCourse = !isReadOnly;
  const routeStops = useMemo<CourseStop[]>(
    () =>
      apiCourse
        ? toDisplayRouteStops(apiCourse, attractionDetails)
        : savedCourse?.stops.map((stop, index) => ({
        id: stop.id,
        accent: (["violet", "coral", "mint"] as const)[index % 3],
        category: `${stop.category} · ${savedCourse.area}`,
        coordinates: { lat: stop.lat, lng: stop.lng },
        description: stop.description,
        distanceFromPrevious: index === 0 ? undefined : `${320 + index * 110}m`,
        imageUrl: stop.imageUrl || fallbackCourseImage,
        location: savedCourse.area,
        title: stop.title,
      })) ?? [],
    [apiCourse, savedCourse, attractionDetails],
  );

  useEffect(() => {
    if (!apiCourse) return;
    const ids = apiCourse.items
      .map((item) => item.attractionId)
      .filter(
        (id): id is number =>
          typeof id === "number" && !attractionDetails[id],
      );

    if (ids.length === 0) return;

    async function fetchDetails() {
      try {
        const results = await Promise.all(
          ids.map((id) => getAttractionDetail(id).catch(() => null)),
        );
        const nextMap = { ...attractionDetails };
        let updated = false;
        results.forEach((res) => {
          if (res) {
            nextMap[res.id] = res;
            updated = true;
          }
        });
        if (updated) {
          setAttractionDetails(nextMap);
        }
      } catch {
        // Silently ignore
      }
    }

    void fetchDetails();
  }, [apiCourse, attractionDetails]);
  const courseTitle = apiCourse?.title ?? savedCourse?.title ?? "망원 하루 코스";
  const companion = savedCourse?.companion ?? "내 일정";
  const descParts = apiCourse?.description?.split("|") ?? [];
  const apiDate = descParts[0]?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? descParts[0]
    : (apiCourse?.description?.match(/^\d{4}-\d{2}-\d{2}$/) ? apiCourse.description : undefined);

  const apiTags = useMemo<string[]>(() => {
    if (!apiCourse?.description) return [];
    if (apiCourse.description.includes("|")) {
      const parts = apiCourse.description.split("|");
      return parts[1] ? parts[1].split(",").map((t) => t.trim()).filter(Boolean) : [];
    }
    if (apiCourse.description.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return [];
    }
    return apiCourse.description.split(/[·,\s]+/).map((t) => t.trim()).filter(Boolean);
  }, [apiCourse?.description]);

  const dateLabel = savedCourse?.date || apiDate
    ? (savedCourse?.date ?? apiDate ?? "").replace(/-/g, ".")
    : "날짜 미정";

  const styleLabel =
    (savedCourse ? savedCourse.styles.join(" · ") : apiTags.join(" · ")) ||
    apiCourse?.regionName ||
    "로컬 산책";
  const [activeStopId, setActiveStopId] = useState(routeStops[0]?.id ?? 1);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [drawerCoverOffset, setDrawerCoverOffset] = useState(0);
  const [headerOffset, setHeaderOffset] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [optimizeOpen, setOptimizeOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedCourse, setOptimizedCourse] = useState<CourseResponse | null>(
    null,
  );
  const [mapOpen, setMapOpen] = useState(false);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(courseTitle);
  const [editDate, setEditDate] = useState(savedCourse?.date ?? apiDate ?? "");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [editStops, setEditStops] = useState<CourseStop[]>([]);
  const [newStopName, setNewStopName] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [isCopyingCourse, setIsCopyingCourse] = useState(false);
  const [copyTargetId, setCopyTargetId] = useState("");
  const [copyNewTitle, setCopyNewTitle] = useState("");
  const [copySavedCourses, setCopySavedCourses] = useState(() => getSavedCourses());
  const [notice, setNotice] = useState("");
  const [selectedFriends, setSelectedFriends] = useState(
    savedCourse?.collaborators ?? [],
  );
  const friendsQuery = useQuery({
    enabled: friendsOpen,
    queryFn: getServiceFriends,
    queryKey: ["friends"],
  });
  const copyTargets = useMemo(() => {
    const apiTargets = (myCoursesQuery.data ?? [])
      .filter((course) => course.id !== apiCourse?.id)
      .map((course) => ({
        id: `api:${course.id}`,
        meta: `${course.regionName ?? "동네"} · ${course.items.length}곳`,
        title: course.title,
        type: "api" as const,
        value: course,
      }));
    const localTargets = copySavedCourses
      .filter((course) => course.id !== savedCourse?.id)
      .map((course) => ({
        id: `local:${course.id}`,
        meta: `${course.area} · ${course.stops.length}곳`,
        title: course.title,
        type: "local" as const,
        value: course,
      }));

    return [...apiTargets, ...localTargets];
  }, [apiCourse?.id, copySavedCourses, myCoursesQuery.data, savedCourse?.id]);
  const expandedHeaderHeight = 255;
  const drawerCollapsedTop = 236;
  const headerCollapseDistance = expandedHeaderHeight - HEADER_COMPACT_HEIGHT;

  const headerHeight = expandedHeaderHeight - headerOffset;
  const drawerTop = drawerCollapsedTop - drawerCoverOffset;
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

  useEffect(() => {
    let cancelled = false;

    async function loadCourse() {
      try {
        const course = await getPublicCourse(courseId);
        if (!cancelled) setApiCourse(course);
      } catch {
        if (
          !cancelled &&
          !getCachedApiCourse(courseId) &&
          !getSavedCourse(courseId)
        ) {
          setNotice("코스를 불러오지 못해 기본 예시를 보여드려요.");
        }
      }
    }

    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (routeStops[0] && !routeStops.some((stop) => stop.id === activeStopId)) {
      setActiveStopId(routeStops[0].id);
    }
  }, [activeStopId, routeStops]);

  useEffect(() => {
    if (editOpen) {
      setEditTitle(courseTitle);
      const initialDate = savedCourse?.date ?? apiDate ?? "";
      setEditDate(initialDate);
      setCalendarMonth(startOfMonth(initialDate ? new Date(initialDate) : new Date()));
      setEditStops(routeStops);
      setNewStopName("");
      setEditTags(savedCourse ? [...(savedCourse.styles ?? [])] : [...apiTags]);
    }
  }, [editOpen, routeStops, courseTitle, savedCourse, apiDate, apiTags]);

  useEffect(() => {
    if (!copyOpen) return;

    setCopySavedCourses(getSavedCourses());
    setCopyTargetId("");
    setCopyNewTitle(`${courseTitle} 복사`);
  }, [copyOpen, courseTitle]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function saveCourseEdit() {
    if (!canEditCourse || isSavingEdit) return;

    const title = editTitle.trim();
    if (!title) {
      showNotice("코스 제목을 입력해주세요.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const trimmedTags = editTags.map((tag) => tag.trim()).filter(Boolean);
      if (apiCourse) {
        const nextItems = editStops.flatMap((stop, index) => {
          const item = toCourseItemRequest(stop, index);
          return item ? [item] : [];
        });

        const descriptionPayload = trimmedTags.length > 0 
          ? `${editDate || ""}|${trimmedTags.join(",")}`
          : (editDate || "");

        const updated = await updateCourse(apiCourse.id, {
          ...toCourseUpdateRequest(apiCourse),
          description: descriptionPayload || undefined,
          items: nextItems,
          title,
        });
        setApiCourse(updated);
      } else if (savedCourse) {
        const updatedStops = toSavedStops(editStops);
        saveCourse({
          ...savedCourse,
          date: editDate || undefined,
          title,
          stops: updatedStops,
          styles: trimmedTags,
        });
        setSavedCourse(getSavedCourse(savedCourse.id));
      }
      setEditOpen(false);
      showNotice("코스 정보를 수정했어요.");
    } catch {
      showNotice("코스 정보를 저장하지 못했어요.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function addEditStop() {
    const name = newStopName.trim();
    if (!name) return;

    const newStop: CourseStop = {
      id: Date.now(),
      accent: (["violet", "coral", "mint"] as const)[editStops.length % 3],
      category: "직접 추가한 장소",
      coordinates: routeStops[0]?.coordinates ?? { lat: 37.5567, lng: 126.9057 },
      description: "코스 정보 편집에서 직접 추가한 장소입니다.",
      imageUrl: fallbackCourseImage,
      location: apiCourse?.regionName ?? savedCourse?.area ?? "망원",
      title: name,
    };

    setEditStops((current) => [...current, newStop]);
    setNewStopName("");
  }

  function removeEditStop(id: number) {
    setEditStops((current) => current.filter((stop) => stop.id !== id));
  }

  async function saveAsImage() {
    const width = 1080;
    const headerHeight = 350;
    const cardHeight = 205;
    const cardGap = 34;
    const height = Math.max(
      1500,
      headerHeight + routeStops.length * (cardHeight + cardGap) + 150,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const drawingContext = context;

    async function render(includeImages: boolean) {
      const images = includeImages
        ? await Promise.all(routeStops.map((stop) => loadCanvasImage(stop.imageUrl)))
        : routeStops.map(() => null);

      drawingContext.clearRect(0, 0, width, height);
      drawingContext.fillStyle = "#F7F5F0";
      drawingContext.fillRect(0, 0, width, height);
      drawingContext.fillStyle = "#111111";
      drawingContext.font = "900 58px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText(courseTitle, 72, 116);
      drawingContext.fillStyle = "#FD4003";
      drawingContext.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText("곳곳 COURSE", 72, 165);
      drawingContext.fillStyle = "#746F67";
      drawingContext.font = "800 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
      drawingContext.fillText(`${dateLabel} · ${companion}`, 72, 215);
      drawWrappedText(drawingContext, styleLabel, 72, 260, 900, 34, 2);

      routeStops.forEach((stop, index) => {
        const y = headerHeight + index * (cardHeight + cardGap);
        const cardX = 62;
        const cardY = y;
        const cardWidth = width - cardX * 2;
        const imageX = cardX + 28;
        const imageY = cardY + 28;
        const imageSize = 150;

        if (stop.distanceFromPrevious) {
          drawingContext.fillStyle = "#DEDAD2";
          drawingContext.fillRect(width / 2 - 124, cardY - 18, 248, 4);
          drawRoundRect(drawingContext, width / 2 - 62, cardY - 33, 124, 34, 17, "#FFFFFF");
          drawingContext.fillStyle = "#8B857C";
          drawingContext.font = "900 18px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
          drawingContext.textAlign = "center";
          drawingContext.fillText(stop.distanceFromPrevious, width / 2, cardY - 10);
          drawingContext.textAlign = "start";
        }

        drawRoundRect(drawingContext, cardX, cardY, cardWidth, cardHeight, 34, "#FFFFFF");
        drawRoundRect(drawingContext, imageX, imageY, imageSize, imageSize, 24, "#E7E3DC");

        const image = images[index];
        if (image) {
          drawingContext.save();
          clipRoundRect(drawingContext, imageX, imageY, imageSize, imageSize, 24);
          drawCoverImage(drawingContext, image, imageX, imageY, imageSize, imageSize);
          drawingContext.restore();
        }

        const textX = imageX + imageSize + 34;
        const numberX = textX;
        const numberY = cardY + 62;
        drawingContext.beginPath();
        drawingContext.arc(numberX + 24, numberY, 24, 0, Math.PI * 2);
        drawingContext.fillStyle = "#FD4003";
        drawingContext.fill();
        drawingContext.fillStyle = "#FFFFFF";
        drawingContext.font = "900 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawingContext.textAlign = "center";
        drawingContext.fillText(String(index + 1), numberX + 24, numberY + 10);
        drawingContext.textAlign = "start";

        drawingContext.fillStyle = "#111111";
        drawingContext.font = "900 38px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawSingleLineText(drawingContext, stop.title, textX + 68, numberY + 11, 550);
        drawingContext.fillStyle = "#807A73";
        drawingContext.font = "900 27px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawSingleLineText(drawingContext, stop.category, textX, cardY + 120, 660);
        drawingContext.fillStyle = "#716C65";
        drawingContext.font = "800 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        drawWrappedText(drawingContext, stop.description, textX, cardY + 158, 660, 32, 2);
      });
    }

    try {
      await render(true);
      downloadCanvas(canvas, courseTitle);
    } catch {
      await render(false);
      downloadCanvas(canvas, courseTitle);
    }

    setShareOpen(false);
    showNotice("긴 일정 이미지로 저장했어요.");
  }

  function saveFriends() {
    if (!canEditCourse) return;
    if (savedCourse) updateCourseCollaborators(savedCourse.id, selectedFriends);
    setFriendsOpen(false);
    showNotice(
      selectedFriends.length > 0
        ? `${selectedFriends.length}명에게 공유 요청을 보냈어요. 친구가 알림에서 수락하면 볼 수 있어요.`
        : "공유 요청을 보내지 않았어요.",
    );
  }

  async function addPointsToCourse(points: MapPoint[]) {
    if (!canEditCourse || isAddingPoint || points.length === 0) return;

    setIsAddingPoint(true);
    try {
      if (apiCourse) {
        const currentItems = sortedCourseItems(apiCourse).map((item) => ({
          attractionId: item.attractionId ?? undefined,
          day: item.day,
          itemType: item.itemType,
          memo: item.memo ?? undefined,
          noteId: item.noteId ?? undefined,
          position: item.position,
          stayMinutes: item.stayMinutes ?? undefined,
        }));
        const startPosition = currentItems.reduce(
          (max, item) => Math.max(max, item.position ?? 0),
          0,
        );
        const newItems = points.map((point, index) => {
          const numericId = getNumericPointId(point.id);
          return {
            attractionId: point.kind === "place" ? numericId ?? undefined : undefined,
            day: 1,
            itemType: point.kind === "place" ? "ATTRACTION" : "NOTE",
            memo: point.kind === "spot" ? point.source.body : undefined,
            noteId: point.kind === "spot" ? numericId ?? undefined : undefined,
            position: startPosition + index + 1,
            stayMinutes: 60,
          };
        });

        const updated = await updateCourse(apiCourse.id, {
          coverImageUrl: apiCourse.coverImageUrl ?? undefined,
          description: apiCourse.description ?? undefined,
          items: [...currentItems, ...newItems],
          regionName: apiCourse.regionName ?? undefined,
          status: apiCourse.status,
          title: apiCourse.title,
          visibility: apiCourse.visibility,
        });
        setApiCourse(updated);
      } else if (savedCourse) {
        for (const point of points) {
          appendCourseStop(savedCourse.id, toSavedCourseStop(point));
        }
        setSavedCourse(getSavedCourse(savedCourse.id));
      }

      setPlacePickerOpen(false);
      showNotice(`${points.length}개의 장소를 코스 맨 뒤에 추가했어요.`);
    } catch {
      if (savedCourse) {
        for (const point of points) {
          appendCourseStop(savedCourse.id, toSavedCourseStop(point));
        }
        setSavedCourse(getSavedCourse(savedCourse.id));
        setPlacePickerOpen(false);
        showNotice(`${points.length}개의 장소를 코스 맨 뒤에 추가했어요.`);
        return;
      }

      showNotice("코스에 추가하지 못했어요.");
    } finally {
      setIsAddingPoint(false);
    }
  }

  async function addPublicCourseToTarget() {
    if (!apiCourse || !copyTargetId || isCopyingCourse) return;

    const target = copyTargets.find((course) => course.id === copyTargetId);
    if (!target) return;

    setIsCopyingCourse(true);
    try {
      if (target.type === "api") {
        const request = appendStopsToCourseRequest(target.value, routeStops);
        if (request.items.length <= target.value.items.length) {
          showNotice("담을 수 있는 실제 장소 ID가 부족해요.");
          return;
        }

        await updateCourse(target.value.id, request);
      } else {
        appendCourseStops(target.value.id, toSavedStops(routeStops));
        setCopySavedCourses(getSavedCourses());
      }

      setCopyOpen(false);
      showNotice(`${target.title}에 ${routeStops.length}곳을 담았어요.`);
    } catch {
      showNotice("선택한 코스에 담지 못했어요.");
    } finally {
      setIsCopyingCourse(false);
    }
  }

  async function createCourseFromPublicCourse() {
    if (!apiCourse || isCopyingCourse) return;

    const title = copyNewTitle.trim() || `${courseTitle} 복사`;
    const localId = `mine-${apiCourse.id}-${Date.now()}`;
    setIsCopyingCourse(true);

    try {
      const request = createCourseRequestFromStops({
        id: localId,
        sourceCourse: apiCourse,
        stops: routeStops,
        title,
      });

      if (request) {
        const course = await createCourse(request);
        setCopyOpen(false);
        showNotice("새 내 코스로 담았어요.");
        navigate(`/course/${course.id}`, { replace: true });
        return;
      }
    } catch {
      // Fall back to local storage below.
    }

    saveCourse({
      id: localId,
      title,
      area: apiCourse.regionName ?? "미정",
      companion: "내 일정",
      date: undefined,
      styles: [apiCourse.description?.trim() || "탐색한 코스"],
      pace: "날짜 미정",
      savedAt: new Date().toISOString(),
      collaborators: [],
      stops: toSavedStops(routeStops),
    });
    setCopyOpen(false);
    showNotice("새 내 코스로 담았어요.");
    navigate(`/course/${localId}`, { replace: true });
    setIsCopyingCourse(false);
  }

  async function openOptimizeSheet() {
    if (!canEditCourse) return;
    setOptimizeOpen(true);
    setOptimizedCourse(null);

    if (!apiCourse) return;

    setIsOptimizing(true);
    try {
      const recommended = await recommendCourseOrder(apiCourse.id);
      setOptimizedCourse(recommended);
    } catch {
      showNotice("AI 동선 추천을 불러오지 못했어요.");
    } finally {
      setIsOptimizing(false);
    }
  }

  async function applyOptimizedOrder() {
    if (!canEditCourse) return;
    if (!apiCourse || !optimizedCourse) {
      setOptimizeOpen(false);
      showNotice("AI 추천 동선으로 정리했어요.");
      return;
    }

    try {
      const updated = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(optimizedCourse),
      );
      setApiCourse(updated);
      setOptimizeOpen(false);
      showNotice("AI 추천 동선으로 저장했어요.");
    } catch {
      showNotice("추천 순서를 저장하지 못했어요.");
    }
  }

  async function handleDirectOptimize() {
    if (!canEditCourse || !apiCourse || isOptimizing) return;

    setIsOptimizing(true);
    try {
      setBackupCourse(apiCourse);
      const recommended = await recommendCourseOrder(apiCourse.id);
      const updated = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(recommended),
      );
      setApiCourse(updated);
      showNotice("AI 추천 동선으로 정리했어요.");
    } catch {
      showNotice("AI 동선 추천을 불러오지 못했어요.");
      setBackupCourse(null);
    } finally {
      setIsOptimizing(false);
    }
  }

  async function handleRestore() {
    if (!canEditCourse || !backupCourse || !apiCourse) return;

    try {
      const restored = await updateCourse(
        apiCourse.id,
        toCourseUpdateRequest(backupCourse),
      );
      setApiCourse(restored);
      setBackupCourse(null);
      showNotice("원래 순서로 복구했어요.");
    } catch {
      showNotice("원래 순서로 복구하지 못했어요.");
    }
  }

  async function handleSaveReorderedStops() {
    if (apiCourse) {
      try {
        const updated = await updateCourse(
          apiCourse.id,
          toCourseUpdateRequest(apiCourse),
        );
        setApiCourse(updated);
      } catch (err) {
        showNotice("순서 변경을 저장하지 못했어요.");
        if (backupCourse) {
          setApiCourse(backupCourse);
        }
      }
    } else if (savedCourse) {
      saveCourse(savedCourse);
      window.dispatchEvent(new CustomEvent("spot:courses-changed"));
    }
  }

  async function handleUpdateStopsOrder(newStops: CourseStop[], saveToApi = true) {
    if (!canEditCourse) return;

    if (apiCourse) {
      const newItems = newStops.map((stop, index) => {
        const originalItem = apiCourse.items.find((item) => {
          if (item.attractionId && stop.attractionId === item.attractionId) return true;
          if (item.noteId && stop.noteId === item.noteId) return true;
          return false;
        });

        if (!originalItem) {
          throw new Error("Matching item not found during reorder");
        }

        return {
          ...originalItem,
          position: index + 1,
        };
      });

      const updatedCourse = {
        ...apiCourse,
        items: newItems,
      };

      if (!backupCourse) {
        setBackupCourse(apiCourse);
      }

      setApiCourse(updatedCourse);

      if (!saveToApi) return;

      try {
        const updated = await updateCourse(
          apiCourse.id,
          toCourseUpdateRequest(updatedCourse),
        );
        setApiCourse(updated);
      } catch (err) {
        showNotice("순서 변경을 저장하지 못했어요.");
        if (backupCourse) {
          setApiCourse(backupCourse);
        } else {
          setApiCourse(apiCourse);
        }
      }
    } else if (savedCourse) {
      const updatedCourse = {
        ...savedCourse,
        stops: newStops,
      };

      setSavedCourse(updatedCourse);

      if (saveToApi) {
        saveCourse(updatedCourse);
        window.dispatchEvent(new CustomEvent("spot:courses-changed"));
      }
    }
  }

  const actionButtons = (
    <div className="flex items-center gap-1">
      <button aria-label="일정 이미지 저장" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setShareOpen(true)} type="button"><Download size={23} /></button>
      <button aria-label="전체 지도 보기" className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => setMapOpen(true)} type="button"><MapIcon size={24} /></button>
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
              <div className="flex items-end gap-2"><h1 className="m-0 truncate text-2xl leading-tight font-black text-[#202020]">{courseTitle}</h1>{canEditCourse ? <button className="mb-1 border-0 bg-transparent p-1 text-[#9A958E] hover:text-[#FD4003] transition-colors" onClick={() => setEditOpen(true)} aria-label="코스 정보 수정" type="button"><Pencil size={15} strokeWidth={2.8} /></button> : null}</div>
              <p className="mt-1.5 mb-0 text-base font-extrabold text-[#777]">{dateLabel}</p>
              <p className="mt-1.5 mb-0 truncate text-base font-bold text-[#777]">{companion} | {styleLabel}</p>
            </div>
            {canEditCourse ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#1F3D35] px-4 text-sm font-extrabold text-white" onClick={() => setPlacePickerOpen(true)} type="button"><Plus size={20} />장소 추가하기</button>
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full border border-[#D9E5DC] bg-[#EDF5EF] px-4 text-sm font-extrabold text-[#1F3D35]" onClick={() => setFriendsOpen(true)} type="button"><UserPlus size={18} />일행과 함께 일정 짜기</button>
            </div> : apiCourse ? <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#1F3D35] px-4 text-sm font-extrabold text-white" onClick={() => setCopyOpen(true)} type="button"><Plus size={18} />내 코스에 추가</button>
              <span className="inline-flex h-10 flex-none items-center rounded-full bg-[#F3F3F3] px-3 text-xs font-extrabold text-[#777]">탐색한 코스</span>
            </div> : <div className="mt-5 inline-flex rounded-full bg-[#F3F3F3] px-3 py-2 text-xs font-extrabold text-[#777]">보기 전용 일정</div>}
          </div>

          <div className="absolute inset-x-0 top-0 z-10 bg-white px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-3" style={{ opacity: isHeaderCompact ? 1 : 0, pointerEvents: isHeaderCompact ? "auto" : "none" }}>
            <header className="flex items-center gap-2"><button aria-label="뒤로 가기" className="grid size-8 flex-none place-items-center rounded-full border-0 bg-transparent text-[#333]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={23} /></button><div className="min-w-0 flex-1"><h1 className="m-0 truncate text-sm font-black text-[#555]">{courseTitle}</h1><p className="mt-0.5 mb-0 truncate text-xs font-bold text-[#9A958E]">{companion} · {styleLabel}</p></div>{actionButtons}</header>
          </div>
        </motion.div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E7F0E8]" data-testid="course-route-stage">
          <CourseRouteMap activeStopId={activeStopId} className="h-[278px]" routeStops={routeStops} />
          <CourseRouteDrawer
            activeStopId={activeStopId}
            canEdit={canEditCourse}
            drawerCoverOffset={drawerCoverOffset}
            drawerTop={drawerTop}
            headerOffset={headerOffset}
            onOptimize={openOptimizeSheet}
            routeStops={routeStops}
            setActiveStopId={setActiveStopId}
            setDrawerCoverOffset={setDrawerCoverOffset}
            setHeaderOffset={setHeaderOffset}
            isRouteEditing={isRouteEditing}
            setIsRouteEditing={setIsRouteEditing}
            hasBackup={backupCourse !== null}
            onRestore={handleRestore}
            clearBackup={() => setBackupCourse(null)}
            hasApiCourse={apiCourse !== null}
            onDirectOptimize={handleDirectOptimize}
            isOptimizing={isOptimizing}
            drawerCollapsedTop={drawerCollapsedTop}
            headerCollapseDistance={headerCollapseDistance}
            onUpdateStopsOrder={handleUpdateStopsOrder}
            onSaveReorderedStops={handleSaveReorderedStops}
          />
        </div>
      </section>

      {mapOpen ? <section className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[430px] flex-col bg-white text-[#171717]">
        <header className="flex items-center gap-3 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-4"><button aria-label="지도 닫기" className="grid size-10 place-items-center rounded-full border-0 bg-[#F4F2EE]" onClick={() => setMapOpen(false)} type="button"><X size={21} /></button><div className="min-w-0 flex-1"><h2 className="m-0 truncate text-lg font-black">{courseTitle}</h2><p className="mt-0.5 mb-0 text-xs font-bold text-[#8B857C]">장소를 넘기며 동선을 확인해보세요</p></div></header>
        <CourseRouteMap activeStopId={activeStopId} className="min-h-0 flex-1" routeStops={routeStops} />
        <div className="flex flex-none snap-x gap-3 overflow-x-auto bg-white px-5 py-4 pb-[calc(18px+env(safe-area-inset-bottom))]">{routeStops.length > 0 ? routeStops.map((stop, index) => <button className={`flex w-[78%] flex-none snap-center items-center gap-3 rounded-2xl border p-3 text-left ${activeStopId === stop.id ? "border-[#1F3D35] bg-[#EEF4EF]" : "border-[#E7E3DC] bg-white"}`} key={stop.id} onClick={() => setActiveStopId(stop.id)} type="button"><span className="grid size-9 flex-none place-items-center rounded-full bg-[#1F3D35] text-sm font-black text-white">{index + 1}</span><span className="min-w-0"><strong className="block truncate text-sm font-black">{stop.title}</strong><span className="mt-1 block truncate text-xs font-bold text-[#8B857C]">{stop.category}</span></span></button>) : <p className="m-0 w-full text-center text-sm font-black text-[#8B857C]">아직 추가한 장소가 없어요.</p>}</div>
      </section> : null}

      {placePickerOpen ? (
        <CoursePlacePickerOverlay
          isAdding={isAddingPoint}
          onClose={() => setPlacePickerOpen(false)}
          onConfirm={addPointsToCourse}
        />
      ) : null}

      <BottomSheet isOpen={copyOpen} onClose={() => setCopyOpen(false)} title="내 코스에 추가">
        <div className="grid gap-5">
          <section>
            <div className="flex items-center justify-between gap-3">
              <strong className="text-sm font-black text-[#24211E]">기존 코스에 담기</strong>
              <span className="text-xs font-black text-[#FD4003]">{routeStops.length}곳</span>
            </div>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto pr-1">
              {myCoursesQuery.isLoading ? (
                <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
                  내 코스를 불러오는 중이에요.
                </p>
              ) : copyTargets.length === 0 ? (
                <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
                  아직 담을 수 있는 내 코스가 없어요.
                </p>
              ) : (
                copyTargets.map((target) => {
                  const selected = copyTargetId === target.id;

                  return (
                    <button
                      className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left ${
                        selected
                          ? "border-[#1F3D35] bg-[#F0F5F1]"
                          : "border-[#EBE7E0] bg-white"
                      }`}
                      key={target.id}
                      onClick={() => setCopyTargetId(target.id)}
                      type="button"
                    >
                      <span className="grid size-10 flex-none place-items-center rounded-full bg-[#FFF0EA] text-sm font-black text-[#FD4003]">
                        {target.type === "api" ? "API" : "내"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-black text-[#24211E]">
                          {target.title}
                        </strong>
                        <span className="mt-1 block truncate text-xs font-bold text-[#928C84]">
                          {target.meta}
                        </span>
                      </span>
                      {selected ? (
                        <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white">
                          <CheckSquare size={15} />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
            <button
              className="mt-3 min-h-13 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]"
              disabled={!copyTargetId || isCopyingCourse}
              onClick={addPublicCourseToTarget}
              type="button"
            >
              {isCopyingCourse ? "담는 중..." : "선택한 코스에 담기"}
            </button>
          </section>

          <section className="border-t border-[#EEEAE3] pt-5">
            <strong className="text-sm font-black text-[#24211E]">새 코스로 담기</strong>
            <label className="mt-3 grid gap-2 text-xs font-black text-[#8B857C]">
              코스 이름
              <input
                className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 text-sm font-semibold text-[#24211E] outline-none focus:border-[#1F3D35]"
                maxLength={30}
                onChange={(event) => setCopyNewTitle(event.target.value)}
                value={copyNewTitle}
              />
            </label>
            <button
              className="mt-3 min-h-13 w-full rounded-2xl border-0 bg-[#FD4003] font-black text-white disabled:bg-[#F1C4B3]"
              disabled={isCopyingCourse || routeStops.length === 0}
              onClick={createCourseFromPublicCourse}
              type="button"
            >
              {isCopyingCourse ? "새 코스 만드는 중..." : "새 코스 만들어 담기"}
            </button>
          </section>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} title="일정 저장하기"><div className="grid gap-3"><button className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E9E5DE] bg-white px-4 text-left" onClick={saveAsImage} type="button"><span className="grid size-11 place-items-center rounded-xl bg-[#EEF4EF] text-[#1F3D35]"><Download size={21} /></span><span><strong className="block text-sm font-black">긴 일정 이미지로 저장하기</strong><span className="mt-1 block text-xs font-bold text-[#8B857C]">전체 리스트를 세로 이미지로 저장해요</span></span></button></div></BottomSheet>

      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title="코스 정보 편집">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-black text-[#24211E]">
            코스 제목
            <input
              className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 font-semibold outline-none focus:border-[#1F3D35]"
              maxLength={30}
              onChange={(event) => setEditTitle(event.target.value)}
              value={editTitle}
            />
          </label>
          <div className="grid gap-2 text-sm font-black text-[#24211E]">
            <div className="flex items-center justify-between gap-3">
              <span>여행 날짜</span>
              <label className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#E4DED3] bg-[#FAF8F4] px-3 text-xs font-black text-[#5F5A54]">
                <input
                  checked={!editDate}
                  className="size-4 accent-[#1F3D35]"
                  onChange={(event) => {
                    setEditDate(event.target.checked ? "" : new Date().toISOString().split("T")[0]);
                  }}
                  type="checkbox"
                />
                미정
              </label>
            </div>
            <CourseDraftCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelectDate={setEditDate}
              selectedDate={editDate}
              undecided={!editDate}
            />
          </div>
          <div className="grid grid-cols-[42px_1fr] items-center gap-2 text-sm font-black text-[#24211E]">
            <h3 className="m-0 text-sm font-extrabold">태그</h3>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
                {editTags.map((tag, index) => (
                  <label
                    className="inline-flex h-8 min-w-0 flex-none items-center gap-1 rounded-none bg-[#F5F5F5] px-2 text-xs font-bold text-[#4A4641]"
                    key={index}
                  >
                    <span className="font-black text-[#FD4003]">#</span>
                    <input
                      className="w-10 min-w-0 border-0 bg-transparent text-xs font-bold text-[#4A4641] outline-none"
                      maxLength={6}
                      onChange={(event) => {
                        const newTags = [...editTags];
                        newTags[index] = event.target.value.replace(/^#/, "");
                        setEditTags(newTags);
                      }}
                      placeholder="태그"
                      value={tag}
                    />
                    <button
                      aria-label={`${tag || "태그"} 태그 삭제`}
                      className="text-[#A8A8A8]"
                      onClick={() => setEditTags(editTags.filter((_, i) => i !== index))}
                      type="button"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </label>
                ))}
                <button
                  aria-label="태그 추가"
                  className="grid size-8 flex-none place-items-center bg-[#F5F5F5] text-[#A8A8A8] transition-colors hover:text-[#FD4003]"
                  onClick={() => setEditTags([...editTags, ""])}
                  type="button"
                >
                  <Plus size={15} strokeWidth={2.8} />
                </button>
              </div>
            </div>
          </div>
          <button
            className="min-h-14 rounded-2xl border-0 bg-[#FD4003] font-black text-white disabled:bg-[#F1C4B3] shadow-[0_6px_16px_rgba(253,64,3,0.16)]"
            disabled={isSavingEdit || !editTitle.trim()}
            onClick={saveCourseEdit}
            type="button"
          >
            {isSavingEdit ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} title="친구에게 코스 공유"><p className="mt-0 text-sm font-bold text-[#8B857C]">서비스 안에서 이미 친구가 된 사람에게만 공유 요청을 보낼 수 있어요. 친구가 알림에서 수락해야 코스를 볼 수 있고, 수락 후에도 수정은 코스장인 나만 할 수 있어요.</p><div className="mt-4 grid gap-2">{friendsQuery.isLoading ? <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">친구 목록을 불러오는 중이에요.</p> : (friendsQuery.data ?? []).length === 0 ? <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">아직 공유할 수 있는 친구가 없어요.</p> : (friendsQuery.data ?? []).map((friend) => { const selected = selectedFriends.includes(friend.userId); return <button className={`flex min-h-16 items-center gap-3 rounded-2xl border px-3 text-left ${selected ? "border-[#1F3D35] bg-[#F0F5F1]" : "border-[#EBE7E0] bg-white"}`} key={friend.userId} onClick={() => setSelectedFriends((current) => selected ? current.filter((userId) => userId !== friend.userId) : [...current, friend.userId])} type="button"><span className="grid size-11 place-items-center rounded-full bg-[#DDEADB] text-sm font-black text-[#1F3D35]">{friend.displayName.slice(0, 1).toUpperCase() || "?"}</span><span className="min-w-0 flex-1"><strong className="block truncate font-black">{friend.displayName}</strong><span className="mt-1 block truncate text-xs font-bold text-[#928C84]">{friend.email ?? "서비스 친구"} · 수락 후 보기 전용</span></span>{selected ? <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white"><CheckSquare size={15} /></span> : null}</button>; })}</div><button className="mt-5 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]" disabled={friendsQuery.isLoading} onClick={saveFriends} type="button">{selectedFriends.length > 0 ? `${selectedFriends.length}명에게 공유 요청 보내기` : "공유하지 않기"}</button></BottomSheet>

      <BottomSheet isOpen={optimizeOpen} onClose={() => setOptimizeOpen(false)} title="AI 동선 정리"><div className="rounded-2xl bg-[#EEF4EF] p-4"><div className="flex items-center gap-2 text-[#1F3D35]"><WandSparkles size={21} /><strong className="font-black">{isOptimizing ? "AI가 동선을 계산하고 있어요" : apiCourse ? "서버 추천 동선을 불러왔어요" : "걷는 시간을 약 18분 줄일 수 있어요"}</strong></div><p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#667069]">{apiCourse ? "적용하면 추천 순서를 내 코스에 저장해요." : "가까운 장소끼리 묶고 마지막 장소가 대중교통과 이어지도록 순서를 정리했어요."}</p></div><div className="mt-4 flex flex-wrap items-center gap-2">{(optimizedCourse ? toDisplayRouteStops(optimizedCourse) : routeStops).map((stop, index) => <span className="inline-flex items-center gap-1 text-xs font-black text-[#5D5852]" key={stop.id}><span className="grid size-6 place-items-center rounded-full bg-[#FD4003] text-white">{index + 1}</span>{stop.title}{index < routeStops.length - 1 ? <ChevronRight size={14} className="text-[#AAA49B]" /> : null}</span>)}</div><button className="mt-6 min-h-14 w-full rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#D8D4CC]" disabled={isOptimizing} onClick={applyOptimizedOrder} type="button">{isOptimizing ? "추천 받는 중..." : "이 순서로 적용하기"}</button></BottomSheet>

      {notice ? <div className="fixed inset-x-5 bottom-[calc(24px+env(safe-area-inset-bottom))] z-90 mx-auto max-w-[390px] rounded-2xl bg-[#171717] px-4 py-3 text-center text-sm font-black text-white shadow-xl">{notice}</div> : null}
    </>
  );
}

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
) {
  context.save();
  context.fillStyle = fillStyle;
  clipRoundRect(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

function clipRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + nextRadius, y);
  context.lineTo(x + width - nextRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  context.lineTo(x + width, y + height - nextRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - nextRadius,
    y + height,
  );
  context.lineTo(x + nextRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  context.lineTo(x, y + nextRadius);
  context.quadraticCurveTo(x, y, x + nextRadius, y);
  context.closePath();
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawSingleLineText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let nextText = text;
  while (nextText.length > 0 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }
  context.fillText(`${nextText}...`, x, y);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }

    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);

  lines.slice(0, maxLines).forEach((nextLine, index) => {
    const isLastVisibleLine = index === maxLines - 1 && lines.length > maxLines;
    drawSingleLineText(
      context,
      isLastVisibleLine ? `${nextLine}...` : nextLine,
      x,
      y + index * lineHeight,
      maxWidth,
    );
  });
}

function loadCanvasImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, title: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${title}.png`;
  link.click();
}

function CoursePlacePickerOverlay({
  isAdding,
  onClose,
  onConfirm,
}: {
  isAdding: boolean;
  onClose: () => void;
  onConfirm: (points: MapPoint[]) => void;
}) {
  type PickerTab = "place" | "note";
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedPoints, setSelectedPoints] = useState<MapPoint[]>([]);
  const [activeTab, setActiveTab] = useState<PickerTab>("place");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerOverlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [mapStatus, setMapStatus] = useState<
    "loading" | "ready" | "missing-key" | "error"
  >("loading");

  const location = useCurrentLocation();
  const requestLocation = location.requestLocation;
  const currentLocation =
    location.status === "success" ? location.coordinates : null;
  const [locationToast, setLocationToast] = useState<string | null>(null);
  const locationToastTimerRef = useRef<number | null>(null);
  const manualLocationRequestRef = useRef(false);
  const [locationConsent, setLocationConsent] = useState(readLocationConsent);

  const showLocationToast = useCallback((message: string) => {
    if (locationToastTimerRef.current) {
      window.clearTimeout(locationToastTimerRef.current);
    }

    setLocationToast(message);
    locationToastTimerRef.current = window.setTimeout(() => {
      setLocationToast(null);
      locationToastTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(
    () => () => {
      if (locationToastTimerRef.current) {
        window.clearTimeout(locationToastTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (locationConsent === "granted") {
      requestLocation();
    }
  }, [locationConsent, requestLocation]);

  useEffect(() => {
    if (location.status === "error" && manualLocationRequestRef.current) {
      manualLocationRequestRef.current = false;
      showLocationToast(location.error);
    }
  }, [location.error, location.status, showLocationToast]);

  const allowCurrentLocation = () => {
    saveLocationConsent("granted");
    setLocationConsent("granted");
  };

  const requestCurrentLocation = () => {
    if (!window.isSecureContext) {
      showLocationToast(
        "현재 위치를 사용하려면 HTTPS 연결이 필요해요.",
      );
      return;
    }

    manualLocationRequestRef.current = true;

    if (locationConsent !== "granted" || location.status === "error") {
      setLocationConsent("pending");
      return;
    }

    requestLocation();
  };

  const trimmedQuery = query.trim();
  const isSearching = submittedQuery.length > 0;
  const searchQuery = useQuery({
    enabled: isSearching,
    queryFn: () =>
      searchMap({
        coordinates: mapCenter,
        keyword: submittedQuery,
        radiusMeters: seoulMapRadiusMeters,
        target: "ALL",
      }),
    queryKey: ["course-add-map-search", submittedQuery],
  });
  const points = useMemo(() => {
    if (!isSearching) return [];
    const data = searchQuery.data;
    if (!data) return [];
    return toMapPoints(data.places, data.notes);
  }, [isSearching, searchQuery.data]);
  const placePoints = useMemo(
    () =>
      points.filter(
        (point): point is Extract<MapPoint, { kind: "place" }> =>
          point.kind === "place",
      ),
    [points],
  );
  const notePoints = useMemo(
    () =>
      points.filter(
        (point): point is Extract<MapPoint, { kind: "spot" }> =>
          point.kind === "spot",
      ),
    [points],
  );
  const activePoints = activeTab === "place" ? placePoints : notePoints;
  const isLoading = isSearching ? searchQuery.isLoading : false;

  useEffect(() => {
    if (activeTab === "place" && placePoints.length === 0 && notePoints.length > 0) {
      setActiveTab("note");
    } else if (
      activeTab === "note" &&
      notePoints.length === 0 &&
      placePoints.length > 0
    ) {
      setActiveTab("place");
    }
  }, [activeTab, notePoints.length, placePoints.length]);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMap().then((nextStatus) => {
      if (cancelled) return;
      setMapStatus(nextStatus);

      if (nextStatus !== "ready") return;
      if (!mapContainerRef.current || !window.kakao) {
        setMapStatus("error");
        return;
      }

      try {
        const kakaoMaps = window.kakao.maps;
        const map = new kakaoMaps.Map(mapContainerRef.current, {
          center: new kakaoMaps.LatLng(mapCenter.lat, mapCenter.lng),
          level: 5,
        });
        map.setMaxLevel(5);

        mapRef.current = map;
        window.requestAnimationFrame(() => {
          map.relayout();
          map.setCenter(new kakaoMaps.LatLng(mapCenter.lat, mapCenter.lng));
        });
      } catch {
        setMapStatus("error");
      }
    });

    return () => {
      cancelled = true;
      markerOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      markerOverlaysRef.current = [];
    };
  }, []);

  const handleTogglePoint = useCallback((point: MapPoint) => {
    setSelectedPoints((prev) => {
      const exists = prev.some((p) => p.id === point.id);
      if (exists) {
        return prev.filter((p) => p.id !== point.id);
      } else {
        return [...prev, point];
      }
    });
  }, []);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;

    if (mapStatus !== "ready" || !kakaoMaps || !map) return;

    markerOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    markerOverlaysRef.current = [];

    points.slice(0, 80).forEach((point) => {
      const selected = selectedPoints.some((p) => p.id === point.id);
      const marker = document.createElement("button");
      marker.type = "button";
      marker.setAttribute("aria-label", `${point.name} 선택`);
      marker.className = [
        "grid",
        "size-10",
        "place-items-center",
        "rounded-full",
        "border-2",
        "border-white",
        "text-xs",
        "font-black",
        "text-white",
        "shadow-[0_8px_18px_rgba(31,38,35,0.22)]",
        selected
          ? "bg-[#1F3D35]"
          : point.kind === "place"
            ? "bg-[#FD4003]"
            : "bg-[#7957F2]",
      ].join(" ");
      marker.textContent = selected ? "✓" : point.kind === "place" ? "장소" : "쪽지";
      marker.addEventListener("click", () => handleTogglePoint(point));

      const overlay = new kakaoMaps.CustomOverlay({
        content: marker,
        position: new kakaoMaps.LatLng(
          point.coordinates.lat,
          point.coordinates.lng,
        ),
        yAnchor: 0.5,
        zIndex: selected ? 1000 : 30,
      });
      overlay.setMap(map);
      markerOverlaysRef.current.push(overlay);
    });

    if (currentLocation) {
      const content = document.createElement("div");
      content.className = "current-location-marker";

      const overlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(
          currentLocation.lat,
          currentLocation.lng,
        ),
        content,
        yAnchor: 0.5,
        zIndex: 35,
      });
      overlay.setMap(map);
      markerOverlaysRef.current.push(overlay);
    }

    if (points[0]) {
      const centerPoint = selectedPoints[selectedPoints.length - 1] ?? points[0];
      map.panTo(
        new kakaoMaps.LatLng(
          centerPoint.coordinates.lat,
          centerPoint.coordinates.lng,
        ),
      );
    }

    return () => {
      markerOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      markerOverlaysRef.current = [];
    };
  }, [mapStatus, points, selectedPoints, currentLocation, handleTogglePoint]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;
    const lastSelected = selectedPoints[selectedPoints.length - 1];

    if (mapStatus !== "ready" || !kakaoMaps || !map || !lastSelected) return;

    map.panTo(
      new kakaoMaps.LatLng(
        lastSelected.coordinates.lat,
        lastSelected.coordinates.lng,
      ),
    );
  }, [mapStatus, selectedPoints]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;

    if (mapStatus !== "ready" || !kakaoMaps || !map || !currentLocation) return;

    map.panTo(
      new kakaoMaps.LatLng(
        currentLocation.lat,
        currentLocation.lng,
      ),
    );
  }, [mapStatus, currentLocation]);

  function submitSearch() {
    setSubmittedQuery(trimmedQuery);
    setSelectedPoints([]);
  }

  return (
    <section className="fixed inset-0 z-[80] mx-auto flex w-full max-w-[430px] flex-col bg-white text-[#171717]">
      <header className="flex items-center gap-3 px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-4">
        <button
          aria-label="장소 추가 닫기"
          className="grid size-10 place-items-center rounded-full border-0 bg-[#F4F2EE]"
          onClick={onClose}
          type="button"
        >
          <X size={21} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 truncate text-lg font-black">장소 추가하기</h2>
          <p className="mt-0.5 mb-0 text-xs font-bold text-[#8B857C]">
            지도에서 하나를 선택한 뒤 체크로 추가해요.
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E7F0E8]">
        <div className="absolute inset-x-4 top-3 z-20">
          <MapSearchBar
            onQueryChange={setQuery}
            onSubmit={submitSearch}
            placeholder="추가할 장소나 쪽지 검색"
            query={query}
          />
        </div>
        <div className="absolute inset-0 overflow-hidden bg-[#DDF0E3]">
          {mapStatus === "missing-key" || mapStatus === "error" ? (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.56)_0_14%,transparent_14%_100%),linear-gradient(25deg,transparent_0_47%,rgba(118,190,216,0.45)_47%_70%,transparent_70%_100%)]" />
              <div className="absolute left-[10%] top-[24%] h-1 w-[72%] rotate-[-9deg] rounded-full bg-[#D2D7DF]" />
              <div className="absolute left-[20%] top-[60%] h-1 w-[64%] rotate-[8deg] rounded-full bg-[#D2D7DF]" />
              {points.slice(0, 24).map((point) => {
                const position = getFallbackPosition(point.coordinates);
                const selected = selectedPoints.some((p) => p.id === point.id);

                return (
                  <button
                    aria-label={`${point.name} 선택`}
                    className={`absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-black shadow-[0_8px_18px_rgba(31,38,35,0.22)] ${
                      selected
                        ? "border-white bg-[#1F3D35] text-white"
                        : point.kind === "place"
                          ? "border-white bg-[#FD4003] text-white"
                          : "border-white bg-[#7957F2] text-white"
                    }`}
                    key={point.id}
                    onClick={() => handleTogglePoint(point)}
                    style={position}
                    type="button"
                  >
                    {selected ? <CheckSquare size={18} /> : point.kind === "place" ? "장소" : "쪽지"}
                  </button>
                );
              })}
            </>
          ) : (
            <div
              aria-label="장소 추가 카카오 지도"
              className="h-full w-full"
              ref={mapContainerRef}
            />
          )}
          {mapStatus === "loading" || isLoading ? (
            <div className="absolute inset-0 grid place-items-center bg-[#E7F0E8]/80 text-sm font-black text-[#1F3D35]">
              {mapStatus === "loading" ? "카카오맵을 불러오는 중..." : "장소를 불러오는 중..."}
            </div>
          ) : null}
        </div>

        {/* GPS 현위치 탐색 버튼 */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            className="grid size-10 touch-manipulation select-none place-items-center rounded-full border border-black/5 bg-white text-[#1e2a26] shadow-[0_6px_15px_rgba(17,17,17,0.16)]"
            onClick={requestCurrentLocation}
            type="button"
            aria-label="현재 위치"
          >
            <Crosshair size={18} strokeWidth={2.4} />
          </button>
        </div>

        {/* 위치 권한 및 에러 관련 Toast */}
        {locationToast ? (
          <p className="absolute right-4 left-4 bottom-16 z-30 m-0 rounded-xl bg-white/95 px-3 py-2.5 text-sm font-extrabold text-[#24463d] shadow-[0_10px_24px_rgba(17,17,17,0.12)]">
            {locationToast}
          </p>
        ) : null}
      </div>

      {locationConsent === "pending" ? (
        <LocationConsentDialog
          onAllow={allowCurrentLocation}
          onSkip={() => {
            manualLocationRequestRef.current = false;
            saveLocationConsent("declined");
            setLocationConsent("declined");
          }}
        />
      ) : null}

      <div className="flex max-h-[46dvh] flex-none flex-col rounded-t-[22px] bg-white px-4 pt-3 pb-[calc(18px+env(safe-area-inset-bottom))] shadow-[0_-14px_34px_rgba(17,17,17,0.18)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <strong className="text-sm font-black">
            {isSearching ? `"${submittedQuery}" 검색 결과` : "주변 장소와 쪽지"}
          </strong>
          <button
            className="h-10 rounded-full border-0 bg-[#1F3D35] px-4 text-sm font-extrabold text-white disabled:bg-[#D8D4CC]"
            disabled={selectedPoints.length === 0 || isAdding}
            onClick={() => onConfirm(selectedPoints)}
            type="button"
          >
            {isAdding
              ? "추가 중..."
              : selectedPoints.length > 0
                ? `${selectedPoints.length}개 추가하기`
                : "체크한 항목 추가"}
          </button>
        </div>
        <div
          aria-label="추가 항목 종류"
          className="mb-3 grid grid-cols-2 rounded-2xl bg-white p-1"
          role="tablist"
        >
          {([
            ["place", "장소", placePoints.length],
            ["note", "쪽지", notePoints.length],
          ] as const).map(([value, label, count]) => (
            <button
              aria-selected={activeTab === value}
              className={`h-10 rounded-xl text-sm font-black ${
                activeTab === value
                  ? "bg-[#F4F3EF] text-[#171717]"
                  : "bg-transparent text-[#888178]"
              }`}
              key={value}
              onClick={() => setActiveTab(value)}
              role="tab"
              type="button"
            >
              {label} <span className="text-[11px]">{count}</span>
            </button>
          ))}
        </div>
        <div className="min-h-0 overflow-y-auto">
          {points.length === 0 && !isLoading ? (
            <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
              검색 결과가 없어요.
            </p>
          ) : activePoints.length === 0 && !isLoading ? (
            <p className="m-0 rounded-2xl bg-[#F6F5F1] p-4 text-sm font-black text-[#8B857C]">
              표시할 {activeTab === "place" ? "장소" : "쪽지"}가 없어요.
            </p>
          ) : activeTab === "note" ? (
            <div className="-mx-4">
              <div className="flex touch-pan-x snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {notePoints.map((point) => (
                  <CoursePickerNoteCard
                    key={point.id}
                    onSelect={() => handleTogglePoint(point)}
                    point={point}
                    selected={selectedPoints.some((p) => p.id === point.id)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {placePoints.map((point) => (
                <CoursePickerPlaceCard
                  key={point.id}
                  onSelect={() => handleTogglePoint(point)}
                  point={point}
                  selected={selectedPoints.some((p) => p.id === point.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CoursePickerPlaceCard({
  onSelect,
  point,
  selected,
}: {
  onSelect: () => void;
  point: Extract<MapPoint, { kind: "place" }>;
  selected: boolean;
}) {
  const detailLabel = point.source.tags.slice(0, 3).join(" · ");
  const neighborhood = getNeighborhoodLabel(point.source.area);

  return (
    <article
      className={`relative h-[176px] overflow-hidden rounded-[20px] bg-[#302d2a] shadow-[0_8px_20px_rgba(17,17,17,0.12)] transition ${
        selected ? "ring-3 ring-[#1F3D35]" : ""
      }`}
    >
      {point.source.imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          loading="lazy"
          src={point.source.imageUrl}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[#4a4641] text-white/70">
          <MapIcon size={34} />
        </span>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/5" />
      <button
        aria-label={`${point.name} 선택`}
        className="absolute inset-0 z-10 border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#242424] shadow-[0_2px_6px_rgba(17,17,17,0.12)]">
          {neighborhood}
        </span>
        <span
          className={`absolute top-3 right-3 grid size-8 place-items-center rounded-full border-2 border-white text-white shadow-[0_4px_10px_rgba(0,0,0,0.22)] ${
            selected ? "bg-[#1F3D35]" : "bg-black/35"
          }`}
        >
          {selected ? <CheckSquare size={17} /> : null}
        </span>
        <span className="absolute right-4 bottom-3 left-4 text-white">
          <strong className="block truncate text-[1.02rem] leading-tight font-extrabold">
            {point.name}
          </strong>
          <span className="mt-1 block truncate text-[11px] font-medium text-white/80">
            {point.source.area}
          </span>
          {detailLabel ? (
            <span className="mt-1 block truncate text-[11px] font-bold text-white/80">
              {detailLabel}
            </span>
          ) : null}
        </span>
      </button>
    </article>
  );
}

function CoursePickerNoteCard({
  onSelect,
  point,
  selected,
}: {
  onSelect: () => void;
  point: Extract<MapPoint, { kind: "spot" }>;
  selected: boolean;
}) {
  return (
    <div className="relative snap-center">
      <NoteCard
        note={{
          authorName: point.authorName,
          body: point.source.body,
          createdAt: point.source.createdAt,
          id: point.id,
          imageAlt: point.source.placeName,
          imageUrl: point.source.imageUrl,
          locationLabel: getNeighborhoodLabel(point.source.placeName),
          profileImageUrl: point.authorAvatarUrl,
          saved: point.saved,
        }}
        onSelect={onSelect}
        selected={selected}
        showAddToCourse={false}
        showSavedIcon={false}
      />
      <button
        aria-label={`${point.name} 선택`}
        className={`absolute top-3 right-3 z-20 grid size-8 place-items-center rounded-full border-2 border-white text-white shadow-[0_4px_10px_rgba(0,0,0,0.16)] ${
          selected ? "bg-[#1F3D35]" : "bg-black/35"
        }`}
        onClick={onSelect}
        type="button"
      >
        {selected ? <CheckSquare size={17} /> : null}
      </button>
    </div>
  );
}

function toSavedCourseStop(point: MapPoint): SavedCourseStop {
  const numericId = getNumericPointId(point.id);

  if (point.kind === "place") {
    return {
      attractionId: numericId ?? undefined,
      category: point.source.tags[0] ?? "장소",
      description: point.source.summary,
      id: 1,
      imageUrl: point.source.imageUrl,
      lat: point.coordinates.lat,
      lng: point.coordinates.lng,
      title: point.name,
    };
  }

  return {
    category: "쪽지",
    description: point.source.body,
    id: 1,
    imageUrl: point.source.imageUrl ?? "",
    lat: point.coordinates.lat,
    lng: point.coordinates.lng,
    noteId: numericId ?? undefined,
    title: point.source.placeName || point.name,
  };
}

function toCourseItemRequest(
  stop: CourseStop,
  index: number,
): CourseItemRequest | null {
  const sourceItem = stop.sourceItem;

  if (sourceItem?.attractionId) {
    return {
      attractionId: sourceItem.attractionId,
      day: sourceItem.day || 1,
      itemType: "ATTRACTION",
      memo: sourceItem.memo ?? stop.description,
      position: index + 1,
      stayMinutes: sourceItem.stayMinutes ?? 60,
    };
  }

  if (sourceItem?.noteId) {
    return {
      day: sourceItem.day || 1,
      itemType: "NOTE",
      memo: sourceItem.memo ?? stop.description,
      noteId: sourceItem.noteId,
      position: index + 1,
      stayMinutes: sourceItem.stayMinutes ?? 60,
    };
  }

  return {
    day: 1,
    itemType: "ATTRACTION",
    memo: stop.title,
    position: index + 1,
    stayMinutes: 60,
  };
}

function appendStopsToCourseRequest(
  course: CourseResponse,
  stops: CourseStop[],
): Omit<CourseCreateRequest, "id"> {
  const currentItems = sortedCourseItems(course).map((item) => ({
    attractionId: item.attractionId ?? undefined,
    day: item.day,
    itemType: item.itemType,
    memo: item.memo ?? undefined,
    noteId: item.noteId ?? undefined,
    position: item.position,
    stayMinutes: item.stayMinutes ?? undefined,
  }));
  const startPosition = currentItems.reduce(
    (max, item) => Math.max(max, item.position ?? 0),
    0,
  );
  const nextItems = stops.flatMap((stop, index) => {
    const item = toCourseItemRequest(stop, index);
    return item ? [{ ...item, position: startPosition + index + 1 }] : [];
  });

  return {
    ...toCourseUpdateRequest(course),
    items: [...currentItems, ...nextItems],
  };
}

function createCourseRequestFromStops({
  id,
  sourceCourse,
  stops,
  title,
}: {
  id: string;
  sourceCourse: CourseResponse;
  stops: CourseStop[];
  title: string;
}): CourseCreateRequest | null {
  const items = stops.flatMap((stop, index) => {
    const item = toCourseItemRequest(stop, index);
    return item ? [item] : [];
  });

  if (items.length === 0) return null;

  return {
    coverImageUrl: sourceCourse.coverImageUrl ?? stops[0]?.imageUrl,
    description: sourceCourse.description ?? "탐색한 코스",
    id,
    items,
    regionName: sourceCourse.regionName ?? stops[0]?.location,
    status: "READY",
    title,
    visibility: "PRIVATE",
  };
}

function toSavedStops(stops: CourseStop[]): SavedCourseStop[] {
  return stops.map((stop, index) => ({
    attractionId: stop.sourceItem?.attractionId ?? undefined,
    category: stop.category.split(" · ")[0] ?? "장소",
    description: stop.description,
    id: index + 1,
    imageUrl: stop.imageUrl || fallbackCourseImage,
    lat: stop.coordinates.lat,
    lng: stop.coordinates.lng,
    noteId: stop.sourceItem?.noteId ?? undefined,
    title: stop.title,
  }));
}

function getNumericPointId(id: string) {
  const value = Number(id.replace(/^(place|note)-/, ""));
  return Number.isFinite(value) ? value : null;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}
