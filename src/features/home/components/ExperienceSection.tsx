import type { Experience } from "@/shared/types/domain";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { ExperienceCard } from "./ExperienceCard";

type ExperienceSectionProps = {
  title: string;
  experiences: Experience[];
  variant?: "default" | "portrait";
};

export function ExperienceSection({
  title,
  experiences,
  variant = "default",
}: ExperienceSectionProps) {
  return (
    <section className="mt-8">
      <SectionHeader title={title} actionTo="/map" />
      <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {experiences.map((experience) => (
          <ExperienceCard
            experience={experience}
            key={experience.id}
            variant={variant}
          />
        ))}
      </div>
    </section>
  );
}
