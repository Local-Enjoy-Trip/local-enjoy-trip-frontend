import { apiDelete, apiGet, apiPut } from "@/shared/api/http";

export type SavedAttractionResponse = {
  addr1?: string | null;
  addr2?: string | null;
  addressName?: string | null;
  address?: string | null;
  contentTypeId?: string | null;
  favoriteCount?: number | null;
  firstImage?: string | null;
  id: number;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  saveCount?: number | null;
  saved?: boolean | null;
  savedCount?: number | null;
  roadAddress?: string | null;
  roadAddressName?: string | null;
  title: string;
};

type SavedAttractionsResponse = {
  attractions: SavedAttractionResponse[];
};

export const savedAttractionsQueryKey = ["attractions", "saved"] as const;

export function getSavedAttractions() {
  return apiGet<SavedAttractionsResponse>("/api/attractions/saved").then(
    (response) => response.attractions,
  );
}

export function saveAttraction(id: number) {
  return apiPut<void>(`/api/attractions/${id}/save`);
}

export function unsaveAttraction(id: number) {
  return apiDelete<void>(`/api/attractions/${id}/save`);
}

export type AttractionDetailResponse = {
  id: number;
  title: string;
  address?: string | null;
  addressDetail?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  contentTypeId?: string | null;
  overview?: string | null;
  saved?: boolean | null;
};

export function getAttractionDetail(id: number) {
  return apiGet<AttractionDetailResponse>(`/api/attractions/${id}`);
}
