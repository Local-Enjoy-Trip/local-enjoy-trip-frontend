import { ExperienceCard } from "@/features/home/components/ExperienceCard";
import { SpotNoteCard } from "@/features/home/components/SpotNoteCard";
import type { HomeNote } from "@/features/home/types/homeTypes";
import type { Experience } from "@/shared/types/domain";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EmptyPanel, SectionTitle } from "./CourseCarousel";

export function PlaceCarousel({
  className = "mt-10",
  emptyMessage,
  experiences,
  isLoading,
  title,
  titleClassName,
}: {
  className?: string;
  emptyMessage: string;
  experiences: Experience[];
  isLoading?: boolean;
  title: string;
  titleClassName?: string;
}) {
  return (
    <section className={className}>
      <SectionTitle className={titleClassName} title={title} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
        </div>
      ) : experiences.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {experiences.map((experience) => (
            <ExperienceCard
              experience={experience}
              key={experience.id}
              variant="portrait"
            />
          ))}
        </div>
      ) : (
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}

export function NoteCarousel({
  emptyMessage,
  isLoading,
  notes,
  title,
  titleClassName,
}: {
  emptyMessage: string;
  isLoading?: boolean;
  notes: HomeNote[];
  title: string;
  titleClassName?: string;
}) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} className={titleClassName} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-[270px] w-[200px] flex-none rounded-[20px]" />
          <Skeleton className="h-[270px] w-[200px] flex-none rounded-[20px]" />
        </div>
      ) : notes.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {notes.map((note) => (
            <SpotNoteCard note={note} key={note.id} />
          ))}
        </div>
      ) : (
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}
