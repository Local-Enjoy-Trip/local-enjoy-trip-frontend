import {
  getSavedAttractions,
  savedAttractionsQueryKey,
  type SavedAttractionResponse,
  unsaveAttraction,
} from "@/features/attractions/attractionApi";
import {
  getSavedNotes,
  savedNotesQueryKey,
  unsaveNote,
} from "@/features/notes/noteApi";
import { resolveNoteImageSrc } from "@/features/notes/noteImage";
import { setNoteSaveOverride } from "@/features/notes/noteSaveOverrides";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Heart,
  ImageIcon,
  MapPin,
  MessageSquareText,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type SavedTab = "places" | "notes";

export function MySavedPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SavedTab>("places");
  const savedAttractionsQuery = useQuery({
    queryFn: () => getSavedAttractions(),
    queryKey: savedAttractionsQueryKey,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const savedNotesQuery = useQuery({
    queryFn: () => getSavedNotes(),
    queryKey: savedNotesQueryKey,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  const savedPlaces = savedAttractionsQuery.data ?? [];
  const savedNotes = savedNotesQuery.data ?? [];
  const unsaveNoteMutation = useMutation({
    mutationFn: unsaveNote,
    onSuccess: async (_, noteId) => {
      setNoteSaveOverride(noteId, false);
      await queryClient.invalidateQueries({ queryKey: savedNotesQueryKey });
    },
  });
  const unsavePlaceMutation = useMutation({
    mutationFn: unsaveAttraction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: savedAttractionsQueryKey });
    },
  });

  function openPlaceDetail(place: SavedAttractionResponse) {
    const params = new URLSearchParams({
      filter: "saved",
      mapX: String(place.longitude),
      mapY: String(place.latitude),
      target: `place-${place.id}`,
    });

    navigate(`/map?${params.toString()}`);
  }

  function openNoteDetail(note: (typeof savedNotes)[number]) {
    const params = new URLSearchParams({
      filter: "saved",
      mapX: String(note.longitude),
      mapY: String(note.latitude),
      tab: "note",
      target: `note-${note.id}`,
    });

    navigate(`/map?${params.toString()}`);
  }

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#171717]">
      <header className="flex items-center gap-3">
        <button
          aria-label="마이페이지로 돌아가기"
          className="grid size-10 place-items-center rounded-full bg-[#F4F3EF]"
          onClick={() => navigate("/my")}
          type="button"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="m-0 text-lg font-black">저장함</h1>
      </header>

      <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#F5F3EF] p-1">
        <TabButton
          active={activeTab === "places"}
          count={savedPlaces.length}
          label="장소"
          onClick={() => setActiveTab("places")}
        />
        <TabButton
          active={activeTab === "notes"}
          count={savedNotes.length}
          label="쪽지"
          onClick={() => setActiveTab("notes")}
        />
      </div>

      {activeTab === "places" ? (
        <section className="mt-5">
          {savedAttractionsQuery.isPending ? (
            <ListSkeleton />
          ) : savedAttractionsQuery.isError ? (
            <StateMessage error>
              {savedAttractionsQuery.error instanceof Error
                ? savedAttractionsQuery.error.message
                : "저장한 장소를 불러오지 못했습니다."}
            </StateMessage>
          ) : savedPlaces.length === 0 ? (
            <StateMessage>아직 저장한 장소가 없어요.</StateMessage>
          ) : (
            <div className="grid gap-3">
              {savedPlaces.map((place) => (
                <article
                  className="grid w-full grid-cols-[88px_1fr] gap-3 rounded-2xl border border-[#ECE8E0] bg-white p-3 text-left shadow-[0_8px_18px_rgba(17,17,17,0.04)] transition-transform active:scale-[0.99]"
                  key={place.id}
                  onClick={() => openPlaceDetail(place)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openPlaceDetail(place);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="h-24 overflow-hidden rounded-xl bg-[#F4F3EF]">
                    {getAttractionImageUrl(place) ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        src={getAttractionImageUrl(place)}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[#A49C91]">
                        <ImageIcon size={24} strokeWidth={1.8} />
                      </div>
                    )}
                  </div>
                  <div className="relative min-w-0 py-1 pr-10">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#FD4003]">
                      <MapPin size={13} fill="currentColor" strokeWidth={2.4} />
                      {getAttractionCategory(place)}
                    </div>
                    <h2 className="mt-1.5 mb-0 line-clamp-1 text-base font-black text-[#171717]">
                      {place.title}
                    </h2>
                    <p className="mt-1 mb-0 line-clamp-2 text-xs leading-relaxed font-semibold text-[#6F6A61]">
                      {getAttractionAddress(place)}
                    </p>
                    <button
                      aria-label={`${place.title} 저장 해제`}
                      className="absolute top-0 right-0 grid size-9 place-items-center rounded-full bg-[#FFF0EA] text-[#FD4003] disabled:opacity-50"
                      disabled={unsavePlaceMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        unsavePlaceMutation.mutate(place.id);
                      }}
                      type="button"
                    >
                      <Heart size={18} fill="currentColor" strokeWidth={2.3} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-5">
          {savedNotesQuery.isPending ? (
            <ListSkeleton />
          ) : savedNotesQuery.isError ? (
            <StateMessage error>
              {savedNotesQuery.error instanceof Error
                ? savedNotesQuery.error.message
                : "저장한 쪽지를 불러오지 못했습니다."}
            </StateMessage>
          ) : savedNotes.length === 0 ? (
            <StateMessage>아직 저장한 쪽지가 없어요.</StateMessage>
          ) : (
            <div className="grid gap-3">
              {savedNotes.map((note) => {
                const imageUrl = resolveNoteImageSrc(note);

                return (
                  <article
                    className="grid w-full grid-cols-[76px_1fr] gap-3 rounded-2xl border border-[#ECE8E0] bg-white p-3 text-left shadow-[0_8px_18px_rgba(17,17,17,0.04)] transition-transform active:scale-[0.99]"
                    key={note.id}
                    onClick={() => openNoteDetail(note)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openNoteDetail(note);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="h-24 overflow-hidden rounded-xl bg-[#F4F3EF]">
                      {imageUrl ? (
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={imageUrl}
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-[#A49C91]">
                          <MessageSquareText size={24} strokeWidth={1.8} />
                        </div>
                      )}
                    </div>
                    <div className="relative min-w-0 py-1 pr-10">
                      <p className="m-0 text-xs font-black text-[#FD4003]">
                        {note.regionName || "위치 정보 없음"}
                      </p>
                      <h2 className="mt-1.5 mb-0 line-clamp-1 text-base font-black text-[#171717]">
                        {note.title || "제목 없는 쪽지"}
                      </h2>
                      <p className="mt-1 mb-0 line-clamp-3 text-xs leading-relaxed font-semibold text-[#6F6A61]">
                        {note.content}
                      </p>
                      <div className="mt-2 flex gap-1.5 overflow-hidden">
                        <span className="rounded-full bg-[#F4F3EF] px-2 py-1 text-[10px] font-black whitespace-nowrap text-[#6B655F]">
                          #{getNoteCategoryLabel(note.category)}
                        </span>
                      </div>
                      <button
                        aria-label={`${note.title || "쪽지"} 저장 해제`}
                        className="absolute top-0 right-0 grid size-9 place-items-center rounded-full bg-[#FFF0EA] text-[#FD4003] disabled:opacity-50"
                        disabled={unsaveNoteMutation.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          unsaveNoteMutation.mutate(note.id);
                        }}
                        type="button"
                      >
                        <Heart size={18} fill="currentColor" strokeWidth={2.3} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}

function TabButton({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-black transition ${
        active
          ? "bg-white text-[#171717] shadow-[0_6px_14px_rgba(17,17,17,0.08)]"
          : "text-[#8C857B]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
      <span className={active ? "text-[#FD4003]" : "text-[#A9A29A]"}>
        {count}
      </span>
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}

function StateMessage({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <p
      className={`mt-3 rounded-2xl p-5 text-sm font-bold ${
        error ? "bg-[#FFF0EE] text-[#D5483D]" : "bg-[#F6F5F1] text-[#746F67]"
      }`}
    >
      {children}
    </p>
  );
}

function getAttractionImageUrl(place: SavedAttractionResponse) {
  return place.imageUrl ?? place.firstImage ?? "";
}

function getAttractionAddress(place: SavedAttractionResponse) {
  const rawPlace = place as Record<string, unknown>;

  return (
    [
      place.address,
      place.addressName,
      place.roadAddress,
      place.roadAddressName,
      place.addr1,
      place.addr2,
      rawPlace.addr,
      rawPlace.addrName,
      rawPlace.fullAddress,
      rawPlace.location,
      rawPlace.regionName,
      rawPlace.area,
    ]
      .map(toDisplayText)
      .find((value) => value.length > 0) ?? "주소 정보 없음"
  );
}

function getAttractionCategory(place: SavedAttractionResponse) {
  const labels: Record<string, string> = {
    "12": "관광지",
    "14": "문화시설",
    "15": "축제",
    "28": "레포츠",
    "32": "숙박",
    "38": "쇼핑",
    "39": "음식점",
  };

  return place.contentTypeId ? labels[place.contentTypeId] ?? "장소" : "장소";
}

function toDisplayText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;

    return [
      record.address,
      record.addressName,
      record.address_name,
      record.roadAddress,
      record.roadAddressName,
      record.road_address_name,
      record.addr,
      record.addr1,
      record.addr2,
      record.name,
    ]
      .map(toDisplayText)
      .find((text) => text.length > 0) ?? "";
  }
  return "";
}

function getNoteCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    BEST: "가장 좋았던 것",
    BOOK: "책",
    MOVIE: "영화",
    MUSIC: "음악",
    TIP: "꿀팁",
    TRANSIT_TIP: "이동 팁",
    UNCATEGORIZED: "기타",
  };

  return labels[category] ?? "기타";
}
