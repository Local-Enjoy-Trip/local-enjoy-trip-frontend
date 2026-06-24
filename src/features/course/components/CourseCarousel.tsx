import {
  CourseDiscoveryCard,
  type CourseDiscoveryModel,
} from "@/features/course/components/CourseDiscoveryCard";
import { Skeleton } from "@/shared/ui/Skeleton";

export function CourseCarousel({
  courses,
  emptyMessage,
  isLoading,
  title,
  titleClassName,
}: {
  courses: CourseDiscoveryModel[];
  emptyMessage: string;
  isLoading?: boolean;
  title: string;
  titleClassName?: string;
}) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} className={titleClassName} />
      {isLoading ? (
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
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}

export function SectionTitle({
  className = "mx-5 mt-0 mb-4 text-[1.35rem] leading-tight font-black tracking-[-0.01em] text-[#111]",
  title,
}: {
  className?: string;
  title: string;
}) {
  return <h2 className={className}>{title}</h2>;
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="mx-5 my-0 rounded-[20px] bg-[#F7F6F3] px-5 py-8 text-center text-sm font-bold text-[#77736C]">
      {message}
    </p>
  );
}
