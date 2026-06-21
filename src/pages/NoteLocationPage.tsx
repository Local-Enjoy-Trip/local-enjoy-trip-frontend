import { ArrowLeft, Crosshair } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import { FallbackMapLayer } from "@/features/map/components/FallbackMapLayer";
import { LocationConsentDialog } from "@/features/map/components/LocationConsentDialog";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import { useMapViewportBackground } from "@/features/map/hooks/useMapViewportBackground";
import {
  readLocationConsent,
  saveLocationConsent,
  type LocationConsent,
} from "@/features/map/lib/locationConsent";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import noteLocationPinUrl from "@/assets/note-location-pin.png";
import type {
  KakaoMapInstance,
  KakaoPlaceResult,
  MapPoint,
} from "@/features/map/types";
import type { Coordinates } from "@/shared/types/domain";

export type NoteLocationSelection = {
  address: string;
  coordinates: Coordinates;
  name: string;
};

type NoteLocationRouteState = {
  noteLocation?: NoteLocationSelection;
};

const defaultLocationOption = homeLocationOptions[0];
const defaultNoteLocation: NoteLocationSelection = {
  address: defaultLocationOption.weatherArea,
  coordinates: defaultLocationOption.coordinates,
  name: defaultLocationOption.label,
};

const recentLocationsStorageKey = "spot-note-recent-locations";

function getPlaceAddress(place: KakaoPlaceResult) {
  return place.road_address_name || place.address_name || place.place_name;
}

function getAddressName(address: string) {
  const parts = address.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  const previousPart = parts[parts.length - 2];

  if (lastPart && previousPart && /^[\d-]+$/.test(lastPart)) {
    return `${previousPart} ${lastPart}`;
  }

  return lastPart ?? "선택한 위치";
}

function getDistanceInMeters(a: Coordinates, b: Coordinates) {
  const earthRadiusMeters = 6371000;
  const latA = (a.lat * Math.PI) / 180;
  const latB = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) ** 2;

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function createFallbackPoint(selection: NoteLocationSelection): MapPoint {
  return {
    id: "note-location-preview",
    kind: "place",
    name: selection.address,
    coordinates: selection.coordinates,
    saved: false,
    source: {
      id: "note-location-preview",
      name: selection.address,
      area: selection.address,
      summary: "",
      tags: ["쪽지"],
      coordinates: selection.coordinates,
      imageUrl: "",
      saved: false,
    },
  };
}

function isNoteLocationSelection(value: unknown): value is NoteLocationSelection {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<NoteLocationSelection>;

  return (
    typeof candidate.address === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.coordinates?.lat === "number" &&
    typeof candidate.coordinates.lng === "number"
  );
}

function readRecentLocations() {
  try {
    const savedLocations = window.localStorage.getItem(recentLocationsStorageKey);

    if (!savedLocations) {
      return [];
    }

    const parsedLocations = JSON.parse(savedLocations);

    if (!Array.isArray(parsedLocations)) {
      return [];
    }

    return parsedLocations.filter(isNoteLocationSelection).slice(0, 3);
  } catch {
    return [];
  }
}

function saveRecentLocations(locations: NoteLocationSelection[]) {
  window.localStorage.setItem(
    recentLocationsStorageKey,
    JSON.stringify(locations.slice(0, 3))
  );
}

