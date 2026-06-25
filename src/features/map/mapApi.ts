import { apiGet } from "@/shared/api/http";
import { resolveNoteImageSrc } from "@/features/notes/noteImage";
import type {
  Coordinates,
  LocalNote,
  NoteCategory,
  Place,
  ViewerRelationship,
  Visibility,
} from "@/shared/types/domain";

export type MapApiFilter = "ALL" | "PLACE" | "NOTE" | "FRIEND";
export type MapSearchTarget = "ALL" | "PLACE" | "NOTE";
export const mapExploreLimit = 200;

type MapCenterResponse = {
  fromRepresentativeLocation: boolean;
  latitude: number;
  longitude: number;
  regionName: string | null;
};

type PlaceMapPinResponse = {
  address: string;
  contentTypeId: string;
  distanceMeters: number;
  favorited?: boolean;
  favoriteCount?: number;
  id: number;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  ratingAverage: number;
  ratingCount: number;
  saveCount?: number;
  saved?: boolean;
  savedCount?: number;
  title: string;
};

type NoteMapPinResponse = {
  authorNickname: string;
  authorProfileImageUrl: string | null;
  authorUserId: string;
  category: ApiNoteCategory;
  createdAt: string;
  distanceMeters: number;
  id: number;
  imageObjectKey: string | null;
  imageUrl?: string | null;
  image?: {
    contentType: string;
    objectKey: string;
    publicUrl?: string;
  } | null;
  latitude: number;
  longitude: number;
  regionName: string;
  relationshipToViewer: ApiViewerRelationship;
  favoriteCount?: number;
  saveCount?: number;
  saved?: boolean;
  savedCount?: number;
  title: string;
  visibility: ApiVisibility;
};

type MapExploreResponse = {
  center: MapCenterResponse;
  filter: MapApiFilter;
  notes: NoteMapPinResponse[];
  places: PlaceMapPinResponse[];
  radiusMeters: number;
};

type MapSearchPinResponse =
  | (PlaceMapPinResponse & { type: "PLACE" })
  | (NoteMapPinResponse & { type: "NOTE" });

type ApiNoteCategory =
  | "BEST"
  | "MUSIC"
  | "BOOK"
  | "MOVIE"
  | "TIP"
  | "TRANSIT_TIP"
  | "UNCATEGORIZED";
type ApiVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";
type ApiViewerRelationship = "SELF" | "FRIEND" | "NONE";

export type MapExploreData = {
  center: {
    coordinates: Coordinates;
    fromRepresentativeLocation: boolean;
    regionName: string | null;
  };
  notes: LocalNote[];
  places: Place[];
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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1efe9'/%3E%3Cpath d='M95 224l73-83 50 51 34-39 58 71H95z' fill='%23c9c4ba'/%3E%3Ccircle cx='265' cy='94' r='27' fill='%23ddd8cf'/%3E%3C/svg%3E";

export async function getMapExplore({
  coordinates,
  filter,
  radiusMeters = 500,
}: {
  coordinates?: Coordinates;
  filter: MapApiFilter;
  radiusMeters?: number;
}) {
  const radius = Math.max(500, Math.round(radiusMeters));
  const params = new URLSearchParams({
    filter,
    limit: String(mapExploreLimit),
    radius: String(radius),
  });

  if (coordinates) {
    params.set("mapX", String(coordinates.lng));
    params.set("mapY", String(coordinates.lat));
  }

  const response = await apiGet<MapExploreResponse>(
    `/api/map/explore?${params.toString()}`,
  );

  return {
    center: {
      coordinates: {
        lat: response.center.latitude,
        lng: response.center.longitude,
      },
      fromRepresentativeLocation: response.center.fromRepresentativeLocation,
      regionName: response.center.regionName,
    },
    notes: response.notes.map(toLocalNote),
    places: response.places.map(toPlace),
  } satisfies MapExploreData;
}

export async function searchMap({
  coordinates,
  keyword,
  radiusMeters = 500,
  target = "ALL",
}: {
  coordinates?: Coordinates;
  keyword: string;
  radiusMeters?: number;
  target?: MapSearchTarget;
}) {
  const params = new URLSearchParams({
    keyword,
    limit: "50",
    target,
  });

  if (radiusMeters > 0) {
    params.set("radius", String(Math.round(radiusMeters)));
  }

  if (coordinates) {
    params.set("mapX", String(coordinates.lng));
    params.set("mapY", String(coordinates.lat));
  }

  const response = await apiGet<MapSearchPinResponse[]>(
    `/api/map/search?${params.toString()}`,
  );

  return {
    notes: response
      .filter((pin): pin is NoteMapPinResponse & { type: "NOTE" } => pin.type === "NOTE")
      .map(toLocalNote),
    places: response
      .filter((pin): pin is PlaceMapPinResponse & { type: "PLACE" } => pin.type === "PLACE")
      .map(toPlace),
  };
}

function toPlace(place: PlaceMapPinResponse): Place {
  const contentTypeLabel = contentTypeLabels[place.contentTypeId];
  const ratingLabel =
    place.ratingCount > 0 ? `평점 ${place.ratingAverage.toFixed(1)}` : null;

  return {
    area: place.address,
    coordinates: { lat: place.latitude, lng: place.longitude },
    favoriteCount: getFavoriteCount(place),
    id: `place-${place.id}`,
    imageUrl: place.imageUrl || fallbackPlaceImage,
    name: place.title,
    saved: place.saved ?? place.favorited ?? false,
    summary: place.address || "장소 정보가 아직 등록되지 않았어요.",
    tags: [contentTypeLabel, ratingLabel].filter(
      (value): value is string => Boolean(value),
    ),
  };
}

function toLocalNote(note: NoteMapPinResponse): LocalNote {
  const rawId = String(note.id);
  const normalizedId = rawId.startsWith("note-") ? rawId : `note-${rawId}`;

  return {
    authorAvatarUrl: note.authorProfileImageUrl ?? undefined,
    authorName: note.authorNickname || note.authorUserId,
    body: note.title,
    category: toNoteCategory(note.category),
    coordinates: { lat: note.latitude, lng: note.longitude },
    createdAt: note.createdAt,
    favoriteCount: getFavoriteCount(note),
    id: normalizedId,
    imageUrl: resolveNoteImageSrc(note),
    placeName: note.regionName,
    relationshipToViewer: note.relationshipToViewer.toLowerCase() as ViewerRelationship,
    saved: note.saved ?? false,
    visibility: note.visibility.toLowerCase() as Visibility,
  };
}

function getFavoriteCount(item: {
  favoriteCount?: number;
  saveCount?: number;
  saved?: boolean;
  savedCount?: number;
}) {
  return Math.max(
    0,
    item.savedCount ?? item.saveCount ?? item.favoriteCount ?? (item.saved ? 1 : 0),
  );
}

function toNoteCategory(category: ApiNoteCategory): NoteCategory {
  if (category === "TRANSIT_TIP") return "move";
  const normalizedCategory = category.toLowerCase();

  if (
    normalizedCategory === "best" ||
    normalizedCategory === "music" ||
    normalizedCategory === "book" ||
    normalizedCategory === "movie" ||
    normalizedCategory === "tip" ||
    normalizedCategory === "uncategorized"
  ) {
    return normalizedCategory as NoteCategory;
  }

  return "uncategorized";
}
