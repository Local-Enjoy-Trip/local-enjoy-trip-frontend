import { useQuery } from "@tanstack/react-query";
import {
  apiCourseToDiscovery,
  CourseDiscoveryCard,
} from "@/features/course/components/CourseDiscoveryCard";
import { getCourseFeed } from "@/features/course/courseApi";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";

export function CourseCurationSection({
  location,
}: {
  location: string;
}) {
  const courseFeedQuery = useQuery({
    queryFn: () =>
      getCourseFeed({
        limit: 10,
        regionName: location,
      }),
    queryKey: ["home-course-feed", location],
    retry: 1,
  });
  const courses = courseFeedQuery.data?.map(apiCourseToDiscovery) ?? [];

  return (
    <section className="mt-8">
      <SectionHeader title={`${location} 인기 코스`} actionTo="/course" />
      {courseFeedQuery.isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
          <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
        </div>
      ) : courses.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {courses.map((course) => (
            <CourseDiscoveryCard course={course} key={course.id} />
          ))}
        </div>
      ) : (
        <p className="mx-5 my-0 rounded-[20px] bg-[#F7F6F3] px-5 py-8 text-center text-sm font-bold text-[#77736C]">
          {location}에서 시작할 수 있는 코스를 곧 보여드릴게요.
        </p>
      )}
    </section>
  );
}
