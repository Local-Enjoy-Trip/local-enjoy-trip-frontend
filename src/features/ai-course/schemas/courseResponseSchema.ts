import type { AiCoursePreviewResponse, StopPreview } from "@/features/course/courseApi";

export class AiCourseSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiCourseSchemaError";
  }
}

export function parseAiCoursePreviewResponse(value: unknown): AiCoursePreviewResponse {
  if (!isRecord(value)) {
    throw new AiCourseSchemaError("AI 추천 응답이 객체가 아닙니다.");
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const reason = typeof value.reason === "string" ? value.reason.trim() : undefined;
  const rawStops = Array.isArray(value.stops) ? value.stops : [];
  const stops = rawStops
    .map(parseStopPreview)
    .filter((stop): stop is StopPreview => stop !== null);
  const uniqueStops = dedupeStops(stops);

  if (uniqueStops.length < 2) {
    throw new AiCourseSchemaError("AI 추천 응답에 저장 가능한 장소가 부족합니다.");
  }

  return {
    title,
    reason,
    stops: uniqueStops.slice(0, 5),
  };
}

function parseStopPreview(value: unknown): StopPreview | null {
  if (!isRecord(value)) return null;

  const attractionId = Number(value.attractionId);
  const title = typeof value.title === "string" ? value.title.trim() : "";

  if (!Number.isInteger(attractionId) || attractionId <= 0 || !title) {
    return null;
  }

  return {
    attractionId,
    title,
    addr1: typeof value.addr1 === "string" ? value.addr1.trim() : undefined,
    firstImage:
      typeof value.firstImage === "string" ? value.firstImage.trim() : undefined,
  };
}

function dedupeStops(stops: StopPreview[]) {
  const seen = new Set<number>();

  return stops.filter((stop) => {
    if (seen.has(stop.attractionId)) return false;
    seen.add(stop.attractionId);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
