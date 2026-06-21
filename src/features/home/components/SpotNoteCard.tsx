import type { HomeNote } from "@/features/home/types/homeTypes";

type SpotNoteCardProps = {
  note: HomeNote;
};

export function SpotNoteCard({ note }: SpotNoteCardProps) {
  const hasImage = Boolean(note.image);

  return (
    <article className="relative flex w-[200px] h-[270px] flex-none snap-start flex-col overflow-hidden rounded-[20px] border border-[#f0ece8] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-5 pb-3.5">
        {note.profileImage ? (
          <img
            className="size-9.5 flex-none rounded-full object-cover ring-2 ring-[#FF4300]"
            src={note.profileImage}
            alt={`${note.name} 프로필`}
            loading="lazy"
          />
        ) : (
          <div className="grid size-9.5 flex-none place-items-center rounded-full bg-[#111111] text-sm font-black text-white ring-2 ring-[#FF4300]">
            {note.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="m-0 truncate text-xs font-extrabold text-(--spot-app-text)">
            {note.name}
          </p>
          <p className="mt-1 mb-0 truncate text-[11px] font-bold text-(--spot-app-muted)">
            {note.location}
          </p>
        </div>
      </header>

      {/* Content Area */}
      {hasImage ? (
        <>
          <div className="w-full overflow-hidden">
            <img
              className="h-full w-full object-cover"
              src={note.image}
              alt={note.place}
              loading="lazy"
            />
          </div>
          <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
            <p className="m-0 break-keep text-[11px] leading-relaxed text-(--spot-app-text-soft) line-clamp-3 whitespace-pre-wrap">
              {note.body}
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col px-5 pt-2 pb-6">
          <p className="m-0 break-keep text-[11px] leading-relaxed text-(--spot-app-text-soft) line-clamp-7 whitespace-pre-wrap">
            {note.body}
          </p>
        </div>
      )}
    </article>
  );
}
