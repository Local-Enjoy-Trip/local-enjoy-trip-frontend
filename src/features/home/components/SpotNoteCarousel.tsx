import { similarSpotNotes } from "@/features/home/data/homeContent";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { SpotNoteCard } from "./SpotNoteCard";

export function SpotNoteCarousel() {
  return (
    <section className="mt-8">
      <SectionHeader title="나와 비슷한 사람들의 SPOT" actionTo="/map" />
      <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {similarSpotNotes.map((note) => (
          <SpotNoteCard note={note} key={note.id} />
        ))}
      </div>
    </section>
  );
}
