import { parseAiCoursePreviewResponse } from "../schemas/courseResponseSchema";
import type { AiCourseProvider } from "../types";

const fallbackImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";

const mockStopsByRegion: Record<
  string,
  Array<{ attractionId: number; title: string; addr1: string; firstImage?: string }>
> = {
  "청운효자동": [
    { attractionId: 126508, title: "경복궁", addr1: "서울 종로구 사직로 161", firstImage: fallbackImage },
    { attractionId: 126531, title: "북촌한옥마을", addr1: "서울 종로구 계동길 37" },
    { attractionId: 126535, title: "남산서울타워", addr1: "서울 용산구 남산공원길 105" },
  ],
  "서교동": [
    { attractionId: 264570, title: "홍대 걷고싶은거리", addr1: "서울 마포구 어울마당로" },
    { attractionId: 132697, title: "망원시장", addr1: "서울 마포구 포은로8길 14" },
    { attractionId: 126535, title: "서울월드컵공원", addr1: "서울 마포구 월드컵로 243-60" },
  ],
  "성수1가2동": [
    { attractionId: 127801, title: "서울숲", addr1: "서울 성동구 뚝섬로 273" },
    { attractionId: 2752367, title: "성수동 카페거리", addr1: "서울 성동구 성수동2가" },
    { attractionId: 126535, title: "한강공원 뚝섬지구", addr1: "서울 광진구 강변북로 139" },
  ],
};

const defaultStops = [
  { attractionId: 126508, title: "경복궁", addr1: "서울 종로구 사직로 161", firstImage: fallbackImage },
  { attractionId: 127801, title: "서울숲", addr1: "서울 성동구 뚝섬로 273" },
  { attractionId: 132697, title: "망원시장", addr1: "서울 마포구 포은로8길 14" },
];

export const mockCourseProvider: AiCourseProvider = {
  name: "mock-course",
  async generate(request) {
    const stops = mockStopsByRegion[request.regionName] ?? defaultStops;
    const preview = parseAiCoursePreviewResponse({
      reason: "AI 토큰이 없거나 응답 검증에 실패했을 때 사용하는 시연용 추천입니다.",
      stops,
      title: `${formatRegionName(request.regionName)} 샘플 추천 코스`,
    });

    return {
      notice:
        "AI 응답을 받을 수 없어 샘플 코스를 보여드려요. 실제 장소 ID가 확인되면 그대로 저장할 수 있어요.",
      preview,
      source: "mock",
    };
  },
};

function formatRegionName(regionName: string) {
  if (!regionName.trim()) return "서울";
  return regionName.replace(/1가2동$/, "").replace(/동$/, "");
}
