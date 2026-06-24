import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "@/shared/api/http";

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

export type CourseItemResponse = {
  attractionId?: number | null;
  day: number;
  id?: number | null;
  itemType: CourseItemType;
  memo?: string | null;
  noteId?: number | null;
  position: number;
  stayMinutes?: number | null;
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
