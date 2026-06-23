import { apiGet } from "@/shared/api/http";
import { resolveNoteImageUrl } from "@/features/notes/noteImage";
import type { HomeNote } from "@/features/home/types/homeTypes";
import type { Coordinates, Experience } from "@/shared/types/domain";

export type WeatherSummary = {
  condition: string;
  rainChance: number | null;
  region: string;
  sunrise: string | null;
  sunset: string | null;
  temperature: number | null;
  tempMax: number | null;
  tempMin: number | null;
};

export type WeatherForecast = {
  condition: string;
  rainChance: number | null;
  temperature: number | null;
  time: string;
};

export type NeighborhoodBriefing = {
  briefing: string;
  forecasts: WeatherForecast[];
  region: string;
  weather: WeatherSummary;
};

type PopularAttractionResponse = {
  addr1: string | null;
  addr2: string | null;
  contentTypeId: string | null;
  distanceMeters: number;
  favoriteCount?: number;
  firstImage: string | null;
  id: number;
  latitude: number;
  longitude: number;
  popularityCount: number;
  saveCount?: number;
  title: string;
};

type PopularAttractionsResponse = {
  attractions: PopularAttractionResponse[];
};

type NearbyNoteResponse = {
  authorNickname?: string | null;
  authorProfileImageUrl?: string | null;
  authorUserId: string;
  content: string;
  createdAt: string;
  id: number;
  imageObjectKey: string | null;
  latitude?: number;
  longitude?: number;
  regionName: string | null;
  title: string;
};

type NearbyNotesResponse = {
  notes: NearbyNoteResponse[];
};

const contentTypeLabels: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
};

const fallbackPlaceImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23e9e7e2'/%3E%3Cpath d='M64 366l98-111 67 68 46-52 78 95H64z' fill='%23c8c3b9'/%3E%3Ccircle cx='292' cy='158' r='36' fill='%23d8d4cc'/%3E%3C/svg%3E";

export function getNeighborhoodBriefing({
  coordinates,
  regionName,
}: {
  coordinates: Coordinates;
  regionName: string;
}) {
  const params = new URLSearchParams({
    latitude: String(coordinates.lat),
    longitude: String(coordinates.lng),
    regionName,
  });

  return apiGet<NeighborhoodBriefing>(
    `/api/neighborhood/briefing?${params.toString()}`,
  );
}

export function getPopularNearbyExperiences(coordinates: Coordinates) {
  const params = createNearbyParams(coordinates, 3_000, 10);

  return apiGet<PopularAttractionsResponse>(
    `/api/attractions/popular-nearby?${params.toString()}`,
  ).then((response) => response.attractions.map(toExperience));
}

export function getNearbyHomeNotes(coordinates: Coordinates) {
  const params = createNearbyParams(coordinates, 3_000, 10);

  return apiGet<NearbyNotesResponse>(
    `/api/notes/nearby?${params.toString()}`,
  ).then((response) => response.notes.map(toHomeNote));
}

function createNearbyParams(
  coordinates: Coordinates,
  radius: number,
  limit: number,
) {
  return new URLSearchParams({
    limit: String(limit),
    mapX: String(coordinates.lng),
    mapY: String(coordinates.lat),
    radius: String(radius),
  });
}

function toExperience(attraction: PopularAttractionResponse): Experience {
  const contentType = attraction.contentTypeId
    ? contentTypeLabels[attraction.contentTypeId] ?? "장소"
    : "장소";
  const address = [attraction.addr1, attraction.addr2]
    .filter(Boolean)
    .join(" ");
  const savedCount = attraction.saveCount ?? attraction.favoriteCount ?? 0;

  return {
    area: getAreaLabel(address),
    badgeLabel:
      attraction.popularityCount > 0
        ? `인기 ${attraction.popularityCount}`
        : "주변 추천",
    coordinates: { lat: attraction.latitude, lng: attraction.longitude },
    description: address || "주변에서 발견한 장소예요.",
    detailLabel:
      savedCount > 0
        ? `${contentType} · 저장 ${savedCount}`
        : contentType,
    id: `place-${attraction.id}`,
    imageUrl: attraction.firstImage || fallbackPlaceImage,
    placeIds: [`place-${attraction.id}`],
    title: attraction.title,
    weatherFit: formatDistance(attraction.distanceMeters),
  };
}

function toHomeNote(note: NearbyNoteResponse): HomeNote {
  return {
    body: note.content || note.title,
    coordinates:
      Number.isFinite(note.latitude) && Number.isFinite(note.longitude)
        ? { lat: Number(note.latitude), lng: Number(note.longitude) }
        : undefined,
    createdAt: note.createdAt,
    id: `note-${note.id}`,
    image: resolveNoteImageUrl(note.imageObjectKey),
    location: note.regionName ? getAreaLabel(note.regionName) : "주변 동네",
    name: note.authorNickname || note.authorUserId,
    place: note.regionName || note.title,
    profileImage: note.authorProfileImageUrl ?? undefined,
  };
}

function getAreaLabel(address: string) {
  const area = address
    .split(/\s+/)
    .reverse()
    .find((part) => /(?:동|읍|면|구)$/.test(part));
  return area ?? "주변";
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1_000) return `${Math.round(distanceMeters)}m`;
  return `${(distanceMeters / 1_000).toFixed(1)}km`;
}
