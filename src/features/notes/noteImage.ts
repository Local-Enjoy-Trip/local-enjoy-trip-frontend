const defaultNoteImageBaseUrl =
  "http://localhost:19000/dongnepin-notes/";

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
