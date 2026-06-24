import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/shared/types/domain";
import { categoryLabels } from "@/shared/lib/labels";
import {
  getPlaceMarkerColor,
  initialMapLevel,
  maxMapLevel,
} from "../constants";
import { loadKakaoMap } from "../lib/kakaoMap";
import { clusterPoints } from "../lib/mapPoints";
import type { MapFilter } from "../mapStore";
import type {
  KakaoBounds,
  KakaoCustomOverlay,
  KakaoMapInstance,
  MapPoint,
  MapViewport,
} from "../types";

export function useKakaoMap(
  points: MapPoint[],
  onSelectPoint: (id: string | null) => void,
  selectedPointId: string | null,
  initialCenter: Coordinates,
  currentLocation: Coordinates | null,
  mapBottomInset: number,
  selectedPointBottomInset: number,
  enabled = true,
  activeFilter?: MapFilter,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const initialCenterRef = useRef(initialCenter);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">(
    "loading"
  );
  const [bounds, setBounds] = useState<KakaoBounds | null>(null);
  const [level, setLevel] = useState(initialMapLevel);
  const [viewport, setViewport] = useState<MapViewport | null>(null);

  if (!mapRef.current) {
    initialCenterRef.current = initialCenter;
  }

  const focusMapOn = useCallback(
    (coordinates: Coordinates, bottomInset: number, nextLevel?: number) => {
      if (!mapRef.current || !window.kakao) return;

      if (nextLevel) {
        mapRef.current.setLevel(nextLevel);
      }

      const target = new window.kakao.maps.LatLng(
        coordinates.lat,
        coordinates.lng
      );
      const projection = mapRef.current.getProjection();
      const targetPoint = projection.containerPointFromCoords(target);
      const adjustedPoint = new window.kakao.maps.Point(
        targetPoint.x,
        targetPoint.y + Math.round(bottomInset / 2)
      );
      const adjustedCenter = projection.coordsFromContainerPoint(adjustedPoint);

      mapRef.current.panTo(adjustedCenter);
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let initializedMap: KakaoMapInstance | null = null;
    let backgroundClickHandler: (() => void) | null = null;
    setStatus("loading");

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

      const kakaoMaps = window.kakao.maps;
      const mapContainer = containerRef.current;

      try {
        const center = new kakaoMaps.LatLng(
          initialCenterRef.current.lat,
          initialCenterRef.current.lng,
        );
        const map = new kakaoMaps.Map(mapContainer, {
          center,
          level: initialMapLevel
        });
        map.setMaxLevel(maxMapLevel);

        mapRef.current = map;
        initializedMap = map;
        backgroundClickHandler = () => onSelectPoint(null);
        kakaoMaps.event.addListener(map, "click", backgroundClickHandler);

        const syncMap = () => {
          const nextBounds = map.getBounds();
          const center = map.getCenter();
          const northEast = nextBounds.getNorthEast();
          const southWest = nextBounds.getSouthWest();

          setBounds(nextBounds);
          setLevel(map.getLevel());
          setViewport({
            center: { lat: center.getLat(), lng: center.getLng() },
            radiusMeters: Math.max(
              getDistanceMeters(center, northEast),
              getDistanceMeters(center, southWest),
            ),
          });
        };

        kakaoMaps.event.addListener(map, "idle", syncMap);
        kakaoMaps.event.addListener(map, "zoom_changed", syncMap);
        setStatus("ready");
        syncMap();

        const relayout = () => {
          const preservedCenter = map.getCenter();
          map.relayout();
          map.setCenter(preservedCenter);
          syncMap();
        };

        window.requestAnimationFrame(relayout);
        window.setTimeout(relayout, 120);

        resizeObserver = new ResizeObserver(relayout);
        resizeObserver.observe(mapContainer);
        if (mapContainer.parentElement) {
          resizeObserver.observe(mapContainer.parentElement);
        }
      } catch (error) {
        console.error("Failed to initialize Kakao map", error);
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      if (initializedMap && backgroundClickHandler && window.kakao) {
        window.kakao.maps.event.removeListener(
          initializedMap,
          "click",
          backgroundClickHandler,
        );
      }
    };
  }, [enabled, onSelectPoint]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    const relayout = () => {
      const map = mapRef.current;
      if (!map) return;

      const preservedCenter = map.getCenter();
      const nextBounds = map.getBounds();
      const northEast = nextBounds.getNorthEast();
      const southWest = nextBounds.getSouthWest();
      map.relayout();
      map.setCenter(preservedCenter);
      const relayoutBounds = map.getBounds();
      const relayoutCenter = map.getCenter();
      const relayoutNorthEast = relayoutBounds.getNorthEast();
      const relayoutSouthWest = relayoutBounds.getSouthWest();

      setBounds(relayoutBounds);
      setLevel(map.getLevel());
      setViewport({
        center: { lat: relayoutCenter.getLat(), lng: relayoutCenter.getLng() },
        radiusMeters: Math.max(
          getDistanceMeters(relayoutCenter, relayoutNorthEast),
          getDistanceMeters(relayoutCenter, relayoutSouthWest),
          getDistanceMeters(preservedCenter, northEast),
          getDistanceMeters(preservedCenter, southWest),
        ),
      });
    };

    window.requestAnimationFrame(relayout);
    window.setTimeout(relayout, 120);
  }, [mapBottomInset, selectedPointBottomInset, status]);

  useEffect(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const kakaoMaps = window.kakao?.maps;
    if (status !== "ready" || !mapRef.current || !kakaoMaps) return;

    const pointsInBounds = bounds
      ? points.filter((point) =>
          bounds.contain(
            new kakaoMaps.LatLng(point.coordinates.lat, point.coordinates.lng),
          ),
        )
      : points;

    clusterPoints(pointsInBounds, level).forEach((cluster) => {
      const content = document.createElement("button");
      content.type = "button";
      const isSinglePoint = cluster.points.length === 1;
      const isSelected =
        isSinglePoint && cluster.points[0].id === selectedPointId;
      content.className =
        !isSinglePoint
          ? getClusterClassName(cluster.points.length)
          : getOverlayClassName(cluster.points[0], isSelected, activeFilter);
      if (cluster.points.length === 1 && cluster.points[0].kind === "place") {
        content.style.setProperty(
          "--marker-color",
          getPlaceMarkerColor(cluster.points[0])
        );
      }
      content.innerHTML =
        cluster.points.length > 1
          ? `<span>${cluster.points.length}</span>`
          : getOverlayContent(cluster.points[0], activeFilter);
      if (cluster.points.length === 1 && cluster.points[0].kind === "spot") {
        replaceBrokenMarkerImage(content, cluster.points[0]);
      }
      content.addEventListener("click", (event) => {
        event.stopPropagation();
        if (cluster.points.length > 1 && mapRef.current && window.kakao) {
          const anchor = new kakaoMaps.LatLng(
            cluster.center.lat,
            cluster.center.lng
          );
          mapRef.current.setLevel(Math.max(2, mapRef.current.getLevel() - 2), {
            anchor
          });
          mapRef.current.panTo(anchor);
          return;
        }

        onSelectPoint(cluster.points[0].id);
        focusMapOn(cluster.center, selectedPointBottomInset);
      });

      const overlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(cluster.center.lat, cluster.center.lng),
        content,
        yAnchor: 1,
        zIndex: isSelected ? 20 : cluster.points.length > 1 ? 8 : 10
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    });

    if (currentLocation) {
      const content = document.createElement("div");
      content.className = "current-location-marker";

      const overlay = new kakaoMaps.CustomOverlay({
        position: new kakaoMaps.LatLng(
          currentLocation.lat,
          currentLocation.lng
        ),
        content,
        yAnchor: 0.5,
        zIndex: 35
      });
      overlay.setMap(mapRef.current);
      overlaysRef.current.push(overlay);
    }
  }, [
    bounds,
    currentLocation,
    focusMapOn,
    level,
    onSelectPoint,
    points,
    selectedPointBottomInset,
    selectedPointId,
    status,
    activeFilter,
  ]);

  const moveTo = useCallback(
    (coordinates: Coordinates) => {
      focusMapOn(coordinates, selectedPointBottomInset, 4);
    },
    [focusMapOn, selectedPointBottomInset]
  );

  const recenterTo = useCallback(
    (coordinates: Coordinates) => {
      focusMapOn(coordinates, mapBottomInset, 4);
    },
    [focusMapOn, mapBottomInset]
  );

  return {
    bounds,
    containerRef,
    level,
    moveTo,
    recenterTo,
    status,
    viewport,
  };
}

