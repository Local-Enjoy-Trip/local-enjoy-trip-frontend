export type Visibility = "public" | "friends" | "private";

export type PinKind = "place" | "note" | "friend" | "saved";

export type NoteCategory =
  | "best"
  | "music"
  | "book"
  | "movie"
  | "tip"
  | "move"
  | "uncategorized";

export type ViewerRelationship = "self" | "friend" | "none";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  name: string;
  area: string;
  summary: string;
  tags: string[];
  coordinates: Coordinates;
  imageUrl: string;
  saved: boolean;
};

export type LocalNote = {
  id: string;
  body: string;
  createdAt?: string;
  authorName: string;
  authorAvatarUrl?: string;
  imageUrl?: string;
  category: NoteCategory;
  visibility: Visibility;
  placeName: string;
  coordinates: Coordinates;
  saved: boolean;
  relationshipToViewer?: ViewerRelationship;
};

export type Experience = {
  id: string;
  title: string;
  area: string;
  description: string;
  weatherFit: string;
  imageUrl: string;
  badgeLabel: string;
  detailLabel: string;
  placeIds: string[];
};

export type Course = {
  id: string;
  title: string;
  area: string;
  stopCount: number;
  visibility: Visibility;
};
