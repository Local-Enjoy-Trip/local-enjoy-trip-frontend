import { apiDelete, apiPut } from "@/shared/api/http";

export function saveAttraction(id: number) {
  return apiPut<void>(`/api/attractions/${id}/save`);
}

export function unsaveAttraction(id: number) {
  return apiDelete<void>(`/api/attractions/${id}/save`);
}
