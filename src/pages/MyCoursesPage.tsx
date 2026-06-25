import {
  apiCourseToDiscovery,
  type CourseDiscoveryModel,
} from "@/features/course/components/CourseDiscoveryCard";
import { getMyCourses } from "@/features/course/courseApi";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

export function MyCoursesPage() {
  const navigate = useNavigate();
  const myCoursesQuery = useQuery({
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    retry: 1,
  });
  const courses = useMemo(() => {
    const apiCourses = myCoursesQuery.data ?? [];

    return apiCourses.map(apiCourseToDiscovery);
  }, [myCoursesQuery.data]);

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#171717]">
      <header className="flex items-center gap-3">
        <button
          aria-label="마이페이지로 돌아가기"
          className="grid size-10 place-items-center rounded-full bg-[#F4F3EF]"
          onClick={() => navigate("/my")}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-lg font-black">내 코스</h1>
      </header>

      {myCoursesQuery.isPending ? (
        <div className="mt-5 grid gap-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      ) : myCoursesQuery.isError && courses.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#FFF0EE] p-5 text-sm font-bold text-[#D5483D]">
          {myCoursesQuery.error instanceof Error
            ? myCoursesQuery.error.message
            : "내 코스를 불러오지 못했습니다."}
        </p>
      ) : courses.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#F6F5F1] p-5 text-sm font-bold text-[#746F67]">
          아직 저장하거나 만든 코스가 없어요.
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {courses.map((course) => (
            <CourseListItem course={course} key={course.id} />
          ))}
        </div>
      )}
    </section>
  );
}

function CourseListItem({ course }: { course: CourseDiscoveryModel }) {
  return (
    <Link className="block text-inherit no-underline" to={`/course/${course.id}`}>
      <article className="rounded-2xl border border-[#ECE8E0] bg-white p-3 shadow-[0_8px_18px_rgba(17,17,17,0.04)]">
        <div className="grid grid-cols-[112px_1fr] gap-4">
          <div className="relative h-32 overflow-hidden rounded-xl bg-[#EEEAE3]">
            <img
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              src={course.coverImageUrl}
            />
            <span className="absolute top-2 left-2 rounded-full bg-white/94 px-2 py-1 text-[10px] font-black text-[#171717]">
              {course.area}
            </span>
          </div>
          <div className="flex min-w-0 flex-col py-1">
            <div>
              <h2 className="m-0 line-clamp-2 text-base leading-snug font-black text-[#171717]">
                {course.title}
              </h2>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-[#8C857B]">
                <CalendarDays size={14} strokeWidth={2.4} />
                {course.stops.length}개 장소
              </div>
            </div>
            <div className="mt-auto flex min-w-0 flex-wrap gap-1.5 overflow-hidden pt-3">
              {course.hashtags.slice(0, 4).map((tag) => (
                <span
                  className="rounded-full bg-[#F4F3EF] px-2 py-1 text-[10px] font-black whitespace-nowrap text-[#6B655F]"
                  key={tag}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
