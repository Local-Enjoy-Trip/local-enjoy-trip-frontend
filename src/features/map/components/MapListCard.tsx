import { Heart, Route, Star, UserRound } from "lucide-react";
import { categoryLabels, visibilityLabels } from "@/shared/lib/labels";
import type { MapPoint } from "../types";

export function MapListCard({
  featured = false,
  onSelect,
  point,
  selected = false
}: {
  featured?: boolean;
  onSelect?: () => void;
  point: MapPoint;
  selected?: boolean;
}) {
  const isPlace = point.kind === "place";
  const description = isPlace ? point.source.summary : point.source.body;
  const tagClassName =
    "inline-flex rounded-full bg-[#f1f6f1] px-[7px] py-1 text-[11px] font-black text-[#315343]";

  return (
    <article
      className={`rounded-2xl border p-3 ${
        selected
          ? "border-[#185B3D] bg-[#F1F7F1] shadow-[0_10px_24px_rgba(24,91,61,0.14)]"
          : featured
          ? "mb-2 border-[#185B3D]/20 bg-[#F1F7F1]"
          : "border-[#efeee9] bg-white"
      }`}
      data-selected={selected}
    >
      <button
        className="flex w-full items-start gap-3 border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span
          className={`grid h-11 w-11 flex-none place-items-center overflow-hidden rounded-2xl ${
            isPlace ? "bg-[#FFF1E6] text-[#F97316]" : "bg-[#EAF7EE] text-[#185B3D]"
          }`}
        >
          {isPlace ? (
            <Star size={22} fill="currentColor" />
          ) : point.authorAvatarUrl ? (
            <img className="h-full w-full object-cover" alt="" src={point.authorAvatarUrl} />
          ) : (
            <UserRound size={22} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <strong className="truncate text-[0.96rem] font-black text-[#171717]">
              {point.name}
            </strong>
            {point.saved ? (
              <Heart size={15} fill="#FF5A66" className="text-[#FF5A66]" />
            ) : null}
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#ece9e3] bg-white text-sm font-black text-[#26231f]"
          type="button"
        >
          <Heart size={16} />
          찜
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-0 bg-[#185B3D] text-sm font-black text-white"
          type="button"
        >
          <Route size={16} />
          여행코스
        </button>
      </div>
    </article>
  );
}
