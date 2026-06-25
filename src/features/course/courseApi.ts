import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "@/shared/api/http";
import {
  normalizeCourseTags,
  parseCourseDescriptionTags,
} from "@/features/course/courseTags";

export type CourseVisibility = "PRIVATE" | "FRIENDS" | "PUBLIC" | string;
export type CourseStatus = "DRAFT" | "READY" | "ARCHIVED" | string;
export type CourseItemType = "ATTRACTION" | "NOTE" | string;

export type CourseItemRequest = {
  attractionId?: number;
  day?: number;
  itemType: CourseItemType;
  memo?: string;
  noteId?: number;
  position?: number;
  stayMinutes?: number;
};

export type CourseCreateRequest = {
  coverImageUrl?: string;
  description?: string;
  id: string;
  items: CourseItemRequest[];
  regionName?: string;
  status?: CourseStatus;
  tags: string[];
  title: string;
  visibility?: CourseVisibility;
};

export type CourseUpdateRequest = Omit<CourseCreateRequest, "id">;

export type CourseOrderRecommendationRequest = {
  currentLatitude?: number;
  currentLongitude?: number;
};

export type CourseFeedRequest = {
  limit?: number;
  mapX: number;
  mapY: number;
  radius?: number;
};

export type AiCourseCompanion =
  | "ALONE"
  | "WITH_FRIEND"
  | "WITH_PARTNER"
  | "WITH_CHILD"
  | "WITH_PARENTS"
  | "WITH_PET";

export type AiCourseTheme =
  | "FOOD"
  | "CAFE"
  | "WALK"
  | "CULTURE"
  | "NATURE"
  | "PHOTO"
  | "MARKET"
  | "SHOPPING";

export type AiCoursePace = "RELAXED" | "MODERATE" | "PACKED";

export type AiCourseGenerateRequest = {
  regionName: string;
  companion: AiCourseCompanion;
  themes: AiCourseTheme[];
  pace: AiCoursePace;
};

export type StopPreview = {
  attractionId: number;
  title: string;
  addr1?: string;
  firstImage?: string;
};

export type AiCoursePreviewResponse = {
  title: string;
  reason?: string;
  stops: StopPreview[];
};


export type CourseItemResponse = {
  attractionId?: number | null;
  day: number;
  firstImage?: string | null;
  id?: number | null;
  imageUrl?: string | null;
  itemType: CourseItemType;
  memo?: string | null;
  noteId?: number | null;
  position: number;
  stayMinutes?: number | null;
  thumbnailUrl?: string | null;
  title?: string | null;
};

export type CourseSegmentResponse = {
  distanceMeters: number;
  durationSeconds: number;
  fromPosition: number;
  segmentOrder: number;
  toPosition: number;
  travelMode: string;
};

export type CourseStartLocationResponse = {
  latitude: number;
  longitude: number;
};

export type RouteSummaryResponse = {
  segmentCount: number;
  stopCount: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
};

export type CourseResponse = {
  coverImageUrl?: string | null;
  createdAt?: string | null;
  createdByAdmin: boolean;
  curationOrder?: number | null;
  curationSection?: string | null;
  description?: string | null;
  distanceMeters?: number | null;
  id: string;
  items: CourseItemResponse[];
  ownerUserId?: string | null;
  regionName?: string | null;
  routeSummary: RouteSummaryResponse;
  saveCount: number;
  segments: CourseSegmentResponse[];
  startLocation?: CourseStartLocationResponse | null;
  status: CourseStatus;
  tags?: unknown;
  title: string;
  updatedAt?: string | null;
  visibility: CourseVisibility;
};

type CoursesResponse = {
  courses: CourseResponse[];
};

const courseCacheKey = "spot:api-courses-cache";

export function getMyCourses() {
  return apiGet<CoursesResponse>("/api/courses/me").then((response) => {
    cacheCourses(response.courses);
    return response.courses;
  });
}

export function getPublicCourse(courseId: string) {
  return apiGet<CourseResponse>(`/api/courses/${courseId}`).then((course) => {
    cacheCourses([course]);
    return course;
  });
}

export function getCourseFeed(request: CourseFeedRequest) {
  const params = new URLSearchParams({
    limit: String(request.limit ?? 20),
    mapX: String(request.mapX),
    mapY: String(request.mapY),
  });
  if (request.radius) params.set("radius", String(request.radius));

  return apiGet<CoursesResponse>(`/api/courses/feed?${params.toString()}`).then(
    (response) => response.courses,
  );
}

export function generateAiCourse(request: AiCourseGenerateRequest) {
  return apiPost<AiCoursePreviewResponse>("/api/courses/ai-generate", request);
}


export function createCourse(request: CourseCreateRequest) {
  return apiPost<CourseResponse>("/api/courses", request).then((course) => {
    cacheCourses([course]);
    return course;
  });
}

export function updateCourse(courseId: string, request: CourseUpdateRequest) {
  return apiPut<CourseResponse>(`/api/courses/${courseId}`, request).then(
    (course) => {
      cacheCourses([course]);
      return course;
    },
  );
}

export async function appendCourseItem(
  courseId: string,
  item: Omit<CourseItemRequest, "position">,
) {
  const course = await getPublicCourse(courseId);
  const items = [...course.items].sort((a, b) => a.position - b.position);
  const nextPosition =
    items.reduce((max, courseItem) => Math.max(max, courseItem.position), 0) + 1;

  return updateCourse(courseId, {
    coverImageUrl: course.coverImageUrl ?? undefined,
    description: course.description ?? undefined,
    items: [
      ...items.map((courseItem) => ({
        attractionId: courseItem.attractionId ?? undefined,
        day: courseItem.day,
        itemType: courseItem.itemType,
        memo: courseItem.memo ?? undefined,
        noteId: courseItem.noteId ?? undefined,
        position: courseItem.position,
        stayMinutes: courseItem.stayMinutes ?? undefined,
      })),
      {
        ...item,
        day: item.day ?? 1,
        position: nextPosition,
      },
    ],
    regionName: course.regionName ?? undefined,
    status: course.status,
    tags: normalizeCourseTags(
      [course.tags, parseCourseDescriptionTags(course.description), course.regionName],
      course.regionName ?? "로컬",
    ),
    title: course.title,
    visibility: course.visibility,
  });
}

export function recommendCourseOrder(
  courseId: string,
  request?: CourseOrderRecommendationRequest,
) {
  return apiPost<CourseResponse>(
    `/api/courses/${courseId}/order-recommendation`,
    request ?? {},
  );
}

export function deleteCourse(courseId: string) {
  return apiDelete<void>(`/api/courses/${courseId}`);
}

export function getCachedApiCourse(courseId: string) {
  return readCachedCourses().find((course) => course.id === courseId);
}

export function cacheCourses(courses: CourseResponse[]) {
  if (typeof window === "undefined") return;

  try {
    const current = readCachedCourses();
    const next = [
      ...courses,
      ...current.filter(
        (course) => !courses.some((nextCourse) => nextCourse.id === course.id),
      ),
    ].slice(0, 80);

    window.sessionStorage.setItem(courseCacheKey, JSON.stringify(next));
  } catch {
    // Cache is opportunistic only.
  }
}

function readCachedCourses(): CourseResponse[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.sessionStorage.getItem(courseCacheKey);
    return value ? (JSON.parse(value) as CourseResponse[]) : [];
  } catch {
    return [];
  }
}
