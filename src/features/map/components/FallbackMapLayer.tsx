import type { CSSProperties } from "react";
import { placeColors } from "../constants";
import { getFallbackPosition } from "../lib/mapPoints";
import type { MarkerCluster } from "../types";

export function FallbackMapLayer({
  clusters,
  onSelectPoint,
  selectedPointId
}: {
  clusters: MarkerCluster[];
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
      {clusters.map((cluster, index) => {
        const point = cluster.points[0];
        const position = getFallbackPosition(cluster.center);
        const isSelected =
          cluster.points.length === 1 && point.id === selectedPointId;

        if (cluster.points.length > 1) {
          return (
            <button
              className="map-cluster-marker absolute -translate-x-1/2 -translate-y-full"
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
                isSelected
                  ? "z-10 scale-110 drop-shadow-[0_14px_24px_rgba(24,91,61,0.28)]"
                  : ""
              }`}
              key={point.id}
              style={{
                ...position,
                "--marker-color": placeColors[index % placeColors.length]
              } as CSSProperties}
              type="button"
              onClick={() => onSelectPoint(point.id)}
            >
              <span>{point.name}</span>
            </button>
          );
        }

        return (
          <button
            className={`spot-avatar-marker absolute -translate-x-1/2 -translate-y-full ${
              isSelected
                ? "z-10 scale-110 drop-shadow-[0_14px_24px_rgba(24,91,61,0.28)]"
                : ""
            }`}
            key={point.id}
            style={position}
            type="button"
            onClick={() => onSelectPoint(point.id)}
          >
            {point.authorAvatarUrl ? (
              <img alt="" src={point.authorAvatarUrl} />
            ) : (
              <strong>{point.authorName.slice(0, 1)}</strong>
            )}
            <span>{point.authorName}</span>
          </button>
        );
      })}
    </div>
  );
}
