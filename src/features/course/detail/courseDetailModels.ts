import type { AttractionDetailResponse } from "@/features/attractions/attractionApi";
import type {
  CourseCreateRequest,
  CourseItemRequest,
  CourseItemResponse,
  CourseResponse,
} from "@/features/course/courseApi";
import {
  normalizeCourseTags,
  parseCourseDescriptionTags,
} from "@/features/course/courseTags";
import type { MapPoint } from "@/features/map/types";
import type { CourseStop } from "./types";

const defaultStops: CourseStop[] = [
  {
    id: 1,
    accent: "violet",
    category: "시장 · 망원",
    coordinates: { lat: 37.5567, lng: 126.9057 },
    description: "동네 간식으로 가볍게 하루를 시작해요.",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원시장",
  },
  {
    id: 2,
    accent: "violet",
    category: "골목 산책 · 망원",
    coordinates: { lat: 37.5562, lng: 126.9049 },
    description: "작은 가게와 오래된 주택 사이를 천천히 걸어요.",
    distanceFromPrevious: "650m",
    imageUrl:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원시장 골목",
  },
  {
    id: 3,
    accent: "coral",
    category: "공원 · 한강",
    coordinates: { lat: 37.5545, lng: 126.897 },
    description: "강바람을 맞으며 노을이 드는 시간을 즐겨요.",
    distanceFromPrevious: "1.2km",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원한강공원 입구",
  },
  {
    id: 4,
    accent: "mint",
    category: "노을 산책 · 한강",
    coordinates: { lat: 37.5548, lng: 126.8959 },
    description: "한강을 따라 이어지는 길에서 천천히 쉬어가요.",
    distanceFromPrevious: "480m",
    imageUrl:
      "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "한강 산책로",
  },
  {
    id: 5,
    accent: "violet",
    category: "소품 · 망원",
    coordinates: { lat: 37.5569, lng: 126.9036 },
    description: "작은 소품과 로컬 가게를 둘러보며 취향을 찾아요.",
    distanceFromPrevious: "320m",
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원 소품샵 거리",
  },
  {
    id: 6,
    accent: "coral",
    category: "카페 · 망원",
    coordinates: { lat: 37.5574, lng: 126.9027 },
    description: "골목 안쪽 카페에서 잠깐 숨을 고르며 쉬어가요.",
    distanceFromPrevious: "210m",
    imageUrl:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "골목 카페",
  },
  {
    id: 7,
    accent: "violet",
    category: "책방 · 망원",
    coordinates: { lat: 37.5582, lng: 126.9042 },
    description: "동네 큐레이션이 담긴 책방에서 조용히 머물러요.",
    distanceFromPrevious: "430m",
    imageUrl:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "동네 책방",
  },
  {
    id: 8,
    accent: "mint",
    category: "디저트 · 망원",
    coordinates: { lat: 37.5578, lng: 126.9062 },
    description: "가벼운 디저트로 하루 코스를 기분 좋게 마무리해요.",
    distanceFromPrevious: "380m",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=720&q=80",
    location: "망원",
    title: "망원 디저트 바",
  },
];

const fallbackCourseImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";


export function sortedCourseItems(course: CourseResponse) {
  return [...course.items].sort((a, b) => a.position - b.position);
}

export function toDisplayRouteStops(
  course: CourseResponse,
  details: Record<number, AttractionDetailResponse>,
): CourseStop[] {
  const items = sortedCourseItems(course);
  const base = course.startLocation
    ? { lat: course.startLocation.latitude, lng: course.startLocation.longitude }
    : defaultStops[0].coordinates;

  return items.map((item, index) => {
    const fallbackStop = defaultStops[index % defaultStops.length];
    const segment = course.segments?.find(
      (candidate) => candidate.toPosition === item.position,
    );
    const detail = item.attractionId ? details[item.attractionId] : undefined;

    return {
      id: item.position || index + 1,
      accent: (["violet", "coral", "mint"] as const)[index % 3],
      category: detail
        ? `${getAttractionCategoryLabel(detail.contentTypeId)} · ${course.regionName ?? "코스"}`
        : `${getCourseItemTypeLabel(item)} · ${course.regionName ?? "코스"}`,
      coordinates: detail
        ? { lat: detail.latitude, lng: detail.longitude }
        : {
            lat: base.lat + index * 0.0018 + (index % 2) * 0.001,
            lng: base.lng + index * 0.0022 - (index % 2) * 0.001,
          },
      description:
        item.memo?.trim() ||
        detail?.overview?.trim() ||
        course.description?.trim() ||
        `${course.regionName ?? "이 동네"}에서 이어지는 추천 코스예요.`,
      distanceFromPrevious:
        index === 0
          ? undefined
          : segment
            ? `${Math.max(1, Math.round(segment.distanceMeters))}m`
            : `${320 + index * 110}m`,
      imageUrl: detail?.imageUrl || course.coverImageUrl || fallbackStop.imageUrl || fallbackCourseImage,
      location: course.regionName ?? fallbackStop.location,
      sourceItem: item,
      title: item.title?.trim() || detail?.title || `${getCourseItemTypeLabel(item)} ${index + 1}`,
    };
  });
}

