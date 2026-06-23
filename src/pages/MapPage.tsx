import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { List, RotateCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import { PageLoadingSkeleton } from "@/shared/ui/Skeleton";
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
  toMapPoints,
} from "@/features/map/lib/mapPoints";
import { type MapFilter, useMapStore } from "@/features/map/mapStore";
import {
  getMapExplore,
  type MapApiFilter,
} from "@/features/map/mapApi";
import type { MapPoint, MapViewport } from "@/features/map/types";

const viewportDebounceMs = 500;
const targetViewportRadiusMeters = 3_000;

type FrozenMapBounds = {
  northEast: MapViewport["center"];
  southWest: MapViewport["center"];
};

export function MapPage() {
  useMapViewportBackground();
  const [searchParams] = useSearchParams();

  const {
    filter,
    selectedPlaceCategory,
    selectedPinId,
    selectPin,
    setFilter,
    setSelectedPlaceCategory,
  } = useMapStore();
  const requestedFilter = searchParams.get("filter");
  const requestedTab = searchParams.get("tab") === "note" ? "note" : undefined;
  const requestedTargetId = searchParams.get("target");
  const requestedMapX = Number(searchParams.get("mapX"));
  const requestedMapY = Number(searchParams.get("mapY"));
  const requestedTargetViewport = useMemo(
    () =>
      Number.isFinite(requestedMapX) && Number.isFinite(requestedMapY)
        ? {
            center: { lat: requestedMapY, lng: requestedMapX },
            radiusMeters: targetViewportRadiusMeters,
          }
        : null,
    [requestedMapX, requestedMapY],
  );
  const location = useCurrentLocation();
  const requestLocation = location.requestLocation;
  const currentLocation =
    location.status === "success" ? location.coordinates : null;
  const [requestedViewport, setRequestedViewport] =
    useState<MapViewport | null>(requestedTargetViewport);
  const [pendingViewport, setPendingViewport] = useState<MapViewport | null>(null);
  const [fullDrawerBounds, setFullDrawerBounds] =
    useState<FrozenMapBounds | null>(null);
  const exploreCoordinates =
    requestedViewport?.center ?? currentLocation ?? mapCenter;
  const exploreRadius = requestedViewport?.radiusMeters ?? 5_000;
  const apiFilter = toApiFilter(filter);
  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
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
    staleTime: 30_000,
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

  const filteredPoints = useMemo(
    () =>
      filterMapPoints({
        filter,
        points: allPoints,
        query,
        selectedPlaceCategory,
      }),
    [allPoints, filter, query, selectedPlaceCategory],
  );

  const selectMapPin = useCallback(
    (pinId: string | null) => {
      selectPin(pinId);
      if (pinId) {
        setDrawerSnap("full");
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
    filter,
  );
  const recenterMapTo = kakao.recenterTo;
  const moveMapTo = kakao.moveTo;

  useEffect(() => {
    const viewport = kakao.viewport;
    if (!viewport || drawerSnap === "full") return;

    const nextViewport = normalizeViewport(viewport);
    const radiusChanged = requestedViewport
      ? Math.abs(nextViewport.radiusMeters - requestedViewport.radiusMeters) /
        requestedViewport.radiusMeters > 0.12
      : true;

    if (!radiusChanged && requestedViewport) {
      const movedMeters = getDistanceMeters(
        requestedViewport.center,
        nextViewport.center,
      );
      setPendingViewport(
        movedMeters > requestedViewport.radiusMeters * 0.25
          ? nextViewport
          : null,
      );
      return;
    }

    const timer = window.setTimeout(() => {
      setRequestedViewport((currentViewport) =>
        isSameViewport(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport,
      );
      setPendingViewport(null);
    }, viewportDebounceMs);

    return () => window.clearTimeout(timer);
  }, [drawerSnap, kakao.viewport, requestedViewport]);

  const visiblePoints = useMemo(
    () =>
      filteredPoints.filter((point) =>
        isInBounds(point.coordinates, kakao.bounds),
      ),
    [filteredPoints, kakao.bounds],
  );

  useEffect(() => {
    if (drawerSnap === "full") {
      setFullDrawerBounds((current) => {
        if (current || !kakao.bounds) return current;

        const northEast = kakao.bounds.getNorthEast();
        const southWest = kakao.bounds.getSouthWest();
        return {
          northEast: { lat: northEast.getLat(), lng: northEast.getLng() },
          southWest: { lat: southWest.getLat(), lng: southWest.getLng() },
        };
      });
      return;
    }

    setFullDrawerBounds(null);
  }, [drawerSnap, kakao.bounds]);

  const drawerPoints = useMemo(() => {
    if (drawerSnap !== "full" || !fullDrawerBounds) return visiblePoints;

    return filteredPoints.filter((point) =>
      isInsideFrozenBounds(point.coordinates, fullDrawerBounds),
    );
  }, [drawerSnap, filteredPoints, fullDrawerBounds, visiblePoints]);

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
      !filteredPoints.some((point) => point.id === selectedPinId)
    ) {
      selectPin(null);
    }
  }, [filteredPoints, selectPin, selectedPinId]);

  useEffect(() => {
    if (
      requestedFilter === "saved" ||
      requestedFilter === "spot" ||
      requestedFilter === "place" ||
      requestedFilter === "friend" ||
      requestedFilter === "all"
    ) {
      setFilter(requestedFilter);
      if (requestedFilter === "saved") setDrawerSnap("full");
    }
  }, [requestedFilter, setFilter]);

  useEffect(() => {
    if (!requestedTargetViewport) return;

    setRequestedViewport((currentViewport) =>
      isSameViewport(currentViewport, requestedTargetViewport)
        ? currentViewport
        : requestedTargetViewport,
    );
  }, [requestedTargetViewport]);

  useEffect(() => {
    if (!requestedTargetId || allPoints.length === 0) return;

    const targetPoint = allPoints.find((point) => point.id === requestedTargetId);
    if (!targetPoint) return;

    selectPin(targetPoint.id);
    setDrawerSnap("full");
    moveMapTo(targetPoint.coordinates);
  }, [allPoints, moveMapTo, requestedTargetId, selectPin]);

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
    setDrawerSnap("full");
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
    return <PageLoadingSkeleton type="map" />;
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
            activeFilter={filter}
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
            onFilterChange={setFilter}
            onSelectedPlaceCategoryChange={setSelectedPlaceCategory}
            selectedPlaceCategory={selectedPlaceCategory}
          />
        </div>

        {pendingViewport && drawerSnap !== "full" ? (
          <button
            className={`pointer-events-auto absolute left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#FD4003]/15 bg-white px-3 py-2 text-xs font-extrabold whitespace-nowrap text-[#FD4003] shadow-[0_7px_17px_rgba(17,17,17,0.16)] disabled:opacity-60 ${
              filter === "place"
                ? "top-[calc(178px+env(safe-area-inset-top))]"
                : "top-[calc(126px+env(safe-area-inset-top))]"
            }`}
            disabled={isFetching}
            onClick={() => {
              setRequestedViewport(pendingViewport);
              setPendingViewport(null);
            }}
            type="button"
          >
            <RotateCw
              className={isFetching ? "animate-spin" : ""}
              size={14}
              strokeWidth={2.5}
            />
            {isFetching ? "검색 중..." : "현 지도에서 검색"}
          </button>
        ) : null}

        {drawerSnap === "hidden" ? (
          <button
            className="pointer-events-auto absolute bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#FD4003]/15 bg-white px-3.5 text-xs font-extrabold whitespace-nowrap text-[#FD4003] shadow-[0_7px_18px_rgba(17,17,17,0.18)]"
            onClick={() => setDrawerSnap("default")}
            type="button"
          >
            <List size={15} strokeWidth={2.5} />
            목록보기
          </button>
        ) : null}

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
          preferredTab={requestedTab}
          selectedPoint={selectedPoint}
          visiblePoints={drawerPoints}
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
    radiusMeters: Math.max(
      500,
      Math.ceil((viewport.radiusMeters * 1.15) / 100) * 100,
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

function getDistanceMeters(
  from: MapViewport["center"],
  to: MapViewport["center"],
) {
  const latitudeMeters = (to.lat - from.lat) * 111_320;
  const longitudeMeters =
    (to.lng - from.lng) *
    111_320 *
    Math.cos(((from.lat + to.lat) / 2) * (Math.PI / 180));

  return Math.hypot(latitudeMeters, longitudeMeters);
}

function isInsideFrozenBounds(
  coordinates: MapViewport["center"],
  bounds: FrozenMapBounds,
) {
  return (
    coordinates.lat >= bounds.southWest.lat &&
    coordinates.lat <= bounds.northEast.lat &&
    coordinates.lng >= bounds.southWest.lng &&
    coordinates.lng <= bounds.northEast.lng
  );
}
