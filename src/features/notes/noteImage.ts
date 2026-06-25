const defaultNoteImageBaseUrl =
  "http://localhost:19000/dongnepin-notes/";

type NoteImageSource = {
  image?: {
    imageObjectKey?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    objectKey?: string | null;
    publicUrl?: string | null;
    url?: string | null;
  } | null;
  imageObjectKey?: string | null;
  imagePublicUrl?: string | null;
  imageURL?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  objectKey?: string | null;
  publicUrl?: string | null;
};

export function resolveNoteImageUrl(objectKey?: string | null) {
  if (!objectKey) return undefined;
  if (/^(?:https?:|data:|blob:)/i.test(objectKey)) return objectKey;

  const baseUrl = new URL(
    import.meta.env.VITE_NOTE_IMAGE_BASE_URL ?? defaultNoteImageBaseUrl,
  );
  const pathParts = baseUrl.pathname.split("/").filter(Boolean);
  const bucketName = pathParts[pathParts.length - 1];
  let normalizedKey = objectKey.replace(/^\/+/, "");

  if (bucketName && normalizedKey.startsWith(`${bucketName}/`)) {
    normalizedKey = normalizedKey.slice(bucketName.length + 1);
  }

  if (!baseUrl.pathname.endsWith("/")) baseUrl.pathname += "/";
  return new URL(normalizedKey, baseUrl).toString();
}

export function resolveNoteImageSrc(source: NoteImageSource) {
  const directUrl =
    source.imageUrl ??
    source.image_url ??
    source.imageURL ??
    source.publicUrl ??
    source.imagePublicUrl ??
    source.image?.imageUrl ??
    source.image?.image_url ??
    source.image?.publicUrl ??
    source.image?.url;
  const objectKey =
    source.imageObjectKey ??
    source.objectKey ??
    source.image?.imageObjectKey ??
    source.image?.objectKey;

  return directUrl?.trim() || resolveNoteImageUrl(objectKey);
}
