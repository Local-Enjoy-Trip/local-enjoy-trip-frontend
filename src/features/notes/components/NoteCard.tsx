import { Heart } from "lucide-react";

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
  onSelect,
  selected = false,
  wide = false,
}: {
  className?: string;
  note: NoteCardModel;
  onSelect?: () => void;
  selected?: boolean;
  wide?: boolean;
}) {
  const hasImage = Boolean(note.imageUrl);

  return (
    <article
      className={`relative flex h-[270px] flex-none snap-start flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-[border-color,box-shadow] ${
        selected
          ? "border-2 border-[#FD4003] shadow-[0_8px_22px_rgba(253,64,3,0.16)]"
          : "border border-[#BDBDBD]"
      } ${wide ? "w-full" : "w-[200px]"} ${className}`}
    >
      <button
        aria-label={`${note.authorName}의 쪽지 상세 보기`}
        className="flex min-h-0 flex-1 flex-col border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="flex w-full items-center gap-3 px-5 pt-5 pb-3.5">
          {note.profileImageUrl ? (
            <img
              alt={`${note.authorName} 프로필`}
              className="size-9.5 flex-none rounded-full object-cover ring-2 ring-[#FF4300]"
              loading="lazy"
              src={note.profileImageUrl}
            />
          ) : (
            <span className="grid size-9.5 flex-none place-items-center rounded-full bg-[#111] text-sm font-black text-white ring-2 ring-[#FF4300]">
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
            className="h-[112px] w-full flex-none object-cover"
            loading="lazy"
            src={note.imageUrl}
          />
        ) : null}

        <span
          className={`block w-full flex-1 whitespace-pre-wrap px-5 pt-4 pr-10 text-[11px] leading-relaxed text-[#49443E] ${
            hasImage ? "line-clamp-3 pb-5" : "line-clamp-7 pb-6"
          }`}
        >
          {note.body}
        </span>
      </button>

      <span className="pointer-events-none absolute right-4 bottom-4 grid size-7 place-items-center">
        <Heart
          className={note.saved ? "text-[#FD4003]" : "text-[#202020]"}
          fill={note.saved ? "#FD4003" : "none"}
          size={24}
          strokeWidth={2.2}
        />
      </span>
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
