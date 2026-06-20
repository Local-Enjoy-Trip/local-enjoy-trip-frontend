import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  homeLocationOptions,
  homeLocations,
  type HomeLocation,
} from "@/features/home/types/homeTypes";
import type { KakaoMapInstance } from "@/features/map/types";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";

type LocationSelectorProps = {
  selectedLocation: HomeLocation;
  isOpen: boolean;
  hint?: string;
  onToggle: () => void;
  onSelect: (location: HomeLocation) => void;
};

export function LocationSelector({
  selectedLocation,
  isOpen,
  hint = "방문할 곳을 변경할 수 있어요",
  onToggle,
  onSelect,
}: LocationSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const selectedLocationOption =
    homeLocationOptions.find((location) => location.label === selectedLocation) ??
    homeLocationOptions[0];
  const [mapStatus, setMapStatus] = useState<
    "idle" | "loading" | "ready" | "missing-key" | "error"
  >("idle");

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setMapStatus("loading");

    loadKakaoMap().then((status) => {
      if (cancelled) return;

      if (status !== "ready") {
        setMapStatus(status);
        return;
      }

      if (!mapContainerRef.current || !window.kakao) {
        setMapStatus("error");
        return;
      }

      const kakaoMaps = window.kakao.maps;
      const center = new kakaoMaps.LatLng(
        selectedLocationOption.coordinates.lat,
        selectedLocationOption.coordinates.lng
      );

      mapRef.current = new kakaoMaps.Map(mapContainerRef.current, {
        center,
        level: 5,
      });

      window.requestAnimationFrame(() => {
        mapRef.current?.relayout();
        mapRef.current?.setCenter(center);
      });

      setMapStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedLocationOption]);

  return (
    <div className="relative mt-5 flex flex-wrap items-center gap-3">
      <button
        className="inline-flex items-center gap-1.5 rounded-full bg-(--spot-app-surface) px-4 py-2.5 text-[1.15rem] font-black text-(--spot-app-text) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="방문할 동네 변경"
      >
        {selectedLocation}
        <ChevronDown
          className={
            isOpen ? "rotate-180 transition-transform" : "transition-transform"
          }
          size={22}
          strokeWidth={3}
        />
      </button>
      <span className="relative rounded-2xl bg-(--spot-app-surface) px-3.5 py-3.5 text-xs font-black text-(--spot-app-text-soft) shadow-[0_8px_20px_var(--spot-app-shadow)] transition-colors before:absolute before:left-[-6px] before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rotate-45 before:bg-(--spot-app-surface)">
        {hint}
      </span>

      {isOpen ? (
        <div className="absolute left-0 top-[52px] z-20 w-[min(355px,calc(100vw-40px))] overflow-hidden rounded-[24px] bg-(--spot-app-surface) p-2 shadow-[0_18px_40px_var(--spot-app-shadow-strong)]">
          <div className="relative h-[174px] overflow-hidden rounded-[19px] bg-[#e8eee9]">
            <div ref={mapContainerRef} className="h-full w-full" />
            {mapStatus !== "ready" ? (
              <div className="absolute inset-0 overflow-hidden bg-[#e9f0ec]">
                <div className="mock-map-grid" />
                <div className="absolute inset-0 grid place-items-center text-xs font-black text-[#5f6f67]">
                  {mapStatus === "loading"
                    ? "동네 지도를 불러오는 중"
                    : "지도 미리보기"}
                </div>
              </div>
            ) : null}
            <div className="pointer-events-none absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-full place-items-center rounded-full bg-[#FF4300] text-white shadow-[0_12px_24px_rgba(17,17,17,0.22)]">
              <MapPin size={23} fill="currentColor" strokeWidth={2.2} />
            </div>
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/92 px-3 py-2 shadow-[0_8px_18px_rgba(17,17,17,0.13)] backdrop-blur">
              <strong className="block text-sm font-black text-[#111]">
                {selectedLocationOption.label}
              </strong>
              <span className="block truncate text-[0.72rem] font-bold text-[#777]">
                {selectedLocationOption.weatherArea}
              </span>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {homeLocations.map((location) => {
              const isSelected = selectedLocation === location;

              return (
                <button
                  className={`min-h-10 rounded-xl px-2 text-sm font-black transition-[background-color,color] ${
                    isSelected
                      ? "bg-(--spot-app-soft-accent) text-[#FF4300]"
                      : "bg-transparent text-(--spot-app-text)"
                  }`}
                  key={location}
                  type="button"
                  onClick={() => onSelect(location)}
                  aria-pressed={isSelected}
                >
                  {location}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
