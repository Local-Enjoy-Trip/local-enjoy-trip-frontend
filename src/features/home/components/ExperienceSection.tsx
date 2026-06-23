import type { Experience } from "@/shared/types/domain";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ExperienceCard } from "./ExperienceCard";

type ExperienceSectionProps = {
  emptyMessage?: string;
  title: string;
  experiences: Experience[];
  isLoading?: boolean;
  variant?: "default" | "portrait";
};

export function ExperienceSection({
  emptyMessage = "이 동네의 추천 장소를 준비하고 있어요.",
  title,
  experiences,
  isLoading = false,
  variant = "default",
}: ExperienceSectionProps) {
  return (
    <section className="mt-8">
      <SectionHeader title={title} actionTo="/map" />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
        </div>
      ) : experiences.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {experiences.map((experience) => (
            <ExperienceCard
              experience={experience}
              key={experience.id}
              variant={variant}
            />
          ))}
        </div>
      ) : (
        <p className="mx-5 my-0 rounded-[20px] bg-[#F7F6F3] px-5 py-8 text-center text-sm font-bold text-[#77736C]">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
