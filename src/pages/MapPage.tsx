import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { getMapPins } from "@/shared/api/mockApi";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import { FallbackMapLayer } from "@/features/map/components/FallbackMapLayer";
import { MapFilterChips } from "@/features/map/components/MapFilterChips";
import { MapLocateButton } from "@/features/map/components/MapLocateButton";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { MapVisibleDrawer } from "@/features/map/components/MapVisibleDrawer";
import { useKakaoMap } from "@/features/map/hooks/useKakaoMap";
import { isInBounds } from "@/features/map/lib/kakaoMap";
import {
  clusterPoints,
  filterMapPoints,
  getFriends,
  toMapPoints,
} from "@/features/map/lib/mapPoints";
import { useMapStore } from "@/features/map/mapStore";
import type { MapPoint } from "@/features/map/types";

export function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["map-pins"],
    queryFn: getMapPins,
  });
  const {
    filter,
    selectedFriend,
    selectedPinId,
    selectPin,
    setFilter,
    setSelectedFriend,
  } = useMapStore();
  const location = useCurrentLocation();
  const requestLocation = location.requestLocation;
  const requestedInitialLocationRef = useRef(false);
  const [query, setQuery] = useState("");
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  const allPoints = useMemo(() => {
    if (!data) return [];
    return toMapPoints(data.places, data.notes);
  }, [data]);

  const friends = useMemo(() => {
    if (!data) return [];
    return getFriends(data.notes);
  }, [data]);

  const filteredPoints = useMemo(
    () =>
      filterMapPoints({
        filter,
        points: allPoints,
        query,
        selectedFriend,
      }),
    [allPoints, filter, query, selectedFriend],
  );

  const kakao = useKakaoMap(filteredPoints, selectPin);
  const recenterMapTo = kakao.recenterTo;

  const visiblePoints = useMemo(
    () =>
      filteredPoints.filter((point) =>
        isInBounds(point.coordinates, kakao.bounds),
      ),
    [filteredPoints, kakao.bounds],
  );

  const fallbackClusters = useMemo(
    () => clusterPoints(visiblePoints, kakao.level),
    [kakao.level, visiblePoints],
  );

  const selectedPoint = useMemo(
    () => allPoints.find((point) => point.id === selectedPinId) ?? null,
    [allPoints, selectedPinId],
  );

  useEffect(() => {
    if (
      selectedPinId &&
      !allPoints.some((point) => point.id === selectedPinId)
    ) {
      selectPin(null);
    }
  }, [allPoints, selectPin, selectedPinId]);

  useEffect(() => {
    if (!requestedInitialLocationRef.current) {
      requestedInitialLocationRef.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  useEffect(() => {
    if (location.status === "success" && kakao.status === "ready") {
      recenterMapTo(location.coordinates);
    }
  }, [kakao.status, location.coordinates, location.status, recenterMapTo]);

  const selectVisiblePoint = (point: MapPoint) => {
    selectPin(point.id);
    kakao.moveTo(point.coordinates);
  };

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        지도를 준비하는 중...
      </div>
    );
  }

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden overscroll-none bg-[#eef3ef]"
      data-map-status={kakao.status}
    >
      <div className="absolute inset-0">
        <div
          className="h-full w-full"
          ref={kakao.containerRef}
          aria-label="카카오 지도"
          data-map-root
        />
        {kakao.status === "missing-key" || kakao.status === "error" ? (
          <FallbackMapLayer
            clusters={fallbackClusters}
            onSelectPoint={selectPin}
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto pt-[calc(14px+env(safe-area-inset-top))]">
          <div className="px-4">
            <MapSearchBar query={query} onQueryChange={setQuery} />
          </div>
          <MapFilterChips
            filter={filter}
            friends={friends}
            onFilterChange={setFilter}
            onSelectedFriendChange={setSelectedFriend}
            selectedFriend={selectedFriend}
          />
        </div>

        <MapLocateButton
          drawerExpanded={drawerExpanded}
          onRequestLocation={requestLocation}
        />

        {location.status === "error" ? (
          <p className="pointer-events-auto absolute right-4 bottom-[calc(308px+env(safe-area-inset-bottom))] left-4 m-0 rounded-xl bg-white/95 px-3 py-2.5 text-sm font-extrabold text-[#24463d] shadow-[0_10px_24px_rgba(17,17,17,0.12)]">
            {location.error}
          </p>
        ) : null}

        <MapVisibleDrawer
          drawerExpanded={drawerExpanded}
          onSelectPoint={selectVisiblePoint}
          onToggleExpanded={() => setDrawerExpanded((expanded) => !expanded)}
          selectedPoint={selectedPoint}
          visiblePoints={visiblePoints}
        />
      </div>
    </section>
  );
}
