import type { HomeNote } from "@/features/home/types/homeTypes";
import { NoteCard } from "@/features/notes/components/NoteCard";
import { useNavigate } from "react-router-dom";

type SpotNoteCardProps = {
  note: HomeNote;
};

export function SpotNoteCard({ note }: SpotNoteCardProps) {
  const navigate = useNavigate();
  const mapParams = new URLSearchParams({
    tab: "note",
    target: note.id,
  });
  if (note.coordinates) {
    mapParams.set("mapX", String(note.coordinates.lng));
    mapParams.set("mapY", String(note.coordinates.lat));
  }

  return (
    <NoteCard
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]"
      note={{
        authorName: note.name,
        body: note.body,
        createdAt: note.createdAt,
        id: note.id,
        imageAlt: note.place,
        imageUrl: note.image,
        locationLabel: note.location,
        profileImageUrl: note.profileImage,
      }}
      onSelect={() => navigate(`/map?${mapParams.toString()}`)}
    />
  );
}
