import { getAttractionDetail } from "@/features/attractions/attractionApi";
import type { AttractionDetailResponse } from "@/features/attractions/attractionApi";
import type { StopPreview } from "@/features/course/courseApi";
import { parseAiCoursePreviewResponse } from "./schemas/courseResponseSchema";
import {
  getAiCourseProvider,
  getFallbackCourseProvider,
} from "./providers/aiCourseProvider";
import type {
  AiCourseProviderResult,
  GeneratedCourse,
  GeneratedCourseStop,
  GenerateCourseInput,
} from "./types";

const defaultTimeoutMs = 8_000;
const fallbackImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";

export async function generateCourse(input: GenerateCourseInput): Promise<GeneratedCourse> {
  try {
    const result = await withTimeout(
      getAiCourseProvider().generate(input),
      getProviderTimeoutMs(),
    );

    return await toGeneratedCourse(input, result, { requireMatchedPlaces: true });
  } catch (error) {
    console.warn("AI course provider failed; using fallback course.", error);

    const fallbackResult = await getFallbackCourseProvider().generate(input);
    return toGeneratedCourse(
      input,
      {
        ...fallbackResult,
        source: "fallback",
      },
      { requireMatchedPlaces: false },
    );
  }
}

async function toGeneratedCourse(
  input: GenerateCourseInput,
  result: AiCourseProviderResult,
  { requireMatchedPlaces }: { requireMatchedPlaces: boolean },
): Promise<GeneratedCourse> {
  const preview = parseAiCoursePreviewResponse(result.preview);
  const stops = await resolveStops(preview.stops);
  const matchedStopCount = stops.filter((stop) => stop.placeIdMatched).length;

  if (requireMatchedPlaces && matchedStopCount < 2) {
    throw new Error("AI 추천 장소가 실제 장소 상세와 충분히 매칭되지 않았습니다.");
  }

  return {
    area: input.areaLabel,
    collaborators: [],
    companion: input.companionLabel,
    id: `${result.source}-${Date.now()}-${input.version}`,
    notice: result.notice,
    pace: input.paceLabel,
    savedAt: new Date().toISOString(),
    source: result.source,
    stops,
    styles: input.styleLabels,
    title: preview.title || `${input.areaLabel} 추천 코스`,
  };
}

async function resolveStops(stops: StopPreview[]) {
  const details = await Promise.all(
    stops.map((stop) => getAttractionDetail(stop.attractionId).catch(() => null)),
  );

  return stops.map<GeneratedCourseStop>((stop, index) => {
    const detail = details[index];
    const address = getAddress(detail, stop);

    return {
      id: index + 1,
      attractionId: stop.attractionId,
      category: address ? address.split(" ").slice(0, 2).join(" ") : "관광지",
      description: address || detail?.overview || "추천 장소 정보를 확인하는 중이에요.",
      imageUrl: detail?.imageUrl || stop.firstImage || fallbackImage,
      lat: detail?.latitude ?? 0,
      lng: detail?.longitude ?? 0,
      placeIdMatched: Boolean(detail),
      title: detail?.title || stop.title,
    };
  });
}

function getAddress(detail: AttractionDetailResponse | null, stop: StopPreview) {
  return detail?.address?.trim() || stop.addr1?.trim() || "";
}

function getProviderTimeoutMs() {
  const configured = Number(import.meta.env.VITE_AI_COURSE_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : defaultTimeoutMs;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timerId = 0;

  const timeout = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => {
      reject(new Error(`AI course provider timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    window.clearTimeout(timerId);
  }
}
