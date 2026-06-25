export function normalizeCourseTags(
  tags: Array<string | null | undefined>,
  fallback = "로컬",
) {
  const normalized = tags
    .map((tag) => tag?.replace(/^#/, "").trim())
    .filter((tag): tag is string => Boolean(tag));
  const uniqueTags = Array.from(new Set(normalized)).slice(0, 4);

  return uniqueTags.length > 0 ? uniqueTags : [fallback];
}

export function parseCourseDescriptionTags(description?: string | null) {
  if (!description) return [];
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
