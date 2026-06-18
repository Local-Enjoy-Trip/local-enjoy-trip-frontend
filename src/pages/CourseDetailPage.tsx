import {
  ArrowLeft,
  CheckSquare,
  ChevronDown,
  Menu,
  Navigation,
  Plane,
  Plus,
  ReceiptText,
  Share2,
  Star,
  WalletCards,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Coordinates } from "@/shared/types/domain";
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

const stops: CourseStop[] = [
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

function getRouteCenter() {
  return stops.reduce(
    (center, stop) => ({
      lat: center.lat + stop.coordinates.lat / stops.length,
      lng: center.lng + stop.coordinates.lng / stops.length,
    }),
    { lat: 0, lng: 0 },
  );
}

function FallbackRouteMapPreview() {
  const markers = [
    { id: 1, className: "left-[16%] top-[64%]", color: "bg-[#7957F2]" },
    { id: 2, className: "left-[37%] top-[58%]", color: "bg-[#7957F2]" },
    { id: 3, className: "left-[54%] top-[40%]", color: "bg-[#F56565]" },
    { id: 4, className: "left-[76%] top-[30%]", color: "bg-[#49BFB0]" },
  ];

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

function CourseRouteMap({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
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
        const center = getRouteCenter();
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
  }, []);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    const map = mapRef.current;

    if (status !== "ready" || !kakaoMaps || !map) return;

    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    polylineRef.current?.setMap(null);

    const path = stops.map(
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

    stops.forEach((stop) => {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = `course-route-marker ${markerColorClass[stop.accent]}`;
      marker.textContent = String(stop.id);
      marker.setAttribute("aria-label", `${stop.id}. ${stop.title}`);

      const overlay = new kakaoMaps.CustomOverlay({
        content: marker,
        position: new kakaoMaps.LatLng(stop.coordinates.lat, stop.coordinates.lng),
        yAnchor: 0.5,
        zIndex: 20 + stop.id,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });
  }, [status]);

  return (
    <section
      className={`relative overflow-hidden bg-[#DDF0E3] ${className}`}
      data-testid="course-route-map"
    >
      {status === "missing-key" || status === "error" ? (
        <FallbackRouteMapPreview />
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
  drawerCoverOffset,
  drawerTop,
  headerOffset,
  setDrawerCoverOffset,
  setHeaderOffset,
}: {
  drawerCoverOffset: number;
  drawerTop: number;
  headerOffset: number;
  setDrawerCoverOffset: Dispatch<SetStateAction<number>>;
  setHeaderOffset: Dispatch<SetStateAction<number>>;
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

  function moveDrawerFromScroll(deltaY: number) {
    const scroller = scrollerRef.current;
    const isMovingTowardLowerContent = deltaY > 0;
    const isMovingBackToTop = deltaY < 0;
    const isScrollerAtTop = !scroller || scroller.scrollTop <= 0;

    if (
      isMovingTowardLowerContent &&
      headerOffset < HEADER_COLLAPSE_DISTANCE
    ) {
      setHeaderOffset((current) =>
        Math.min(HEADER_COLLAPSE_DISTANCE, current + deltaY),
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
    if (moveDrawerFromScroll(event.deltaY)) {
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

    if (moveDrawerFromScroll(deltaY)) {
      event.preventDefault();
    }
  }

  return (
    <motion.section
      aria-label="day 1 경로"
      className="absolute inset-x-0 bottom-[-96px] z-20 flex flex-col bg-[#F8F7F3] shadow-[0_-14px_32px_rgba(17,17,17,0.12)]"
      initial={{ top: 278 }}
      animate={{
        borderTopLeftRadius: isExpanded ? 0 : 28,
        borderTopRightRadius: isExpanded ? 0 : 28,
        top: drawerTop,
      }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <div className="flex-none px-5">
        <button
          aria-label={isExpanded ? "경로 드로어 내리기" : "경로 드로어 올리기"}
          className="mx-auto grid h-11 w-24 cursor-grab place-items-center border-0 bg-transparent p-0 touch-none active:cursor-grabbing"
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
        <div className="mb-4 flex items-center justify-between">
          <button
            className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-left"
            type="button"
          >
            <span className="text-[1.35rem] font-black text-[#333]">day 1</span>
            <span className="text-[1.25rem] font-black text-[#B0AAA3]">
              6.17/수
            </span>
            <ChevronDown size={22} className="text-[#333]" />
          </button>
          <button
            className="border-0 bg-transparent p-0 text-lg font-black text-[#777]"
            type="button"
          >
            편집
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(192px+env(safe-area-inset-bottom))]"
        data-testid="course-route-drawer-scroller"
        onTouchMove={handleListTouchMove}
        onTouchStart={handleListTouchStart}
        onWheel={handleListWheel}
        ref={scrollerRef}
      >
        {stops.map((stop) => (
          <StopTimelineItem key={stop.id} stop={stop} />
        ))}
      </div>
    </motion.section>
  );
}

function StopTimelineItem({ stop }: { stop: CourseStop }) {
  return (
    <div className="grid grid-cols-[76px_1fr] gap-3">
      <div className="relative flex flex-col items-center">
        {stop.distanceFromPrevious ? (
          <span className="mb-3 rounded-lg border border-[#ECE8E0] bg-white px-2.5 py-1 text-sm font-black text-[#5F5A54] shadow-[0_4px_12px_rgba(31,38,35,0.04)]">
            {stop.distanceFromPrevious}
          </span>
        ) : (
          <span className="mb-3 h-8" />
        )}
        <span
          className={`z-10 grid size-9 place-items-center rounded-full text-base font-black ${accentClass[stop.accent]}`}
        >
          {stop.id}
        </span>
        {stop.id < stops.length ? (
          <span className="absolute top-[76px] bottom-[-36px] w-px bg-[#E6E1D8]" />
        ) : null}
      </div>

      <article className="mb-4 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(31,38,35,0.06)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-[1.15rem] font-black text-[#272727]">
              {stop.title}
            </h3>
            <p className="mt-1 mb-0 text-sm font-bold text-[#9A958E]">
              {stop.category}
            </p>
          </div>
          <button
            aria-label={`${stop.title} 리뷰`}
            className="grid size-10 flex-none place-items-center rounded-full border-0 bg-transparent text-[#D7D4CF]"
            type="button"
          >
            <Star size={24} fill="currentColor" />
          </button>
        </div>
      </article>
    </div>
  );
}

export function CourseDetailPage() {
  const navigate = useNavigate();
  const [drawerCoverOffset, setDrawerCoverOffset] = useState(0);
  const [headerOffset, setHeaderOffset] = useState(0);
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

  return (
    <section className="flex h-dvh flex-col overflow-hidden bg-[#F8F7F3] text-[#111]">
      <motion.div
        animate={{ height: headerHeight }}
        className="relative flex-none overflow-hidden bg-white"
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
      >
        <div
          className="absolute inset-x-0 top-0 px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-5"
          style={{
            transform: `translateY(-${headerOffset}px)`,
            pointerEvents: isHeaderCompact ? "none" : "auto",
          }}
        >
          <header className="flex items-center justify-between">
            <button
              aria-label="뒤로 가기"
              className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft size={27} />
            </button>
            <div className="flex items-center gap-3">
              <button
                aria-label="공유"
                className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Share2 size={24} />
              </button>
              <button
                aria-label="지도 보기"
                className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Navigation size={24} />
              </button>
              <button
                aria-label="메뉴"
                className="relative grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Menu size={27} />
                <span className="absolute right-1 top-1 size-2.5 rounded-full bg-[#F04466]" />
              </button>
            </div>
          </header>

          <div className="mt-5">
            <div className="flex items-end gap-2">
              <h1 className="m-0 text-[1.85rem] leading-tight font-black text-[#333]">
                망원 하루 코스
              </h1>
              <button
                className="mb-1 border-0 bg-transparent p-0 text-base font-black text-[#9A958E]"
                type="button"
              >
                편집
              </button>
            </div>
            <p className="mt-1.5 mb-0 text-lg font-black text-[#777]">
              2026.6.17
            </p>
            <p className="mt-1.5 mb-0 text-base font-bold text-[#777]">
              혼자 | 로컬 산책
            </p>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            <button
              className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#4B8DFF] px-4 text-sm font-black text-white"
            >
              <Plus size={20} />
              장소 추가하기
            </button>
            <button
              className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#4B8DFF] px-4 text-sm font-black text-white"
            >
              <CheckSquare size={19} />
              AI 동선 정리
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"
            >
              <Plane size={17} />
              교통
            </button>
            <button
              className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"
            >
              <WalletCards size={17} />
              예산
            </button>
            <button
              className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]"
            >
              <ReceiptText size={17} />
              체크리스트
            </button>
          </div>
        </div>

        <div
          className="absolute inset-x-0 top-0 z-10 bg-white px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-3"
          style={{
            opacity: isHeaderCompact ? 1 : 0,
            pointerEvents: isHeaderCompact ? "auto" : "none",
          }}
        >
          <header className="flex items-center gap-2">
            <button
              aria-label="뒤로 가기"
              className="grid size-8 flex-none place-items-center rounded-full border-0 bg-transparent text-[#333]"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ArrowLeft size={23} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="m-0 truncate text-sm leading-tight font-black text-[#555]">
                  망원 하루 코스
                </h1>
                <button
                  className="flex-none border-0 bg-transparent p-0 text-xs font-black text-[#9A958E]"
                  type="button"
                >
                  편집
                </button>
              </div>
              <p className="mt-0.5 mb-0 text-xs font-bold text-[#9A958E]">
                2026.6.17 · 혼자 · 로컬 산책
              </p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              <button
                aria-label="공유"
                className="grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Share2 size={20} />
              </button>
              <button
                aria-label="지도 보기"
                className="grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Navigation size={20} />
              </button>
              <button
                aria-label="메뉴"
                className="relative grid size-8 place-items-center rounded-full border-0 bg-transparent text-[#333]"
                type="button"
              >
                <Menu size={22} />
                <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-[#F04466]" />
              </button>
            </div>
          </header>

        </div>
      </motion.div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden bg-[#E7F0E8]"
        data-testid="course-route-stage"
      >
        <CourseRouteMap className="h-[278px]" />
        <CourseRouteDrawer
          drawerCoverOffset={drawerCoverOffset}
          drawerTop={drawerTop}
          headerOffset={headerOffset}
          setDrawerCoverOffset={setDrawerCoverOffset}
          setHeaderOffset={setHeaderOffset}
        />
      </div>
    </section>
  );
}
