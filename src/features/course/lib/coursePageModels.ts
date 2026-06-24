import {
  apiCourseToDiscovery,
  type CourseDiscoveryModel,
  savedCourseToDiscovery,
} from "@/features/course/components/CourseDiscoveryCard";
import type { CourseResponse } from "@/features/course/courseApi";
import type { SavedCourse } from "@/features/course/courseStorage";

export const fallbackTripCoordinates = { lat: 37.5568, lng: 126.9019 };
const fallbackTripImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";
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

export function getCourseCards(
  apiCourses: CourseResponse[],
  savedCourses: SavedCourse[],
) {
  return [
    ...apiCourses.map(apiCourseToDiscovery),
    ...savedCourses
      .filter((course) => !apiCourses.some((apiCourse) => apiCourse.id === course.id))
      .map(savedCourseToDiscovery),
  ];
}

export function getNextTrip(
  apiCourses: CourseResponse[],
  savedCourses: SavedCourse[],
): UpcomingTrip {
  const upcomingSaved = savedCourses
    .filter((course) => course.date)
    .map((course) => ({
      course,
      daysUntil: getDaysUntil(course.date ?? ""),
    }))
    .filter((item) => item.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  if (upcomingSaved) {
    return savedCourseToTrip(upcomingSaved.course, upcomingSaved.daysUntil);
  }

  const latestSaved = [...savedCourses].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  )[0];
  if (latestSaved) return savedCourseToTrip(latestSaved, 0);

  const latestApi = [...apiCourses].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
  )[0];
  if (latestApi) {
    return {
      area: latestApi.regionName || "망원동",
      coordinates: latestApi.startLocation
        ? {
            lat: latestApi.startLocation.latitude,
            lng: latestApi.startLocation.longitude,
          }
        : fallbackTripCoordinates,
      coverImageUrl: latestApi.coverImageUrl || fallbackApiTripImage,
      dateLabel: "일정 미정",
      daysUntil: 0,
      daysUntilText: "0일 뒤",
      id: latestApi.id,
      title: latestApi.title,
    };
  }

  return {
    area: "망원동",
    coordinates: fallbackTripCoordinates,
    coverImageUrl: fallbackTripImage,
    dateLabel: "일정 미정",
    daysUntil: 0,
    daysUntilText: "0일 뒤",
    id: "course-1",
    title: "망원동 여행",
  };
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

function savedCourseToTrip(course: SavedCourse, daysUntil: number): UpcomingTrip {
  const firstStop = course.stops[0];
  const date = course.date ? new Date(course.date) : null;

  return {
    area: course.area || "망원동",
    coordinates: firstStop
      ? { lat: firstStop.lat, lng: firstStop.lng }
      : fallbackTripCoordinates,
    coverImageUrl: firstStop?.imageUrl || fallbackTripImage,
    dateLabel: date
      ? new Intl.DateTimeFormat("ko", {
          day: "numeric",
          month: "numeric",
          weekday: "short",
        }).format(date)
      : "일정 미정",
    daysUntil,
    daysUntilText: `${daysUntil}일 뒤`,
    id: course.id,
    title: course.title,
  };
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
