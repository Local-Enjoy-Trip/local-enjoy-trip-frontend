import { Heart, Plus } from "lucide-react";

export type NoteCardModel = {
  authorName: string;
  body: string;
  createdAt?: string;
  id: string;
  imageAlt?: string;
  imageUrl?: string;
  locationLabel: string;
  profileImageUrl?: string;
  saved?: boolean;
};

export function NoteCard({
  className = "",
  note,
  onAddToCourse,
  onSelect,
  selected = false,
  showAddToCourse = false,
  showSavedIcon = true,
  wide = false,
}: {
  className?: string;
  note: NoteCardModel;
  onAddToCourse?: () => void;
  onSelect?: () => void;
  selected?: boolean;
  showAddToCourse?: boolean;
  showSavedIcon?: boolean;
  wide?: boolean;
}) {
  const hasImage = Boolean(note.imageUrl);
  const hasFooterActions = showAddToCourse || showSavedIcon;
  const bodyLineClamp = wide ? (hasImage ? 4 : 7) : 3;
  const bodyLineHeight = 18;

  return (
    <article
      className={`relative flex flex-none snap-start flex-col overflow-hidden rounded-[20px] border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow,transform] ${selected ? "border-[#FD4003] shadow-[0_8px_22px_rgba(253,64,3,0.16)]" : "border-[#BDBDBD]"} ${wide ? "h-[270px] w-full" : "h-[270px] w-[200px]"} ${className}`}
    >
      <button
        aria-label={`${note.authorName}의 쪽지 상세 보기`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="flex w-full flex-none items-center gap-3 px-5 pt-5 pb-3">
          {note.profileImageUrl ? (
            <img
              alt={`${note.authorName} 프로필`}
              className="size-9.5 flex-none rounded-full object-cover"
              loading="lazy"
              src={note.profileImageUrl}
            />
          ) : (
            <span className="grid size-9.5 flex-none place-items-center rounded-full bg-[#111] text-sm font-black text-white">
              {note.authorName.slice(0, 1)}
            </span>
          )}
          <span className="min-w-0">
            <strong className="block truncate text-xs font-extrabold text-[#171717]">
              {note.authorName}
            </strong>
            <span className="mt-1 block truncate text-[11px] font-bold text-[#817A71]">
              {note.locationLabel}
              {note.createdAt ? ` · ${formatRelativeTime(note.createdAt)}` : ""}
            </span>
          </span>
        </span>

        {hasImage ? (
          <img
            alt={note.imageAlt ?? "쪽지 첨부 이미지"}
            className="h-[104px] w-full flex-none bg-[#F4F3EF] object-contain"
            loading="lazy"
            src={note.imageUrl}
          />
        ) : null}

        <span className="block min-h-0 w-full flex-1 overflow-hidden px-5 pt-3.5 pb-5">
          <span
            className="block overflow-hidden whitespace-pre-wrap break-words text-[11px] text-[#49443E]"
            style={{
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: bodyLineClamp,
              display: "-webkit-box",
              lineHeight: `${bodyLineHeight}px`,
              maxHeight: `${bodyLineClamp * bodyLineHeight}px`,
            }}
          >
            {note.body}
          </span>
        </span>
      </button>

      {hasFooterActions ? (
        <div className="absolute right-3 bottom-3 z-10 flex items-center justify-end gap-1.5">
          {showSavedIcon ? (
            <span className="grid size-6 place-items-center text-[#202020]">
              <Heart
                className={note.saved ? "text-[#FD4003]" : "text-[#202020]"}
                fill={note.saved ? "#FD4003" : "none"}
                size={16}
                strokeWidth={2.3}
              />
            </span>
          ) : null}
          {showAddToCourse ? (
            <button
              aria-label="쪽지를 코스에 추가"
              className="grid size-6 place-items-center border-0 bg-transparent text-[#202020]"
              onClick={(event) => {
                event.stopPropagation();
                onAddToCourse?.();
              }}
              type="button"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function formatRelativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return "방금 전";

  const seconds = Math.round((timestamp - Date.now()) / 1_000);
  const formatter = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor) {
      return formatter.format(Math.round(seconds / divisor), unit);
    }
  }

  return formatter.format(seconds, "second");
}
