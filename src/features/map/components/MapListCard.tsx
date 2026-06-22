import { Heart, Plus, UserRound } from "lucide-react";
import { NoteCard } from "@/features/notes/components/NoteCard";
import type { MapPoint } from "../types";

const neighborhoodDistricts: Record<string, string> = {
  망원: "마포구",
  성수: "성동구",
  서울숲: "성동구",
};

function getDistrictLabel(location: string | null | undefined) {
  if (!location?.trim()) return "서울시";

  const district = location
    .trim()
    .split(/\s+/)
    .find((part) => part.endsWith("구"));

  if (district) return `서울시 ${district}`;

  const neighborhood = Object.keys(neighborhoodDistricts).find((name) =>
    location.includes(name),
  );

  return neighborhood
    ? `서울시 ${neighborhoodDistricts[neighborhood]}`
    : "서울시";
}

export function MapListCard({
  featured = false,
  onAddToCourse,
  onSelect,
  point,
  selected = false,
}: {
  featured?: boolean;
  onAddToCourse?: (point: MapPoint) => void;
  onSelect?: () => void;
  point: MapPoint;
  selected?: boolean;
}) {
  const isPlace = point.kind === "place";
  const addressLabel = (isPlace ? point.source.area : point.source.placeName) || "주소 정보 없음";
  const locationLabel = getDistrictLabel(addressLabel);

  if (!isPlace) {
    return (
      <NoteCard
        className={featured ? "mb-2" : ""}
        note={{
          authorName: point.authorName,
          body: point.source.body,
          createdAt: point.source.createdAt,
          id: point.id,
          imageAlt: point.source.placeName,
          imageUrl: point.source.imageUrl,
          locationLabel: point.source.placeName || locationLabel,
          profileImageUrl: point.authorAvatarUrl,
          saved: point.saved,
        }}
        onSelect={onSelect}
        selected={selected}
        wide={featured}
      />
    );
  }

  const detailLabel = point.source.tags.slice(0, 3).join(" · ");

  return (
    <article
      className={`relative h-[176px] overflow-hidden rounded-[20px] bg-[#302d2a] shadow-[0_8px_20px_rgba(17,17,17,0.12)] ${
        featured ? "mb-2" : ""
      }`}
    >
      {point.source.imageUrl ? (
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          loading="lazy"
          src={point.source.imageUrl}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[#4a4641] text-white/70">
          <UserRound size={36} />
        </span>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-black/5" />

      <button
        aria-label={`${point.name} 상세 보기`}
        className="absolute inset-0 z-10 border-0 bg-transparent p-0 text-left"
        onClick={onSelect}
        type="button"
      >
        <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-[#242424] shadow-[0_2px_6px_rgba(17,17,17,0.12)]">
          {locationLabel}
        </span>
        <span className="absolute right-[82px] bottom-3 left-4 text-white">
          <strong className="block truncate text-[1.02rem] leading-tight font-extrabold">
            {point.name}
          </strong>
          <span className="mt-1 block truncate text-[11px] font-medium text-white/80">
            {addressLabel}
          </span>
          <span className="mt-1 block truncate text-[11px] font-bold text-white/80">
            {detailLabel}
          </span>
        </span>
      </button>

      <div className="absolute right-3 bottom-3 z-20 flex items-center gap-2">
        <button
          aria-label={point.saved ? "찜 해제" : "찜"}
          className="grid size-8 place-items-center border-0 bg-transparent text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
          type="button"
        >
          <Heart
            size={25}
            fill={point.saved ? "#FD4003" : "none"}
            className={point.saved ? "text-[#FD4003]" : "text-white"}
            strokeWidth={2.2}
          />
        </button>
        <button
          aria-label="추가할 코스 선택"
          className="grid size-8 place-items-center border-0 bg-transparent text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
          onClick={() => onAddToCourse?.(point)}
          type="button"
        >
          <Plus size={28} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}
