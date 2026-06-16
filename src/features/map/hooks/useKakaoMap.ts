import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/shared/types/domain";
import { getPlaceMarkerColor, initialMapLevel, mapCenter } from "../constants";
import { loadKakaoMap } from "../lib/kakaoMap";
import { clusterPoints } from "../lib/mapPoints";
import type { KakaoBounds, KakaoCustomOverlay, KakaoMapInstance, MapPoint } from "../types";

export function useKakaoMap(
  points: MapPoint[],
  onSelectPoint: (id: string) => void,
  selectedPointId: string | null,
  currentLocation: Coordinates | null,
  mapBottomInset: number,
  selectedPointBottomInset: number,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const overlaysRef = useRef<KakaoCustomOverlay[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing-key" | "error">(
    "loading"
  );
  const [bounds, setBounds] = useState<KakaoBounds | null>(null);
  const [level, setLevel] = useState(initialMapLevel);

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
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

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
        const center = new kakaoMaps.LatLng(mapCenter.lat, mapCenter.lng);
        const map = new kakaoMaps.Map(mapContainer, {
          center,
          level: initialMapLevel
        });

        mapRef.current = map;

        const syncMap = () => {
          setBounds(map.getBounds());
          setLevel(map.getLevel());
        };

        kakaoMaps.event.addListener(map, "idle", syncMap);
        kakaoMaps.event.addListener(map, "zoom_changed", syncMap);
        setStatus("ready");
        syncMap();

        const relayout = () => {
          map.relayout();
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
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;

    const relayout = () => {
      mapRef.current?.relayout();
      if (mapRef.current) {
        setBounds(mapRef.current.getBounds());
        setLevel(mapRef.current.getLevel());
      }
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
          : getOverlayClassName(cluster.points[0], isSelected);
      if (cluster.points.length === 1 && cluster.points[0].kind === "place") {
        content.style.setProperty(
          "--marker-color",
          getPlaceMarkerColor(cluster.points[0])
        );
      }
      content.innerHTML =
        cluster.points.length > 1
          ? `<span>${cluster.points.length}</span>`
          : getOverlayContent(cluster.points[0]);
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

  return { bounds, containerRef, level, moveTo, recenterTo, status };
}

function getOverlayClassName(point: MapPoint, selected: boolean) {
  const baseClassName =
    point.kind === "place" ? "place-star-marker" : "spot-avatar-marker";

  return selected ? `${baseClassName} is-selected` : baseClassName;
}

function getClusterClassName(count: number) {
  return count >= 100
    ? "map-cluster-marker is-large"
    : "map-cluster-marker";
}

function getOverlayContent(point: MapPoint) {
  if (point.kind === "place") {
    return `<span>${point.name}</span>`;
  }

  if (point.authorAvatarUrl) {
    return `<img src="${point.authorAvatarUrl}" alt="" /><span>${point.authorName}</span>`;
  }

  return `<strong>${point.authorName.slice(0, 1)}</strong><span>${point.authorName}</span>`;
}
