import { ArrowLeft, Crosshair } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import { FallbackMapLayer } from "@/features/map/components/FallbackMapLayer";
import { LocationConsentDialog } from "@/features/map/components/LocationConsentDialog";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import {
  getAdministrativeDongCenter,
  getAdministrativeDongName,
  getAdministrativeDongPaths,
  loadSeoulAdministrativeDongs,
  type SeoulAdministrativeDong,
} from "@/features/map/lib/seoulAdministrativeDongs";
import { useMapViewportBackground } from "@/features/map/hooks/useMapViewportBackground";
import {
  readLocationConsent,
  saveLocationConsent,
  type LocationConsent,
} from "@/features/map/lib/locationConsent";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import noteLocationPinUrl from "@/assets/note-location-pin.png";
import type { NoteResponse } from "@/features/notes/noteApi";
import type {
  KakaoCustomOverlay,
  KakaoMapInstance,
  KakaoPlaceResult,
  KakaoPolygon,
  MapPoint,
} from "@/features/map/types";
import type { Coordinates } from "@/shared/types/domain";

export type NoteLocationSelection = {
  address: string;
  coordinates: Coordinates;
  name: string;
  neighborhood?: string;
};

type NoteLocationRouteState = {
  locationPurpose?: "home" | "note";
  note?: NoteResponse;
  noteLocation?: NoteLocationSelection;
  noteReturnTo?: string;
  returnTo?: string;
};

type AdministrativeDongOverlay = {
  dong: SeoulAdministrativeDong;
  label: KakaoCustomOverlay;
  labelElement: HTMLButtonElement;
  polygons: KakaoPolygon[];
};

const defaultLocationOption = homeLocationOptions[0];
const defaultNoteLocation: NoteLocationSelection = {
  address: defaultLocationOption.weatherArea,
  coordinates: defaultLocationOption.coordinates,
  name: defaultLocationOption.label,
};

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

