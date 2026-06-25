import type { HomeNote } from "@/features/home/types/homeTypes";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import { SpotNoteCard } from "./SpotNoteCard";

export function SpotNoteCarousel({
  isError,
  isLoading,
  notes,
}: {
  isError: boolean;
  isLoading: boolean;
  notes: HomeNote[];
}) {
  return (
    <section className="mt-8">
      <SectionHeader title="우리동네 주변 쪽지" actionTo="/map" />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-[270px] w-[78%] flex-none rounded-[20px]" />
          <Skeleton className="h-[270px] w-[78%] flex-none rounded-[20px]" />
        </div>
      ) : notes.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {notes.map((note) => (
            <SpotNoteCard note={note} key={note.id} />
          ))}
        </div>
      ) : (
        <p className="mx-5 my-0 rounded-[20px] bg-[#F7F6F3] px-5 py-8 text-center text-sm font-bold text-[#77736C]">
          {isError
            ? "주변 쪽지를 불러오지 못했어요."
            : "이 동네에는 아직 공개된 쪽지가 없어요."}
        </p>
      )}
    </section>
  );
}
