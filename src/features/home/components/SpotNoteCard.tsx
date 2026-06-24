import type { HomeNote } from "@/features/home/types/homeTypes";
import { NoteCard } from "@/features/notes/components/NoteCard";
import { saveNote, savedNotesQueryKey, unsaveNote } from "@/features/notes/noteApi";
import {
  getNoteSaveOverride,
  setNoteSaveOverride,
  subscribeNoteSaveOverrides,
} from "@/features/notes/noteSaveOverrides";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type SpotNoteCardProps = {
  note: HomeNote;
};

export function SpotNoteCard({ note }: SpotNoteCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const noteId = getNumericNoteId(note.id);
  const [saved, setSaved] = useState(
    () => getNoteSaveOverride(note.id)?.saved ?? note.saved ?? false,
  );

  useEffect(() => {
    const syncSaved = () => {
      setSaved(getNoteSaveOverride(note.id)?.saved ?? note.saved ?? false);
    };

    syncSaved();
    return subscribeNoteSaveOverrides(syncSaved);
  }, [note.id, note.saved]);

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
        saved,
      }}
      onSelect={() => navigate(`/map?${mapParams.toString()}`)}
      onToggleSave={async () => {
        if (!noteId) return;
        const nextSaved = !saved;
        setSaved(nextSaved);
        setNoteSaveOverride(noteId, nextSaved);
        try {
          if (nextSaved) await saveNote(noteId);
          else await unsaveNote(noteId);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["home-nearby-notes"] }),
            queryClient.invalidateQueries({ queryKey: ["map-explore"] }),
            queryClient.invalidateQueries({ queryKey: savedNotesQueryKey }),
          ]);
        } catch {
          setSaved(saved);
          setNoteSaveOverride(noteId, saved);
        }
      }}
    />
  );
}

function getNumericNoteId(id: string) {
  const value = Number(id.replace(/^note-/, ""));
  return Number.isFinite(value) ? value : null;
}
