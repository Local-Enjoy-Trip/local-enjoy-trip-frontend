import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { mapCenter } from "@/features/map/constants";
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
import { type MapFilter, useMapStore } from "@/features/map/mapStore";
import {
  getMapExplore,
  type MapApiFilter,
} from "@/features/map/mapApi";
import type { MapPoint, MapViewport } from "@/features/map/types";

const viewportDebounceMs = 400;

export function MapPage() {
  useMapViewportBackground();

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
  const currentLocation =
    location.status === "success" ? location.coordinates : null;
  const [requestedViewport, setRequestedViewport] =
    useState<MapViewport | null>(null);
  const exploreCoordinates =
    requestedViewport?.center ?? currentLocation ?? mapCenter;
  const exploreRadius = requestedViewport?.radiusMeters ?? 5_000;
  const apiFilter = toApiFilter(filter);
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryFn: () =>
      getMapExplore({
        coordinates: exploreCoordinates,
        filter: apiFilter,
        radiusMeters: exploreRadius,
      }),
    placeholderData: keepPreviousData,
    queryKey: [
      "map-explore",
      apiFilter,
      exploreCoordinates.lat,
      exploreCoordinates.lng,
      exploreRadius,
    ],
  });
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
    data?.center.coordinates ?? mapCenter,
    currentLocation,
    0,
    0,
    !isLoading && Boolean(data),
  );
  const recenterMapTo = kakao.recenterTo;

  useEffect(() => {
    const viewport = kakao.viewport;
    if (!viewport) return;

    const timer = window.setTimeout(() => {
      const nextViewport = normalizeViewport(viewport);
      setRequestedViewport((currentViewport) =>
        isSameViewport(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport,
      );
    }, viewportDebounceMs);

    return () => window.clearTimeout(timer);
  }, [kakao.viewport]);

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

  if (isLoading || (!data && !isError)) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        지도를 준비하는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <section className="grid min-h-screen place-items-center bg-white p-6 text-center text-[#24231f]">
        <div>
          <h1 className="m-0 text-xl font-black">지도를 불러오지 못했어요</h1>
          <p className="mt-2 mb-0 text-sm font-semibold text-[#746F67]">
            {error instanceof Error
              ? error.message
              : "대표 동네 설정과 네트워크 연결을 확인해주세요."}
          </p>
          <button
            className="mt-6 h-11 rounded-xl bg-[#111] px-5 text-sm font-black text-white"
            onClick={() => refetch()}
            type="button"
          >
            다시 시도
          </button>
        </div>
      </section>
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

function toApiFilter(filter: MapFilter): MapApiFilter {
  if (filter === "place") return "PLACE";
  if (filter === "spot") return "NOTE";
  if (filter === "friend") return "FRIEND";
  return "ALL";
}

function normalizeViewport(viewport: MapViewport): MapViewport {
  return {
    center: {
      lat: Number(viewport.center.lat.toFixed(4)),
      lng: Number(viewport.center.lng.toFixed(4)),
    },
    radiusMeters: Math.min(
      5_000,
      Math.max(500, Math.ceil((viewport.radiusMeters * 1.15) / 100) * 100),
    ),
  };
}

function isSameViewport(
  currentViewport: MapViewport | null,
  nextViewport: MapViewport,
) {
  return (
    currentViewport?.center.lat === nextViewport.center.lat &&
    currentViewport.center.lng === nextViewport.center.lng &&
    currentViewport.radiusMeters === nextViewport.radiusMeters
  );
}
