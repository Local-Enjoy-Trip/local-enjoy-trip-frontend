import type { CSSProperties } from "react";
import type { Coordinates } from "@/shared/types/domain";
import { categoryLabels } from "@/shared/lib/labels";
import { getPlaceMarkerColor } from "../constants";
import { getFallbackPosition } from "../lib/mapPoints";
import type { MapFilter } from "../mapStore";
import type { MarkerCluster } from "../types";

export function FallbackMapLayer({
  activeFilter,
  clusters,
  currentLocation,
  onSelectPoint,
  selectedPointId
}: {
  activeFilter?: MapFilter;
  clusters: MarkerCluster[];
  currentLocation: Coordinates | null;
  onSelectPoint: (pointId: string) => void;
  selectedPointId: string | null;
}) {
  return (
    <div
      className="relative h-full overflow-hidden bg-[#e6efe9]"
      aria-label="지도 미리보기"
    >
      <div className="mock-map-grid" />
      <div className="absolute top-[14%] left-[7%] h-12 w-44 rounded-full bg-white/70 blur-[1px]" />
      <div className="absolute top-[46%] right-[6%] h-24 w-32 rounded-[42%] bg-[#cce8d0]/80" />
      {currentLocation ? (
        <div
          className="current-location-marker absolute -translate-x-1/2 -translate-y-1/2"
          style={getFallbackPosition(currentLocation)}
        />
      ) : null}
      {clusters.map((cluster) => {
        const point = cluster.points[0];
        const position = getFallbackPosition(cluster.center);
        const isSelected =
          cluster.points.length === 1 && point.id === selectedPointId;

        if (cluster.points.length > 1) {
          return (
            <button
              className={`map-cluster-marker absolute -translate-x-1/2 -translate-y-full ${
                cluster.points.length >= 100 ? "is-large" : ""
              }`}
              key={cluster.id}
              style={position}
              type="button"
              onClick={() => onSelectPoint(point.id)}
            >
              <span>{cluster.points.length}</span>
            </button>
          );
        }

        if (point.kind === "place") {
          return (
            <button
              className={`place-star-marker absolute -translate-x-1/2 -translate-y-full ${
                isSelected ? "is-selected z-10" : ""
              }`}
              key={point.id}
              style={{
                ...position,
                "--marker-color": getPlaceMarkerColor(point)
              } as CSSProperties}
              type="button"
              onClick={() => onSelectPoint(point.id)}
            >
              <span>{point.name}</span>
            </button>
          );
        }

        const isFriendMarker = activeFilter === "friend";

        return (
          <button
            className={`${isFriendMarker ? "friend-profile-marker" : "spot-avatar-marker"} absolute -translate-x-1/2 -translate-y-full ${
              isSelected ? "is-selected z-10" : ""
            }`}
            key={point.id}
            style={position}
            type="button"
            onClick={() => onSelectPoint(point.id)}
          >
            {(isFriendMarker ? point.authorAvatarUrl : point.source.imageUrl) ? (
              <img
                alt=""
                src={isFriendMarker ? point.authorAvatarUrl : point.source.imageUrl}
              />
            ) : (
              <strong>{point.authorName.slice(0, 1)}</strong>
            )}
            <span>{isFriendMarker
              ? point.authorName
              : `#${categoryLabels[point.source.category].replace(/\s+/g, "")}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
