import type { LocalNote, Place } from "@/shared/types/domain";
import type { MapFilter } from "../mapStore";
import type { MapPoint, MarkerCluster } from "../types";

export function toMapPoints(places: Place[], notes: LocalNote[]) {
  return [
    ...places.map<MapPoint>((place) => ({
      id: place.id,
      kind: "place",
      name: place.name,
      coordinates: place.coordinates,
      saved: place.saved,
      source: place
    })),
    ...notes.map<MapPoint>((note) => ({
      id: note.id,
      kind: "spot",
      name: note.placeName,
      authorName: note.authorName,
      authorAvatarUrl: note.authorAvatarUrl,
      coordinates: note.coordinates,
      saved: note.saved,
      source: note
    }))
  ];
}

export function getFriends(notes: LocalNote[]) {
  return Array.from(
    new Map(
      notes
        .filter((note) => note.relationshipToViewer === "friend")
        .map((note) => [note.authorName, note])
    ).values()
  );
}

export function filterMapPoints({
  filter,
  points,
  query,
  selectedFriend
}: {
  filter: MapFilter;
  points: MapPoint[];
  query: string;
  selectedFriend: string | null;
}) {
  return points.filter((point) => {
    if (!pointMatchesQuery(point, query)) return false;
    if (filter === "place") return point.kind === "place";
    if (filter === "spot") return point.kind === "spot";
    if (filter === "saved") return point.saved;
    if (filter === "friend") {
      return (
        point.kind === "spot" &&
        point.source.relationshipToViewer === "friend" &&
        (!selectedFriend || point.authorName === selectedFriend)
      );
    }

    return true;
  });
}

export function clusterPoints(points: MapPoint[], level: number) {
  const groups = new Map<string, MapPoint[]>();

  points.forEach((point) => {
    const key = getClusterKey(point, level);
    groups.set(key, [...(groups.get(key) ?? []), point]);
  });

  return Array.from(groups.entries()).map<MarkerCluster>(([id, group]) => ({
    id,
    center: {
      lat:
        group.reduce((total, point) => total + point.coordinates.lat, 0) /
        group.length,
      lng:
        group.reduce((total, point) => total + point.coordinates.lng, 0) /
        group.length
    },
    points: group
  }));
}

export function getFallbackPosition(coordinates: { lat: number; lng: number }) {
  const latRange = { min: 37.5405, max: 37.5595 };
  const lngRange = { min: 126.892, max: 127.047 };
  const left =
    ((coordinates.lng - lngRange.min) / (lngRange.max - lngRange.min)) * 100;
  const top =
    (1 - (coordinates.lat - latRange.min) / (latRange.max - latRange.min)) * 100;

  return {
    left: `${Math.min(88, Math.max(8, left))}%`,
    top: `${Math.min(82, Math.max(12, top))}%`
  };
}

function getClusterKey(point: MapPoint, level: number) {
  if (level < 5) return point.id;

  const precision = level >= 7 ? 0.03 : 0.008;
  const lat = Math.round(point.coordinates.lat / precision);
  const lng = Math.round(point.coordinates.lng / precision);

  return `${lat}:${lng}`;
}

function pointMatchesQuery(point: MapPoint, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const searchableText =
    point.kind === "place"
      ? `${point.name} ${point.source.area} ${point.source.tags.join(" ")}`
      : `${point.name} ${point.authorName} ${point.source.body}`;

  return searchableText.toLowerCase().includes(normalizedQuery);
}
