import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Crosshair, Map as MapIcon, X } from "lucide-react";
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
  MapPoint,
} from "@/features/map/types";
import { NoteCard } from "@/features/notes/components/NoteCard";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";

const seoulMapRadiusMeters = 30_000;

export function CoursePlacePickerOverlay({
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
