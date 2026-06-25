import {
  cacheCourses,
  type CourseResponse,
} from "@/features/course/courseApi";
import type { SavedCourse } from "@/features/course/courseStorage";
import { Link } from "react-router-dom";

export type CourseDiscoveryModel = {
  area: string;
  coverImageUrl: string;
  hashtags: string[];
  id: string;
  sourceCourse?: CourseResponse;
  stops: string[];
  title: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80";

export function CourseDiscoveryCard({
  course,
}: {
  course: CourseDiscoveryModel;
}) {
  const visibleStops = course.stops.slice(0, 4);

  return (
    <Link
      className="block w-[252px] flex-none snap-start text-inherit no-underline"
      onClick={() => {
        if (course.sourceCourse) cacheCourses([course.sourceCourse]);
      }}
      to={`/course/${course.id}`}
    >
      <article className="overflow-hidden rounded-[22px] border border-[#D8D1C8] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.04)]">
        <div className="relative h-[170px] overflow-hidden bg-[#EEEAE3]">
          <img
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            src={course.coverImageUrl}
          />
          <span className="absolute top-3 left-3 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#171717] shadow-[0_4px_10px_rgba(17,17,17,0.12)]">
            {course.hashtags[0] ?? "동네 코스"}
          </span>
        </div>
        <div className="px-4 pt-4 pb-5">
          <h3 className="m-0 line-clamp-2 text-base leading-snug font-black text-[#171717]">
            {course.title}
          </h3>
          {visibleStops.length > 0 ? (
            <div className="mt-3 grid gap-1.5">
              {visibleStops.map((stop, index) => (
                <div className="flex items-start gap-2" key={`${course.id}-${stop}`}>
                  <span className="mt-1 grid flex-none place-items-center">
                    <span className="size-1.5 rounded-full bg-[#FD4003]" />
                    {index < visibleStops.length - 1 ? (
                      <span className="mt-1 block h-3 w-px bg-[#FD4003]/45" />
                    ) : null}
                  </span>
                  <span className="line-clamp-1 text-xs font-bold text-[#514D47]">
                    {stop}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 mb-0 rounded-xl bg-[#F6F5F1] px-3 py-2 text-xs font-black text-[#8B857C]">
              아직 추가한 장소가 없어요.
            </p>
          )}
          <div className="mt-4 flex gap-1.5 overflow-hidden">
            {course.hashtags.slice(0, 3).map((tag) => (
              <span
                className="rounded-full bg-[#F4F3EF] px-2 py-1 text-[10px] font-black whitespace-nowrap text-[#6B655F]"
                key={tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function apiCourseToDiscovery(course: CourseResponse): CourseDiscoveryModel {
  const sortedItems = [...course.items].sort((a, b) => a.position - b.position);
  const area = course.regionName?.trim() || "동네";
  const stops = sortedItems
    .map((item) => item.title?.trim())
    .filter((title): title is string => Boolean(title));

  return {
    area,
    coverImageUrl: course.coverImageUrl || fallbackImage,
    hashtags: getCourseHashtags({
      area,
      description: course.description,
      stopCount: course.routeSummary.stopCount || course.items.length,
    }),
    id: course.id,
    sourceCourse: course,
    stops,
    title: course.title,
  };
}

export function savedCourseToDiscovery(course: SavedCourse): CourseDiscoveryModel {
  return {
    area: course.area || "동네",
    coverImageUrl: course.stops[0]?.imageUrl || fallbackImage,
    hashtags: getCourseHashtags({
      area: course.area,
      description: course.styles.join(" "),
      stopCount: course.stops.length,
    }),
    id: course.id,
    stops: course.stops.map((stop) => stop.title),
    title: course.title,
  };
}

function getCourseHashtags({
  area,
  description,
  stopCount,
}: {
  area?: string | null;
  description?: string | null;
  stopCount: number;
}) {
  const tags = [
    area?.replace(/\s+/g, ""),
    stopCount <= 3 ? "가볍게" : "알찬하루",
    ...(description ?? "")
      .split(/[·,\s]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  ].filter((tag): tag is string => Boolean(tag));

  return Array.from(new Set(tags)).slice(0, 4);
}
