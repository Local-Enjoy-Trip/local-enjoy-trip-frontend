import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/shared/types/domain";
import { categoryLabels } from "@/shared/lib/labels";
import { getPlaceMarkerColor, initialMapLevel } from "../constants";
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
  activeFilter: MapFilter,
  onSelectPoint: (id: string) => void,
  selectedPointId: string | null,
  initialCenter: Coordinates,
  currentLocation: Coordinates | null,
  mapBottomInset: number,
  selectedPointBottomInset: number,
  enabled = true,
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

        mapRef.current = map;

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
      } catch (error) {
        console.error("Failed to initialize Kakao map", error);
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [enabled]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    const relayout = () => {
      const map = mapRef.current;
      if (!map) return;

      const preservedCenter = map.getCenter();
      map.relayout();
      map.setCenter(preservedCenter);
      setBounds(map.getBounds());
      setLevel(map.getLevel());
    };

    window.requestAnimationFrame(relayout);
    window.setTimeout(relayout, 120);
  }, [status]);

  useEffect(() => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];

    const kakaoMaps = window.kakao?.maps;
    if (status !== "ready" || !mapRef.current || !kakaoMaps) return;

    clusterPoints(points, level).forEach((cluster) => {
      const content = document.createElement("button");
      content.type = "button";
      const isSinglePoint = cluster.points.length === 1;
      const isSelected =
        isSinglePoint && cluster.points[0].id === selectedPointId;
      content.className =
        !isSinglePoint
          ? getClusterClassName(cluster.points.length)
          : getOverlayClassName(cluster.points[0], activeFilter, isSelected);
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
      content.addEventListener("click", () => {
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
    currentLocation,
    activeFilter,
    focusMapOn,
    level,
    onSelectPoint,
    points,
    selectedPointBottomInset,
    selectedPointId,
    status
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
  activeFilter: MapFilter,
  selected: boolean,
) {
  const baseClassName = point.kind === "place"
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

function getOverlayContent(point: MapPoint, activeFilter: MapFilter) {
  if (point.kind === "place") {
    return `<span>${escapeHtml(point.name)}</span>`;
  }

  if (activeFilter === "friend") {
    return point.authorAvatarUrl
      ? `<img src="${escapeHtml(point.authorAvatarUrl)}" alt="" /><span>${escapeHtml(point.authorName)}</span>`
      : `<strong>${escapeHtml(point.authorName.slice(0, 1))}</strong><span>${escapeHtml(point.authorName)}</span>`;
  }

  const imageUrl = point.source.imageUrl;
  const categoryLabel = `#${categoryLabels[point.source.category].replace(/\s+/g, "")}`;

  if (imageUrl) {
    return `<img src="${escapeHtml(imageUrl)}" alt="" /><span>${escapeHtml(categoryLabel)}</span>`;
  }

  return `<strong>${escapeHtml(point.authorName.slice(0, 1))}</strong><span>${escapeHtml(categoryLabel)}</span>`;
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
