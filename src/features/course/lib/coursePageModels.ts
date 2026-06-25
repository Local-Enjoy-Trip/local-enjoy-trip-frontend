import {
  apiCourseToDiscovery,
  type CourseDiscoveryModel,
} from "@/features/course/components/CourseDiscoveryCard";
import type { CourseResponse } from "@/features/course/courseApi";

export const fallbackTripCoordinates = { lat: 37.5568, lng: 126.9019 };
const fallbackApiTripImage =
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80";

export type UpcomingTrip = {
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverImageUrl: string;
  dateLabel: string;
  daysUntil: number;
  daysUntilText: string;
  id: string;
  title: string;
};

export type CourseHashtagSection = {
  courses: CourseDiscoveryModel[];
  title: string;
};

type ParsedTrip =
  {
    data: CourseResponse;
    date: string;
    daysUntil: number;
    id: string;
  };

export function getCourseCards(apiCourses: CourseResponse[]) {
  return apiCourses.map(apiCourseToDiscovery);
}

function parseApiCourseDate(course: CourseResponse): string | undefined {
  if (!course.description) return undefined;
  const parts = course.description.split("|");
  const dateCandidate = parts[0]?.trim();
  if (dateCandidate && /^\d{4}-\d{2}-\d{2}$/.test(dateCandidate)) {
    return dateCandidate;
  }
  return undefined;
}

function apiCourseToTrip(course: CourseResponse, dateStr: string, daysUntil: number): UpcomingTrip {
  const date = new Date(dateStr);
  return {
    area: course.regionName || "망원동",
    coordinates: course.startLocation
      ? {
          lat: course.startLocation.latitude,
          lng: course.startLocation.longitude,
        }
      : fallbackTripCoordinates,
    coverImageUrl: getApiCourseCoverImageUrl(course),
    dateLabel: new Intl.DateTimeFormat("ko", {
      day: "numeric",
      month: "numeric",
      weekday: "short",
    }).format(date),
    daysUntil,
    daysUntilText: `${daysUntil}일 뒤`,
    id: course.id,
    title: course.title,
  };
}

export function getNextTrip(apiCourses: CourseResponse[]): UpcomingTrip | null {
  const parsedTrips: ParsedTrip[] = [];

  apiCourses.forEach((course) => {
    const dateStr = parseApiCourseDate(course);
    if (dateStr) {
      const days = getDaysUntil(dateStr);
      if (days >= 0) {
        parsedTrips.push({
          id: course.id,
          date: dateStr,
          daysUntil: days,
          data: course,
        });
      }
    }
  });

  parsedTrips.sort((a, b) => a.daysUntil - b.daysUntil);

  if (parsedTrips.length > 0) {
    const next = parsedTrips[0];
    return apiCourseToTrip(next.data, next.date, next.daysUntil);
  }

  const latestApi = [...apiCourses].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
  )[0];
  if (latestApi) {
    const dateStr = parseApiCourseDate(latestApi);
    if (dateStr) {
      return apiCourseToTrip(latestApi, dateStr, getDaysUntil(dateStr));
    }
    return {
      area: latestApi.regionName || "망원동",
      coordinates: latestApi.startLocation
        ? {
            lat: latestApi.startLocation.latitude,
            lng: latestApi.startLocation.longitude,
          }
        : fallbackTripCoordinates,
      coverImageUrl: getApiCourseCoverImageUrl(latestApi),
      dateLabel: "일정 미정",
      daysUntil: 0,
      daysUntilText: "0일 뒤",
      id: latestApi.id,
      title: latestApi.title,
    };
  }

  return null;
}

function getApiCourseCoverImageUrl(course: CourseResponse) {
  const firstItemImage = [...course.items]
    .sort((a, b) => a.position - b.position)
    .map((item) => item.imageUrl || item.firstImage || item.thumbnailUrl)
    .find((imageUrl): imageUrl is string => Boolean(imageUrl?.trim()));

  return course.imageUrl || course.coverImageUrl || firstItemImage || fallbackApiTripImage;
}

export function groupCoursesByHashtag(
  courses: CourseDiscoveryModel[],
): CourseHashtagSection[] {
  const tagCounts = new Map<string, number>();
  courses.forEach((course) => {
    course.hashtags
      .filter((tag) => !isAreaLikeTag(tag, course.area))
      .forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  const popularTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
  const pairedTags = chunkTags(
    popularTags.length > 0 ? popularTags : ["가볍게", "알찬하루", "산책", "로컬"],
  );

  return pairedTags
    .map((tags) => ({
      courses: courses.filter((course) =>
        tags.some((tag) => course.hashtags.includes(tag)),
      ),
      title: tags.map((tag) => `#${tag}`).join(" "),
    }))
    .filter((section) => section.courses.length > 0)
    .slice(0, 4)
    .map((section) =>
      section.courses.length >= 2
        ? section
        : { ...section, courses: courses.slice(0, Math.min(courses.length, 6)) },
    );
}

function chunkTags(tags: string[]) {
  const pairs: string[][] = [];
  for (let index = 0; index < tags.length; index += 2) {
    pairs.push(tags.slice(index, index + 2));
  }

  return pairs;
}

function isAreaLikeTag(tag: string, area: string) {
  const normalizedTag = tag.replace(/\s+/g, "");
  const normalizedArea = area.replace(/\s+/g, "");

  return (
    normalizedTag === normalizedArea ||
    normalizedTag.includes("동") ||
    normalizedTag.includes("구")
  );
}

function getDaysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}
