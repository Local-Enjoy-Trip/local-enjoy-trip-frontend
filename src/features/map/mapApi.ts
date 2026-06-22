import { apiGet } from "@/shared/api/http";
import { resolveNoteImageUrl } from "@/features/notes/noteImage";
import type {
  Coordinates,
  LocalNote,
  NoteCategory,
  Place,
  ViewerRelationship,
  Visibility,
} from "@/shared/types/domain";

export type MapApiFilter = "ALL" | "PLACE" | "NOTE" | "FRIEND";
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
  favorited: boolean;
  id: number;
  imageUrl: string | null;
  latitude: number;
  longitude: number;
  ratingAverage: number;
  ratingCount: number;
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
  latitude: number;
  longitude: number;
  regionName: string;
  relationshipToViewer: ApiViewerRelationship;
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

function toPlace(place: PlaceMapPinResponse): Place {
  const contentTypeLabel = contentTypeLabels[place.contentTypeId];
  const ratingLabel =
    place.ratingCount > 0 ? `평점 ${place.ratingAverage.toFixed(1)}` : null;

  return {
    area: place.address,
    coordinates: { lat: place.latitude, lng: place.longitude },
    id: `place-${place.id}`,
    imageUrl: place.imageUrl || fallbackPlaceImage,
    name: place.title,
    saved: place.favorited,
    summary: place.address || "장소 정보가 아직 등록되지 않았어요.",
    tags: [contentTypeLabel, ratingLabel].filter(
      (value): value is string => Boolean(value),
    ),
  };
}

function toLocalNote(note: NoteMapPinResponse): LocalNote {
  return {
    authorAvatarUrl: note.authorProfileImageUrl ?? undefined,
    authorName: note.authorNickname || note.authorUserId,
    body: note.title,
    category: toNoteCategory(note.category),
    coordinates: { lat: note.latitude, lng: note.longitude },
    createdAt: note.createdAt,
    id: `note-${note.id}`,
    imageUrl: resolveNoteImageUrl(note.imageObjectKey),
    placeName: note.regionName,
    relationshipToViewer: note.relationshipToViewer.toLowerCase() as ViewerRelationship,
    saved: false,
    visibility: note.visibility.toLowerCase() as Visibility,
  };
}

function toNoteCategory(category: ApiNoteCategory): NoteCategory {
  if (category === "TRANSIT_TIP") return "move";
  return category.toLowerCase() as NoteCategory;
}
