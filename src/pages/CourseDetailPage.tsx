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

function CourseRouteDrawer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.section
      aria-label="day 1 경로"
      className="absolute inset-x-0 top-[236px] bottom-[-96px] z-20 flex flex-col rounded-t-[28px] bg-[#F8F7F3] shadow-[0_-14px_32px_rgba(17,17,17,0.12)]"
      drag="y"
      dragConstraints={{ bottom: 0, top: -96 }}
      dragElastic={0.06}
      initial={{ y: 42 }}
      animate={{ y: isExpanded ? -96 : 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -28 || info.velocity.y < -420) {
          setIsExpanded(true);
          return;
        }

        if (info.offset.y > 28 || info.velocity.y > 420) {
          setIsExpanded(false);
        }
      }}
    >
      <div className="flex-none px-5 pt-2">
        <button
          aria-label={isExpanded ? "경로 드로어 내리기" : "경로 드로어 올리기"}
          className="mx-auto mb-4 block h-1.5 w-12 rounded-full border-0 bg-[#D8D5CE] p-0"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        />
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

      <div className="flex-1 overflow-y-auto px-5 pb-[calc(116px+env(safe-area-inset-bottom))]">
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

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#F8F7F3] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <div className="bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-5">
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
          <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#4B8DFF] px-4 text-sm font-black text-white">
            <Plus size={20} />
            장소 추가하기
          </button>
          <button className="inline-flex h-10 flex-none items-center gap-1.5 rounded-full bg-[#4B8DFF] px-4 text-sm font-black text-white">
            <CheckSquare size={19} />
            AI 동선 정리
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]">
            <Plane size={17} />
            교통
          </button>
          <button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]">
            <WalletCards size={17} />
            예산
          </button>
          <button className="inline-flex h-9 flex-none items-center gap-1.5 rounded-full bg-[#F3F3F3] px-4 text-sm font-black text-[#777]">
            <ReceiptText size={17} />
            체크리스트
          </button>
        </div>
      </div>

      <div
        className="relative h-[calc(100dvh-312px)] min-h-[540px] overflow-hidden bg-[#E7F0E8]"
        data-testid="course-route-stage"
      >
        <CourseRouteMap className="h-[278px]" />
        <CourseRouteDrawer />
      </div>
    </section>
  );
}
