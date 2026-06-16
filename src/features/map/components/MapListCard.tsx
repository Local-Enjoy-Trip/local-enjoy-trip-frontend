import { Heart, Route, UserRound } from "lucide-react";
import { categoryLabels, visibilityLabels } from "@/shared/lib/labels";
import type { MapPoint } from "../types";

export function MapListCard({
  featured = false,
  onAddToCourse,
  onSelect,
  point,
  selected = false
}: {
  featured?: boolean;
  onAddToCourse?: (point: MapPoint) => void;
  onSelect?: () => void;
  point: MapPoint;
  selected?: boolean;
}) {
  const isPlace = point.kind === "place";
  const description = isPlace ? point.source.summary : point.source.body;
  const tagClassName =
    "inline-flex rounded-full bg-[#F4F3EF] px-[7px] py-1 text-[11px] font-black text-[#6A665F]";

  return (
    <article
      className={`relative rounded-2xl border p-2.5 ${
        featured
          ? "mb-2 border-[#E6E2DA] bg-[#FAF9F6]"
          : "border-[#efeee9] bg-white"
      }`}
      data-selected={selected}
    >
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <button
          aria-label={point.saved ? "찜 해제" : "찜"}
          className="grid size-8 place-items-center rounded-full border border-black/5 bg-white/90 text-[#4B4741] shadow-[0_4px_12px_rgba(17,17,17,0.08)]"
          type="button"
        >
          <Heart
            size={16}
            fill={point.saved ? "#FF5A66" : "none"}
            className={point.saved ? "text-[#FF5A66]" : ""}
          />
        </button>
        <button
          aria-label="추가할 코스 선택"
          className="grid size-8 place-items-center rounded-full border border-black/5 bg-white/90 text-[#3E4A43] shadow-[0_4px_12px_rgba(17,17,17,0.08)]"
          onClick={() => onAddToCourse?.(point)}
          type="button"
        >
          <Route size={15} strokeWidth={2.4} />
        </button>
      </div>
      <button
        className="flex w-full items-start gap-3 border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span
          className={`grid h-24 w-24 flex-none place-items-center overflow-hidden rounded-xl ${
            isPlace ? "bg-[#F4F0EA] text-[#8A8176]" : "bg-[#F2F1ED] text-[#625F58]"
          }`}
        >
          {isPlace ? (
            <img
              className="h-full w-full object-cover"
              alt=""
              src={point.source.imageUrl}
            />
          ) : point.authorAvatarUrl ? (
            <img className="h-full w-full object-cover" alt="" src={point.authorAvatarUrl} />
          ) : (
            <UserRound size={22} />
          )}
        </span>
        <span className="min-w-0 flex-1 pr-[74px]">
          <span className="flex items-center gap-2">
            <strong className="truncate text-[0.96rem] font-black text-[#171717]">
              {point.name}
            </strong>
          </span>
          <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-[#706B64]">
            {description}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {isPlace ? (
              point.source.tags.slice(0, 2).map((tag) => (
                <span className={tagClassName} key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <>
                <span className={tagClassName}>{point.authorName}</span>
                <span className={tagClassName}>
                  {visibilityLabels[point.source.visibility]}
                </span>
                <span className={tagClassName}>
                  {categoryLabels[point.source.category]}
                </span>
              </>
            )}
          </span>
        </span>
      </button>
    </article>
  );
}
