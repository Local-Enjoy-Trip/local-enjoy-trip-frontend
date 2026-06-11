import { Bookmark } from "lucide-react";
import type { HomeNote } from "@/features/home/types/homeTypes";

type SpotNoteCardProps = {
  note: HomeNote;
};

export function SpotNoteCard({ note }: SpotNoteCardProps) {
  const hasImage = Boolean(note.image);

  return (
    <article className="relative flex h-[230px] w-[calc(100vw-80px)] max-w-[300px] flex-none snap-start flex-col overflow-hidden rounded-[24px] border border-[var(--spot-app-border)] bg-[var(--spot-app-surface)] transition-colors">
      <header className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#111111] text-xs font-black text-white ring-2 ring-[#FF4300]">
          {note.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="m-0 truncate text-sm font-black text-[var(--spot-app-text)]">
            {note.name}
          </h3>
          <p className="mt-1 mb-0 truncate text-[0.7rem] font-bold text-[var(--spot-app-muted)]">
            {note.location}
          </p>
        </div>
      </header>
      <div
        className={`flex min-h-0 flex-1 flex-col px-4 pb-4 ${
          hasImage ? "" : "justify-center"
        }`}
      >
        {note.image ? (
          <div className="mb-3 h-[72px] overflow-hidden rounded-[18px]">
            <img
              className="h-full w-full object-cover"
              src={note.image}
              alt=""
              loading="lazy"
            />
          </div>
        ) : null}
        <p
          className={`m-0 break-keep pb-1 text-sm leading-snug font-bold text-[var(--spot-app-text-soft)] ${
            hasImage ? "line-clamp-3" : "line-clamp-4"
          }`}
        >
          {note.body}
        </p>
        <div className="mt-auto flex justify-end">
          <button
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--spot-app-soft-accent)] text-[var(--spot-app-muted)]"
            type="button"
            aria-label="쪽지 저장"
          >
            <Bookmark size={16} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
}
