import type { HomeNote } from "@/features/home/types/homeTypes";
import { NoteCard } from "@/features/notes/components/NoteCard";

type SpotNoteCardProps = {
  note: HomeNote;
};

export function SpotNoteCard({ note }: SpotNoteCardProps) {
  return (
    <NoteCard
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
      note={{
        authorName: note.name,
        body: note.body,
        id: note.id,
        imageAlt: note.place,
        imageUrl: note.image,
        locationLabel: note.location,
        profileImageUrl: note.profileImage,
      }}
    />
  );
}
