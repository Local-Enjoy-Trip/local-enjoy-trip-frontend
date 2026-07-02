import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import type {
  KakaoCustomOverlay,
  KakaoMapInstance,
  KakaoPolyline,
} from "@/features/map/types";
import type { CourseStop } from "./types";

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

export function CourseRouteMap({
  activeStopId,
  className = "",
  routeStops,
  style,
}: {
  activeStopId: number;
  className?: string;
  routeStops: CourseStop[];
  style?: CSSProperties;
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
  const routeCenter = useMemo(
    () => (routeStops.length > 0 ? getRouteCenter(routeStops) : null),
    [routeStops],
  );

  useEffect(() => {
    let cancelled = false;

    if (!routeCenter) {
      setStatus("ready");
      return;
    }

    setStatus((current) => (current === "ready" ? current : "loading"));

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

        if (mapRef.current) {
          const map = mapRef.current;
          const relayout = () => {
            map.relayout();
            map.setCenter(new kakaoMaps.LatLng(routeCenter.lat, routeCenter.lng));
          };

          setStatus("ready");
          window.requestAnimationFrame(relayout);
          window.setTimeout(relayout, 120);
          return;
        }

        const map = new kakaoMaps.Map(containerRef.current, {
          center: new kakaoMaps.LatLng(routeCenter.lat, routeCenter.lng),
          level: 5,
        });

        mapRef.current = map;
        setStatus("ready");

        const relayout = () => {
          map.relayout();
          map.setCenter(new kakaoMaps.LatLng(routeCenter.lat, routeCenter.lng));
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
    };
  }, [routeCenter]);

  useEffect(
    () => () => {
      overlaysRef.current.forEach((overlay) => overlay.setMap(null));
      polylineRef.current?.setMap(null);
      overlaysRef.current = [];
      overlaysByStopIdRef.current.clear();
      markerElementsRef.current.clear();
      mapRef.current = null;
    },
    [],
  );

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
      style={style}
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
