import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMapPins } from "@/shared/api/mockApi";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import { FallbackMapLayer } from "@/features/map/components/FallbackMapLayer";
import { LocationConsentDialog } from "@/features/map/components/LocationConsentDialog";
import { MapFilterChips } from "@/features/map/components/MapFilterChips";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import {
  type DrawerSnap,
  MapVisibleDrawer,
} from "@/features/map/components/MapVisibleDrawer";
import { useKakaoMap } from "@/features/map/hooks/useKakaoMap";
import { useMapViewportBackground } from "@/features/map/hooks/useMapViewportBackground";
import { isInBounds } from "@/features/map/lib/kakaoMap";
import {
  readLocationConsent,
  saveLocationConsent,
  type LocationConsent,
} from "@/features/map/lib/locationConsent";
import {
  clusterPoints,
  filterMapPoints,
  getFriends,
  toMapPoints,
} from "@/features/map/lib/mapPoints";
import { useMapStore } from "@/features/map/mapStore";
import type { MapPoint } from "@/features/map/types";

export function MapPage() {
  useMapViewportBackground();

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
  const [query, setQuery] = useState("");
  const [drawerSnap, setDrawerSnap] = useState<DrawerSnap>("default");
  const [locationConsent, setLocationConsent] =
    useState<LocationConsent>(readLocationConsent);
  const locationToastTimerRef = useRef<number | null>(null);
  const manualLocationRequestRef = useRef(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

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

  const selectMapPin = useCallback(
    (pinId: string | null) => {
      selectPin(pinId);
      if (pinId) {
        setDrawerSnap("default");
      }
    },
    [selectPin],
  );

  const currentLocation =
    location.status === "success" ? location.coordinates : null;

  const selectedPoint = useMemo(
    () => allPoints.find((point) => point.id === selectedPinId) ?? null,
    [allPoints, selectedPinId],
  );
  const selectedDrawerHeight = Math.min(260, window.innerHeight * 0.32);
  const currentDrawerHeight =
    drawerSnap === "hidden"
      ? 0
      : drawerSnap === "full"
        ? Math.max(0, window.innerHeight - 196)
        : selectedPoint
          ? selectedDrawerHeight
          : window.innerHeight * 0.36;
  const mapBottomInset = 72 + currentDrawerHeight;

  const kakao = useKakaoMap(
    filteredPoints,
    selectMapPin,
    selectedPinId,
    currentLocation,
    0,
    0,
    !isLoading && Boolean(data),
  );
  const recenterMapTo = kakao.recenterTo;

  const visiblePoints = useMemo(
    () =>
      filteredPoints.filter((point) =>
        isInBounds(point.coordinates, kakao.bounds),
      ),
    [filteredPoints, kakao.bounds],
  );

  const visibleSelectedPinId = useMemo(
    () =>
      selectedPinId &&
      visiblePoints.some((point) => point.id === selectedPinId)
        ? selectedPinId
        : null,
    [selectedPinId, visiblePoints],
  );

  const fallbackClusters = useMemo(
    () => clusterPoints(visiblePoints, kakao.level),
    [kakao.level, visiblePoints],
  );

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
    if (
      selectedPinId &&
      !allPoints.some((point) => point.id === selectedPinId)
    ) {
      selectPin(null);
    }
  }, [allPoints, selectPin, selectedPinId]);

  useEffect(() => {
    if (location.status === "success" && kakao.status === "ready") {
      recenterMapTo(location.coordinates);
    }
  }, [kakao.status, location.coordinates, location.status, recenterMapTo]);

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

  const selectVisiblePoint = (point: MapPoint) => {
    selectPin(point.id);
    setDrawerSnap("default");
    kakao.moveTo(point.coordinates);
  };

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
      <div
        className="absolute inset-x-0 top-[calc(-1*env(safe-area-inset-top))] transition-[bottom] duration-200"
        style={{ bottom: mapBottomInset }}
      >
        <div
          className="h-full w-full"
          ref={kakao.containerRef}
          aria-label="카카오 지도"
          data-map-root
        />
        {kakao.status === "missing-key" || kakao.status === "error" ? (
          <FallbackMapLayer
            clusters={fallbackClusters}
            currentLocation={currentLocation}
            onSelectPoint={selectMapPin}
            selectedPointId={visibleSelectedPinId}
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

        {locationToast ? (
          <p
            className={`pointer-events-auto absolute right-4 left-4 m-0 rounded-xl bg-white/95 px-3 py-2.5 text-sm font-extrabold text-[#24463d] shadow-[0_10px_24px_rgba(17,17,17,0.12)] transition-[bottom,opacity] duration-200 ${
              drawerSnap === "full"
                ? "pointer-events-none bottom-[calc(87px+env(safe-area-inset-bottom))] opacity-0"
                : drawerSnap === "hidden"
                  ? "bottom-[calc(87px+env(safe-area-inset-bottom))]"
                  : selectedPoint
                    ? "bottom-[calc(50vh+87px+env(safe-area-inset-bottom))]"
                    : "bottom-[calc(36vh+87px+env(safe-area-inset-bottom))]"
            }`}
          >
            {locationToast}
          </p>
        ) : null}

        <MapVisibleDrawer
          drawerSnap={drawerSnap}
          onRequestLocation={requestCurrentLocation}
          onSelectPoint={selectVisiblePoint}
          onSnapChange={setDrawerSnap}
          selectedPointId={visibleSelectedPinId}
          selectedPoint={selectedPoint}
          visiblePoints={visiblePoints}
        />
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
    </section>
  );
}