function getNeighborhoodName(address: string) {
  return address
    .trim()
    .split(/\s+/)
    .find((part) => /(?:읍|면|동)$/.test(part));
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
      favoriteCount: 0,
    },
  };
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
  const isHomeLocation = state?.locationPurpose === "home";
  const noteEditorReturnTo = state?.returnTo ?? "/note/new";
  const noteSubmitReturnTo = state?.noteReturnTo;
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
  const administrativeDongOverlaysRef = useRef<AdministrativeDongOverlay[]>([]);
  const geocodeRequestRef = useRef(0);
  const hasInitializedMapRef = useRef(false);
  const preservedNameRef = useRef<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isMapCenterInSeoul, setIsMapCenterInSeoul] = useState(true);
  const [status, setStatus] = useState<
    "loading" | "ready" | "missing-key" | "error"
  >("loading");
  const [boundaryStatus, setBoundaryStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [locationConsent, setLocationConsent] =
    useState<LocationConsent>(readLocationConsent);
  const [selection, setSelection] =
    useState<NoteLocationSelection>(initialSelection);
  const fallbackPoint = useMemo(() => createFallbackPoint(selection), [selection]);
  const canShowFallbackMap =
    locationConsent === "declined" ||
    isReturningWithSelection ||
    currentLocationStatus === "success";
  const canConfirmLocation = isMapCenterInSeoul;

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

  const resolveNeighborhood = useCallback((coordinates: Coordinates) => {
    const kakaoMaps = window.kakao?.maps;

    if (!kakaoMaps?.services?.Geocoder) {
      return;
    }

    const requestId = geocodeRequestRef.current + 1;
    geocodeRequestRef.current = requestId;
    const geocoder = new kakaoMaps.services.Geocoder();

    geocoder.coord2RegionCode(
      coordinates.lng,
      coordinates.lat,
      (result, geocodeStatus) => {
        if (geocodeRequestRef.current !== requestId) return;

        if (geocodeStatus !== kakaoMaps.services?.Status.OK) {
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 지역의 동네만 선택할 수 있어요.");
          return;
        }

        const administrativeNeighborhood = result.find(
          (region) => region.region_type === "H"
        );

        if (!administrativeNeighborhood) {
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 지역의 동네만 선택할 수 있어요.");
          return;
        }

        if (!administrativeNeighborhood.address_name.startsWith("서울")) {
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 지역의 동네만 선택할 수 있어요.");
          return;
        }

        const neighborhood = administrativeNeighborhood.region_3depth_name;
        setIsMapCenterInSeoul(true);
        setSearchMessage(null);
        setSelection((current) => ({
          ...current,
          address: administrativeNeighborhood.address_name,
          name: neighborhood,
          neighborhood,
        }));
      }
    );
  }, []);

  const resolveAddress = useCallback((coordinates: Coordinates, fallbackName?: string) => {
    if (isHomeLocation) {
      resolveNeighborhood(coordinates);
      return;
    }

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
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 안의 장소만 쪽지 위치로 설정할 수 있어요.");
          return;
        }

        const address =
          result[0].road_address?.address_name ??
          result[0].address?.address_name;
        const neighborhood = result[0].address?.address_name
          ? getNeighborhoodName(result[0].address.address_name)
          : undefined;

        if (!address) {
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 안의 장소만 쪽지 위치로 설정할 수 있어요.");
          return;
        }

        if (!address.startsWith("서울")) {
          setIsMapCenterInSeoul(false);
          setSearchMessage("서울 안의 장소만 쪽지 위치로 설정할 수 있어요.");
          return;
        }

        const preservedName = fallbackName ?? preservedNameRef.current;
        preservedNameRef.current = null;
        const fallbackResolvedName = preservedName ?? getAddressName(address);

        setIsMapCenterInSeoul(true);
        setSearchMessage(null);
        setSelection((current) => ({
          ...current,
          address,
          name: fallbackResolvedName,
          neighborhood,
        }));
        resolvePlaceName(address, coordinates, requestId, fallbackResolvedName);
      }
    );
  }, [isHomeLocation, resolveNeighborhood, resolvePlaceName]);

  const moveMapTo = useCallback((nextSelection: NoteLocationSelection) => {
    geocodeRequestRef.current += 1;
    preservedNameRef.current = nextSelection.name;
    setSelection(nextSelection);
    setIsMapCenterInSeoul(nextSelection.address.startsWith("서울"));

    if (mapRef.current && window.kakao) {
      if (isHomeLocation) {
        setIsMapCenterInSeoul(nextSelection.address.startsWith("서울"));
        mapRef.current.setLevel(6);
      }
      mapRef.current.setCenter(
        new window.kakao.maps.LatLng(
          nextSelection.coordinates.lat,
          nextSelection.coordinates.lng
        )
      );
    }
  }, [isHomeLocation]);

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;

    if (!isHomeLocation || status !== "ready" || !map || !kakaoMaps) {
      return;
    }

    let cancelled = false;
    const renderedOverlays: AdministrativeDongOverlay[] = [];
    setBoundaryStatus("loading");

    loadSeoulAdministrativeDongs()
      .then((dongs) => {
        if (cancelled) return;

        dongs.forEach((dong) => {
          const center = getAdministrativeDongCenter(dong);
          const dongName = getAdministrativeDongName(dong);
          const nextSelection: NoteLocationSelection = {
            address: dong.properties.adm_nm,
            coordinates: center,
            name: dongName,
            neighborhood: dongName,
          };
          const selectDong = () => moveMapTo(nextSelection);
          const polygons = getAdministrativeDongPaths(dong, kakaoMaps).map(
            (path) => {
              const polygon = new kakaoMaps.Polygon({
                map,
                path,
                strokeWeight: 1,
                strokeColor: "#ff8355",
                strokeOpacity: 0.58,
                strokeStyle: "solid",
                fillColor: "#ffb399",
                fillOpacity: 0.08,
              });

              kakaoMaps.event.addListener(polygon, "click", selectDong);
              return polygon;
            }
          );
          const labelElement = document.createElement("button");
          labelElement.type = "button";
          labelElement.textContent = dongName;
          labelElement.setAttribute("aria-label", `${dongName} 동네 선택`);
          labelElement.style.cssText = [
            "min-width:max-content",
            "border:1px solid rgba(255,67,0,.32)",
            "border-radius:999px",
            "background:rgba(255,255,255,.9)",
            "padding:5px 9px",
            "color:#6f554b",
            "font:800 11px/1 system-ui,sans-serif",
            "box-shadow:0 4px 12px rgba(17,17,17,.13)",
            "cursor:pointer",
          ].join(";");
          labelElement.addEventListener("click", (event) => {
            event.stopPropagation();
            selectDong();
          });

          const label = new kakaoMaps.CustomOverlay({
            map,
            position: new kakaoMaps.LatLng(center.lat, center.lng),
            content: labelElement,
            yAnchor: 0.5,
            zIndex: 2,
          });

          renderedOverlays.push({ dong, label, labelElement, polygons });
        });

        administrativeDongOverlaysRef.current = renderedOverlays;
        setBoundaryStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setBoundaryStatus("error");
        }
      });

    return () => {
      cancelled = true;
      renderedOverlays.forEach(({ label, polygons }) => {
        label.setMap(null);
        polygons.forEach((polygon) => polygon.setMap(null));
      });
      administrativeDongOverlaysRef.current = [];
    };
  }, [isHomeLocation, moveMapTo, status]);

  useEffect(() => {
    administrativeDongOverlaysRef.current.forEach(
      ({ dong, label, labelElement, polygons }) => {
        const dongName = getAdministrativeDongName(dong);
        const isSelected =
          dong.properties.adm_nm === selection.address ||
          (dongName === selection.neighborhood &&
            selection.address.includes(dong.properties.sggnm));

        polygons.forEach((polygon) =>
          polygon.setOptions(
            isSelected
              ? {
                  strokeWeight: 3,
                  strokeColor: "#ff4300",
                  strokeOpacity: 0.95,
                  fillColor: "#ff4300",
                  fillOpacity: 0.28,
                }
              : {
                  strokeWeight: 1,
                  strokeColor: "#ff8355",
                  strokeOpacity: 0.58,
                  fillColor: "#ffb399",
                  fillOpacity: 0.08,
                }
          )
        );
        labelElement.setAttribute("aria-pressed", String(isSelected));
        labelElement.style.background = isSelected ? "#ff4300" : "rgba(255,255,255,.9)";
        labelElement.style.borderColor = isSelected
          ? "#ff4300"
          : "rgba(255,67,0,.32)";
        labelElement.style.color = isSelected ? "#ffffff" : "#6f554b";
        labelElement.style.fontSize = isSelected ? "12px" : "11px";
        labelElement.style.padding = isSelected ? "7px 11px" : "5px 9px";
        label.setZIndex(isSelected ? 5 : 2);
      }
    );
  }, [boundaryStatus, selection.address, selection.neighborhood]);

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
        level: isHomeLocation ? 6 : 3,
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
    isHomeLocation,
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

    setSearchMessage(null);

    const matchedOption = homeLocationOptions.find((option) =>
      option.weatherArea.includes(trimmedQuery) ||
      option.label.includes(trimmedQuery)
    );

    if (matchedOption) {
      const nextSelection = {
        address: matchedOption.weatherArea,
        coordinates: matchedOption.coordinates,
        name: matchedOption.label,
        neighborhood: matchedOption.label,
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
        setSearchMessage("검색 결과를 찾지 못했어요.");
        return;
      }

      const firstPlace = result.find((place) =>
        (place.address_name ?? place.road_address_name ?? "").startsWith(
          "서울"
        )
      );

      if (!firstPlace) {
        setSearchMessage("서울 지역의 동네만 선택할 수 있어요.");
        return;
      }

      const coordinates = {
        lat: Number(firstPlace.y),
        lng: Number(firstPlace.x),
      };
      const address = getPlaceAddress(firstPlace);

      moveMapTo({
        address,
        coordinates,
        name: firstPlace.place_name,
        neighborhood: firstPlace.address_name
          ? getNeighborhoodName(firstPlace.address_name)
          : undefined,
      });
    });
  }

  function confirmLocation() {
    if (!canConfirmLocation) {
      setSearchMessage(
        isHomeLocation
          ? "서울 지역의 동네만 선택할 수 있어요."
          : "서울 안의 장소만 쪽지 위치로 설정할 수 있어요.",
      );
      return;
    }

    navigate(isHomeLocation ? "/" : noteEditorReturnTo, {
      replace: true,
      state: {
        [isHomeLocation ? "homeLocation" : "noteLocation"]: selection,
        note: state?.note,
        returnTo: noteSubmitReturnTo,
      },
    });
  }

  function navigateBack() {
    navigate(isHomeLocation ? "/" : noteEditorReturnTo, {
      state: isHomeLocation
        ? undefined
        : {
            note: state?.note,
            noteLocation: state?.noteLocation,
            returnTo: noteSubmitReturnTo,
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
              onClick={navigateBack}
              aria-label={isHomeLocation ? "홈으로 돌아가기" : "쪽지 작성으로 돌아가기"}
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="relative min-w-0 flex-1">
              <MapSearchBar
                query={query}
                onQueryChange={(nextQuery) => {
                  setQuery(nextQuery);
                  setSearchMessage(null);
                }}
                onSubmit={searchLocation}
                placeholder="장소, 주소 검색"
              />
              {searchMessage ? (
                <p
                  className="absolute inset-x-0 top-[56px] z-20 m-0 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-[#e54218] shadow-[0_6px_16px_rgba(17,17,17,0.12)]"
                  role="status"
                >
                  {searchMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {status === "ready" && isHomeLocation && boundaryStatus !== "ready" ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="inline-flex min-w-max items-center rounded-full border-2 border-[#FF4300] bg-white px-4 py-2 text-sm font-black text-[#FF4300] shadow-[0_10px_24px_rgba(17,17,17,0.2)]">
            {selection.neighborhood ?? selection.name}
          </span>
          <span className="mx-auto block h-3 w-3 -translate-y-1.5 rotate-45 border-r-2 border-b-2 border-[#FF4300] bg-white" />
        </div>
        ) : status === "ready" ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <img
            className="h-[76px] w-[76px] translate-y-3 object-contain drop-shadow-[0_12px_18px_rgba(238,45,59,0.26)]"
            src={noteLocationPinUrl}
            alt=""
          />
          <span className="mt-0 h-1.5 w-8 rounded-full bg-black/14 blur-[1px]" />
        </div>
        ) : null}

        <div className="pointer-events-auto absolute right-4 bottom-[calc(224px+env(safe-area-inset-bottom))]">
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
            {isHomeLocation ? "어느 동네를 둘러볼까요?" : "어디에 쪽지를 남길까요?"}
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
          <button
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-[#FF4300] font-black text-white shadow-[0_10px_20px_rgba(255,67,0,0.2)] disabled:bg-[#E2DDD6] disabled:text-[#9F978E] disabled:shadow-none"
            type="button"
            disabled={!canConfirmLocation}
            onClick={confirmLocation}
          >
            {isHomeLocation ? "이 동네로 설정하기" : "이 위치로 설정하기"}
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