function getAttractionCategoryLabel(contentTypeId?: string | null) {
  if (!contentTypeId) return "장소";
  const mapping: Record<string, string> = {
    "12": "관광지",
    "14": "문화시설",
    "15": "축제공연행사",
    "25": "여행코스",
    "28": "레포츠",
    "32": "숙박",
    "38": "쇼핑",
    "39": "음식점",
  };
  return mapping[contentTypeId] || "장소";
}

function getCourseItemTypeLabel(item: CourseItemResponse) {
  if (item.itemType === "NOTE") return "쪽지";
  if (item.itemType === "ATTRACTION") return "장소";
  return item.itemType || "장소";
}

export function toCourseUpdateRequest(course: CourseResponse) {
  return {
    coverImageUrl: course.coverImageUrl ?? getFirstCourseItemImage(course),
    description: course.description ?? undefined,
    items: sortedCourseItems(course).map((item) => ({
      attractionId: item.attractionId ?? undefined,
      day: item.day,
      itemType: item.itemType,
      memo: item.memo ?? undefined,
      noteId: item.noteId ?? undefined,
      position: item.position,
      stayMinutes: item.stayMinutes ?? undefined,
    })),
    regionName: course.regionName ?? undefined,
    status: course.status,
    tags: getCourseResponseTags(course),
    title: course.title,
    visibility: course.visibility,
  };
}

export function getCourseResponseTags(course: CourseResponse) {
  return normalizeCourseTags(
    [
      course.tags,
      parseCourseDescriptionTags(course.description),
      course.regionName,
    ],
    course.regionName ?? "로컬",
  );
}

function getFirstCourseItemImage(course: CourseResponse) {
  return sortedCourseItems(course)
    .map((item) => item.imageUrl || item.firstImage || item.thumbnailUrl)
    .find((imageUrl): imageUrl is string => isRealCourseImage(imageUrl));
}

function isRealCourseImage(imageUrl?: string | null) {
  if (!imageUrl?.trim()) return false;
  if (imageUrl === fallbackCourseImage) return false;
  return !defaultStops.some((stop) => stop.imageUrl === imageUrl);
}

export function getFirstRealStopImage(stops: CourseStop[]) {
  return stops.find((stop) => isRealCourseImage(stop.imageUrl))?.imageUrl;
}

export function getFirstRealPointImage(points: MapPoint[]) {
  return points.find((point) => isRealCourseImage(point.source.imageUrl))?.source.imageUrl;
}


export function toCourseItemRequest(
  stop: CourseStop,
  index: number,
): CourseItemRequest | null {
  const sourceItem = stop.sourceItem;

  if (sourceItem?.attractionId) {
    return {
      attractionId: sourceItem.attractionId,
      day: sourceItem.day || 1,
      itemType: "ATTRACTION",
      memo: sourceItem.memo ?? stop.description,
      position: index + 1,
      stayMinutes: sourceItem.stayMinutes ?? 60,
    };
  }

  if (sourceItem?.noteId) {
    return {
      day: sourceItem.day || 1,
      itemType: "NOTE",
      memo: sourceItem.memo ?? stop.description,
      noteId: sourceItem.noteId,
      position: index + 1,
      stayMinutes: sourceItem.stayMinutes ?? 60,
    };
  }

  return {
    day: 1,
    itemType: "ATTRACTION",
    memo: stop.title,
    position: index + 1,
    stayMinutes: 60,
  };
}

export function appendStopsToCourseRequest(
  course: CourseResponse,
  stops: CourseStop[],
): Omit<CourseCreateRequest, "id"> {
  const currentItems = sortedCourseItems(course).map((item) => ({
    attractionId: item.attractionId ?? undefined,
    day: item.day,
    itemType: item.itemType,
    memo: item.memo ?? undefined,
    noteId: item.noteId ?? undefined,
    position: item.position,
    stayMinutes: item.stayMinutes ?? undefined,
  }));
  const startPosition = currentItems.reduce(
    (max, item) => Math.max(max, item.position ?? 0),
    0,
  );
  const nextItems = stops.flatMap((stop, index) => {
    const item = toCourseItemRequest(stop, index);
    return item ? [{ ...item, position: startPosition + index + 1 }] : [];
  });

  return {
    ...toCourseUpdateRequest(course),
    coverImageUrl: course.coverImageUrl ?? getFirstRealStopImage(stops),
    items: [...currentItems, ...nextItems],
  };
}

export function createCourseRequestFromStops({
  id,
  sourceCourse,
  stops,
  title,
}: {
  id: string;
  sourceCourse: CourseResponse;
  stops: CourseStop[];
  title: string;
}): CourseCreateRequest | null {
  const items = stops.flatMap((stop, index) => {
    const item = toCourseItemRequest(stop, index);
    return item ? [item] : [];
  });

  if (items.length === 0) return null;

  return {
    coverImageUrl: getFirstRealStopImage(stops) ?? sourceCourse.coverImageUrl ?? undefined,
    description: sourceCourse.description ?? "탐색한 코스",
    id,
    items,
    regionName: sourceCourse.regionName ?? stops[0]?.location,
    status: "READY",
    tags: normalizeCourseTags(getCourseResponseTags(sourceCourse), sourceCourse.regionName ?? "로컬"),
    title,
    visibility: "PRIVATE",
  };
}

export function getNumericPointId(id: string) {
  const value = Number(id.replace(/^(place|note)-/, ""));
  return Number.isFinite(value) ? value : null;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
