const defaultNoteImageBaseUrl =
  "http://localhost:19000/dongnepin-notes/";

type NoteImageSource = {
  image?: {
    imageObjectKey?: string | null;
    image_object_key?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    objectKey?: string | null;
    object_key?: string | null;
    publicUrl?: string | null;
    public_url?: string | null;
    url?: string | null;
  } | null;
  fileUrl?: string | null;
  file_url?: string | null;
  imageObjectKey?: string | null;
  image_object_key?: string | null;
  imagePublicUrl?: string | null;
  image_public_url?: string | null;
  imageURL?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  objectKey?: string | null;
  object_key?: string | null;
  publicUrl?: string | null;
  public_url?: string | null;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
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
    source.thumbnailUrl ??
    source.thumbnail_url ??
    source.publicUrl ??
    source.public_url ??
    source.imagePublicUrl ??
    source.image_public_url ??
    source.fileUrl ??
    source.file_url ??
    source.image?.imageUrl ??
    source.image?.image_url ??
    source.image?.publicUrl ??
    source.image?.public_url ??
    source.image?.url;
  const objectKey =
    source.imageObjectKey ??
    source.image_object_key ??
    source.objectKey ??
    source.object_key ??
    source.image?.imageObjectKey ??
    source.image?.image_object_key ??
    source.image?.object_key ??
    source.image?.objectKey;

  return directUrl?.trim() || resolveNoteImageUrl(objectKey);
}