function getDistanceMeters(
  from: { getLat: () => number; getLng: () => number },
  to: { getLat: () => number; getLng: () => number },
) {
  const earthRadiusMeters = 6_371_000;
  const lat1 = toRadians(from.getLat());
  const lat2 = toRadians(to.getLat());
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(to.getLng() - from.getLng());
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function getOverlayClassName(
  point: MapPoint,
  selected: boolean,
  activeFilter?: MapFilter,
) {
  const baseClassName =
    point.kind === "place"
      ? "place-star-marker"
      : activeFilter === "friend"
        ? "friend-profile-marker"
        : "spot-avatar-marker";

  return selected ? `${baseClassName} is-selected` : baseClassName;
}

function getClusterClassName(count: number) {
  return count >= 100
    ? "map-cluster-marker is-large"
    : "map-cluster-marker";
}

function getOverlayContent(point: MapPoint, activeFilter?: MapFilter) {
  if (point.kind === "place") {
    return `<span>${escapeHtml(point.name)}</span>`;
  }

  const authorName = point.authorName?.trim() || "익명";

  if (activeFilter === "friend") {
    return point.authorAvatarUrl
      ? `<img src="${escapeHtml(point.authorAvatarUrl)}" alt="" loading="lazy" decoding="async" /><span>${escapeHtml(authorName)}</span>`
      : `<strong>${escapeHtml(getMarkerInitial(authorName))}</strong><span>${escapeHtml(authorName)}</span>`;
  }

  const categoryLabel =
    categoryLabels[point.source.category]?.replace(/\s+/g, "") ?? "쪽지";

  return point.authorAvatarUrl
    ? `<img src="${escapeHtml(point.authorAvatarUrl)}" alt="" loading="lazy" decoding="async" /><span>#${escapeHtml(categoryLabel)}</span>`
    : `<strong>${escapeHtml(getMarkerInitial(authorName))}</strong><span>#${escapeHtml(categoryLabel)}</span>`;
}

function replaceBrokenMarkerImage(
  content: HTMLElement,
  point: Extract<MapPoint, { kind: "spot" }>,
) {
  const image = content.querySelector("img");
  if (!image) return;

  image.addEventListener("error", () => {
    const fallback = document.createElement("strong");
    fallback.textContent = getMarkerInitial(point.authorName);
    image.replaceWith(fallback);
  });
}

function getMarkerInitial(value: string | null | undefined) {
  return value?.trim().slice(0, 1) || "?";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}
