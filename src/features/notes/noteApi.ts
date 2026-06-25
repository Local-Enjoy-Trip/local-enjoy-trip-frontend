import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "@/shared/api/http";

export type NoteCategory =
  | "BEST"
  | "MUSIC"
  | "BOOK"
  | "MOVIE"
  | "TIP"
  | "TRANSIT_TIP"
  | "UNCATEGORIZED";

export type NoteVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export type NoteImageReference = {
  contentType: string;
  objectKey: string;
  publicUrl?: string;
};

export type NoteWriteRequest = {
  category: NoteCategory;
  content: string;
  image?: NoteImageReference;
  latitude: number;
  longitude: number;
  regionName?: string;
  title: string;
  visibility: NoteVisibility;
};

export type NoteResponse = NoteWriteRequest & {
  authorUserId: string;
  createdAt: string;
  id: number;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  status: "ACTIVE" | "HIDDEN" | "DELETED";
  updatedAt: string;
};

type NotesResponse = { notes: NoteResponse[] };

type PresignedUploadResponse = {
  expiresAt: string;
  objectKey: string;
  publicUrl?: string;
  uploadUrl: string;
};

export const savedNotesQueryKey = ["notes", "saved"] as const;
export const myNotesQueryKey = ["notes", "me"] as const;

export function createNote(request: NoteWriteRequest) {
  return apiPost<NoteResponse>("/api/notes", request);
}

export function getSavedNotes(limit = 100) {
  return apiGet<NotesResponse>(`/api/notes/saved?limit=${limit}`).then(
    (response) => response.notes,
  );
}

export function getMyNotes(limit = 100) {
  return apiGet<NotesResponse>(`/api/notes/me?limit=${limit}`).then(
    (response) => response.notes,
  );
}

export function updateNote(id: number, request: NoteWriteRequest) {
  return apiPut<NoteResponse>(`/api/notes/${id}`, request);
}

export function deleteNote(id: number) {
  return apiDelete<void>(`/api/notes/${id}`);
}

export function saveNote(id: number) {
  return apiPut<void>(`/api/notes/${id}/save`);
}

export function unsaveNote(id: number) {
  return apiDelete<void>(`/api/notes/${id}/save`);
}

export async function uploadNoteImage(dataUrl: string) {
  const blob = await fetch(dataUrl).then((response) => response.blob());
  const contentType = blob.type || "image/jpeg";
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const upload = await apiPost<PresignedUploadResponse>(
    "/api/note-images/presigned-upload",
    { contentType, fileExtension: extension },
  );

  const uploadResponse = await fetch(upload.uploadUrl, {
    body: blob,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });

  if (!uploadResponse.ok) throw new Error("쪽지 이미지를 업로드하지 못했습니다.");

  return {
    contentType,
    objectKey: upload.objectKey,
    publicUrl: upload.publicUrl,
  } satisfies NoteImageReference;
}