export function NoteLocationPage() {
  useMapViewportBackground();

  const navigate = useNavigate();
  const currentLocation = useCurrentLocation();
  const {
    coordinates: currentCoordinates,
    requestLocation,
    status: currentLocationStatus,
  } = currentLocation;
  const routeLocation = useLocation();
  const state = routeLocation.state as NoteLocationRouteState | null;
  const isReturningWithSelection = Boolean(state?.noteLocation);
  const fallbackSelection = useMemo(
    () => state?.noteLocation ?? defaultNoteLocation,
    [state?.noteLocation]
  );
  const initialSelection = useMemo(
    () =>
      state?.noteLocation ?? {
        ...defaultNoteLocation,
        address: "현재 위치를 확인하는 중이에요",
        name: "현재 위치",
      },
    [state?.noteLocation]
  );
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const geocodeRequestRef = useRef(0);
  const hasInitializedMapRef = useRef(false);
  const preservedNameRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing-key" | "error"
  >("loading");
  const [locationConsent, setLocationConsent] =
    useState<LocationConsent>(readLocationConsent);
  const [selection, setSelection] =
    useState<NoteLocationSelection>(initialSelection);
  const [recentLocations, setRecentLocations] = useState<NoteLocationSelection[]>(
    readRecentLocations
  );

  const fallbackPoint = useMemo(() => createFallbackPoint(selection), [selection]);
  const canShowFallbackMap =
    locationConsent === "declined" ||
    isReturningWithSelection ||
    currentLocationStatus === "success";

  const resolvePlaceName = useCallback((
    address: string,
    coordinates: Coordinates,
    requestId: number,
    fallbackName: string
  ) => {
    const kakaoMaps = window.kakao?.maps;

    if (!kakaoMaps?.services?.Places) {
      return;
    }

    const places = new kakaoMaps.services.Places();
    places.keywordSearch(address, (result, searchStatus) => {
      if (geocodeRequestRef.current !== requestId) return;

      if (searchStatus !== kakaoMaps.services?.Status.OK || !result[0]) {
        return;
      }

      const nearestPlace = result
        .map((place) => ({
          place,
          distance: getDistanceInMeters(coordinates, {
            lat: Number(place.y),
            lng: Number(place.x),
          }),
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      if (!nearestPlace || nearestPlace.distance > 120) {
        return;
      }

      setSelection((current) => ({
        ...current,
        name: nearestPlace.place.place_name || fallbackName,
      }));
    });
  }, []);

  const resolveAddress = useCallback((coordinates: Coordinates, fallbackName?: string) => {
    const kakaoMaps = window.kakao?.maps;

    if (!kakaoMaps?.services?.Geocoder) {
      return;
    }

    const requestId = geocodeRequestRef.current + 1;
    geocodeRequestRef.current = requestId;
    const geocoder = new kakaoMaps.services.Geocoder();

    geocoder.coord2Address(
      coordinates.lng,
      coordinates.lat,
      (result, geocodeStatus) => {
        if (geocodeRequestRef.current !== requestId) return;

        if (geocodeStatus !== kakaoMaps.services?.Status.OK || !result[0]) {
          return;
        }

        const address =
          result[0].road_address?.address_name ??
          result[0].address?.address_name;

        if (!address) {
          return;
        }

        const preservedName = fallbackName ?? preservedNameRef.current;
        preservedNameRef.current = null;
        const fallbackResolvedName = preservedName ?? getAddressName(address);

        setSelection((current) => ({
          ...current,
          address,
          name: fallbackResolvedName,
        }));
        resolvePlaceName(address, coordinates, requestId, fallbackResolvedName);
      }
    );
  }, [resolvePlaceName]);

  const moveMapTo = useCallback((nextSelection: NoteLocationSelection) => {
    geocodeRequestRef.current += 1;
    preservedNameRef.current = nextSelection.name;
    setSelection(nextSelection);

    if (mapRef.current && window.kakao) {
      mapRef.current.setCenter(
        new window.kakao.maps.LatLng(
          nextSelection.coordinates.lat,
          nextSelection.coordinates.lng
        )
      );
    }
  }, []);

  useEffect(() => {
    if (locationConsent === "granted") {
      requestLocation();
    }
  }, [locationConsent, requestLocation]);

  useEffect(() => {
    if (
      locationConsent !== "granted" ||
      !hasInitializedMapRef.current ||
      currentLocationStatus !== "success" ||
      !currentCoordinates
    ) {
      return;
    }

    moveMapTo({
      address: "현재 위치를 확인하는 중이에요",
      coordinates: currentCoordinates,
      name: "현재 위치",
    });
    resolveAddress(currentCoordinates, "현재 위치");
  }, [
    currentCoordinates,
    currentLocationStatus,
    locationConsent,
    moveMapTo,
    resolveAddress,
  ]);

  useEffect(() => {
    if (hasInitializedMapRef.current) {
      return;
    }

    if (locationConsent === "pending") {
      return;
    }

    if (
      locationConsent === "granted" &&
      (currentLocationStatus === "idle" || currentLocationStatus === "loading")
    ) {
      return;
    }

    let cancelled = false;

    loadKakaoMap().then((nextStatus) => {
      if (cancelled) return;

      if (nextStatus !== "ready") {
        setStatus(nextStatus);
        return;
      }

      if (!mapContainerRef.current || !window.kakao) {
        setStatus("error");
        return;
      }

      const kakaoMaps = window.kakao.maps;
      const startSelection =
        currentLocationStatus === "success" && currentCoordinates
          ? {
              address: "현재 위치를 확인하는 중이에요",
              coordinates: currentCoordinates,
              name: "현재 위치",
            }
          : fallbackSelection;
      const center = new kakaoMaps.LatLng(
        startSelection.coordinates.lat,
        startSelection.coordinates.lng
      );
      const map = new kakaoMaps.Map(mapContainerRef.current, {
        center,
        level: 3,
      });
      hasInitializedMapRef.current = true;
      mapRef.current = map;
      setSelection(startSelection);

      const syncCenterAddress = () => {
        const nextCenter = map.getCenter();
        const nextCoordinates = {
          lat: nextCenter.getLat(),
          lng: nextCenter.getLng(),
        };

        setSelection((current) => ({
          ...current,
          coordinates: nextCoordinates,
        }));
        resolveAddress(nextCoordinates);
      };

      kakaoMaps.event.addListener(map, "idle", syncCenterAddress);
      setStatus("ready");
      syncCenterAddress();

      const relayout = () => {
        map.relayout();
        map.setCenter(center);
        syncCenterAddress();
      };

      window.requestAnimationFrame(relayout);
      window.setTimeout(relayout, 120);
    });

    return () => {
      cancelled = true;
    };
  }, [
    currentCoordinates,
    currentLocationStatus,
    fallbackSelection,
    initialSelection,
    isReturningWithSelection,
    locationConsent,
    resolveAddress,
  ]);

  function allowCurrentLocation() {
    saveLocationConsent("granted");
    setLocationConsent("granted");
  }

  function continueWithoutLocation() {
    saveLocationConsent("declined");
    setSelection(fallbackSelection);
    setLocationConsent("declined");
  }

  function handleCurrentLocationRequest() {
    if (
      locationConsent !== "granted" ||
      currentLocationStatus === "error"
    ) {
      setLocationConsent("pending");
      return;
    }

    requestLocation();
  }

  function searchLocation() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const matchedOption = homeLocationOptions.find((option) =>
      option.weatherArea.includes(trimmedQuery) ||
      option.label.includes(trimmedQuery)
    );

    if (matchedOption) {
      const nextSelection = {
        address: matchedOption.weatherArea,
        coordinates: matchedOption.coordinates,
        name: matchedOption.label,
      };
      moveMapTo(nextSelection);
      return;
    }

    const kakaoMaps = window.kakao?.maps;

    if (!kakaoMaps?.services?.Places) {
      return;
    }

    const places = new kakaoMaps.services.Places();
    geocodeRequestRef.current += 1;
    places.keywordSearch(trimmedQuery, (result, searchStatus) => {
      if (searchStatus !== kakaoMaps.services?.Status.OK || !result[0]) {
        return;
      }

      const firstPlace = result[0];
      const coordinates = {
        lat: Number(firstPlace.y),
        lng: Number(firstPlace.x),
      };
      const address = getPlaceAddress(firstPlace);

      moveMapTo({
        address,
        coordinates,
        name: firstPlace.place_name,
      });
    });
  }

  function confirmLocation() {
    const nextRecentLocations = [
      selection,
      ...recentLocations.filter(
        (location) =>
          location.address !== selection.address &&
          (location.coordinates.lat !== selection.coordinates.lat ||
            location.coordinates.lng !== selection.coordinates.lng)
      ),
    ].slice(0, 3);

    saveRecentLocations(nextRecentLocations);
    setRecentLocations(nextRecentLocations);

    navigate("/note/new", {
      replace: true,
      state: {
        noteLocation: selection,
      },
    });
  }

  return (
    <section
      className="relative h-full min-h-0 overflow-hidden overscroll-none bg-[#eef3ef]"
      data-map-status={status}
    >
      <div className="absolute inset-x-0 top-[calc(-1*env(safe-area-inset-top))] bottom-0">
        <div
          className="h-full w-full"
          ref={mapContainerRef}
          aria-label="쪽지 위치 설정 지도"
          data-map-root
        />
        {(status === "missing-key" || status === "error") && canShowFallbackMap ? (
          <FallbackMapLayer
            clusters={[
              {
                id: "note-location-cluster",
                center: selection.coordinates,
                points: [fallbackPoint],
              },
            ]}
            currentLocation={null}
            onSelectPoint={() => undefined}
            selectedPointId="note-location-preview"
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="pointer-events-auto pt-[calc(14px+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 px-4">
            <button
              className="grid h-12 w-12 flex-none place-items-center rounded-full bg-white text-[#24231f] shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
              type="button"
              onClick={() => navigate("/note/new")}
              aria-label="쪽지 작성으로 돌아가기"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="min-w-0 flex-1">
              <MapSearchBar
                query={query}
                onQueryChange={setQuery}
                onSubmit={searchLocation}
                placeholder="장소, 주소 검색"
              />
            </div>
          </div>
        </div>

        {status === "ready" ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <img
            className="h-[76px] w-[76px] translate-y-3 object-contain drop-shadow-[0_12px_18px_rgba(238,45,59,0.26)]"
            src={noteLocationPinUrl}
            alt=""
          />
          <span className="mt-0 h-1.5 w-8 rounded-full bg-black/14 blur-[1px]" />
        </div>
        ) : null}

        <div className="pointer-events-auto absolute right-4 bottom-[calc(292px+env(safe-area-inset-bottom))]">
          <button
            className="grid size-11 touch-manipulation select-none place-items-center rounded-full border border-black/5 bg-white text-[#1e2a26] shadow-[0_7px_18px_rgba(17,17,17,0.18)]"
            onClick={handleCurrentLocationRequest}
            type="button"
            aria-label="현재 위치"
          >
            <Crosshair size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pt-5 pb-[calc(18px+env(safe-area-inset-bottom))] shadow-[0_-10px_28px_rgba(17,17,17,0.12)]">
          <h2 className="m-0 text-[1.16rem] leading-tight font-black text-[#242424]">
            어디에 쪽지를 남길까요?
          </h2>
          <div className="mt-4 flex gap-3">
            <span className="mt-2 h-2 w-2 flex-none rounded-full border-2 border-[#767676]" />
            <div className="min-w-0">
              <strong className="block truncate text-base font-semibold text-[#666]">
                {selection.name}
              </strong>
              <p className="mt-1 mb-0 line-clamp-2 text-sm leading-snug font-medium text-[#aaa]">
                {selection.address}
              </p>
            </div>
          </div>
          <div className="mt-5 h-px bg-[#eeeeee]" />
          {recentLocations.length > 0 ? (
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
              {recentLocations.map((location) => (
                <button
                  className="min-h-8 max-w-[120px] flex-none truncate rounded-full bg-[#f0f0f0] px-3 text-xs font-bold text-[#777]"
                  key={`${location.name}-${location.address}`}
                  type="button"
                  onClick={() => {
                    moveMapTo(location);
                  }}
                >
                  {location.name}
                </button>
              ))}
            </div>
          ) : null}
          <button
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#FF4300] font-black text-white shadow-[0_10px_20px_rgba(255,67,0,0.2)]"
            type="button"
            onClick={confirmLocation}
          >
            이 위치로 설정하기
          </button>
        </div>
      </div>

      {locationConsent === "pending" ? (
        <LocationConsentDialog
          onAllow={allowCurrentLocation}
          onSkip={continueWithoutLocation}
        />
      ) : null}
    </section>
  );
}
