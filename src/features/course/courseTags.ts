export function normalizeCourseTags(
  tags: unknown,
  fallback: unknown = "로컬",
) {
  const normalized = flattenCourseTagInputs(tags)
    .map(toCourseTagText)
    .map((tag) => tag?.replace(/^#/, "").trim())
    .filter((tag): tag is string => Boolean(tag));
  const uniqueTags = Array.from(new Set(normalized)).slice(0, 4);
  const fallbackTag = toCourseTagText(fallback)?.replace(/^#/, "").trim() || "로컬";

  return uniqueTags.length > 0 ? uniqueTags : [fallbackTag];
}

export function parseCourseDescriptionTags(description?: unknown) {
  if (typeof description !== "string" || !description.trim()) return [];
  if (description.includes("|")) {
    const parts = description.split("|");
    return (parts[1] ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(description)) return [];

  return description
    .split(/[·,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function flattenCourseTagInputs(tags: unknown): unknown[] {
  if (Array.isArray(tags)) return tags.flatMap(flattenCourseTagInputs);
  return [tags];
}

function toCourseTagText(tag: unknown) {
  if (typeof tag === "string") return tag;
  if (typeof tag === "number" || typeof tag === "boolean") return String(tag);
  if (!tag || typeof tag !== "object") return undefined;

  const record = tag as Record<string, unknown>;
  const value = record.name ?? record.tag ?? record.label ?? record.title;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}
