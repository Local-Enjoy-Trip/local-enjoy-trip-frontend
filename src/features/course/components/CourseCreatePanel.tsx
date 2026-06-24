import { saveCourse } from "@/features/course/courseStorage";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { CalendarDays, ChevronRight, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

type CreateMode = "choice" | "direct";

export function CourseCreatePanel({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="mx-5 mt-8 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-[22px] border border-[#FFE0D2] bg-[#FFF7F2] p-4 text-left shadow-[0_10px_24px_rgba(253,64,3,0.07)] transition-transform active:scale-[0.985]"
      onClick={onClick}
      type="button"
    >
      <span className="grid size-12 flex-none place-items-center rounded-2xl bg-[#FD4003] text-white">
        <CalendarDays size={23} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-base font-black text-[#171717]">
          새 하루 코스 만들기
        </strong>
        <span className="mt-1 block text-xs leading-relaxed font-bold text-[#8A4D39]">
          직접 만들거나 AI 추천으로 시작해요.
        </span>
      </span>
      <ChevronRight size={20} className="flex-none text-[#FD4003]" />
    </button>
  );
}

export function CourseCreateSheet({
  isOpen,
  onClose,
  tripArea,
}: {
  isOpen: boolean;
  onClose: () => void;
  tripArea: string;
}) {
  const navigate = useNavigate();
  const [createMode, setCreateMode] = useState<CreateMode>("choice");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [dateUndecided, setDateUndecided] = useState(false);

  function closeSheet() {
    onClose();
    window.setTimeout(() => setCreateMode("choice"), 180);
  }

  function createDirectCourse(event: FormEvent) {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;

    const course = {
      id: `direct-${Date.now()}`,
      title,
      area: tripArea,
      companion: "내 일정",
      date: dateUndecided || !draftDate ? undefined : draftDate,
      styles: ["직접 만든 코스"],
      pace: dateUndecided || !draftDate ? "날짜 미정" : draftDate,
      savedAt: new Date().toISOString(),
      collaborators: [],
      stops: [],
    };

    saveCourse(course);
    setDraftTitle("");
    setDraftDate("");
    setDateUndecided(false);
    closeSheet();
    navigate(`/course/${course.id}`);
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeSheet}
      title={createMode === "direct" ? "직접 만들기" : "일정 추가"}
    >
      {createMode === "choice" ? (
        <div className="grid gap-3">
          <button
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#E9E5DE] bg-white px-4 text-left"
            onClick={() => setCreateMode("direct")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-[#FFF0EA] text-[#FD4003]">
              <CalendarDays size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-black text-[#202020]">
                직접 만들기
              </strong>
              <span className="mt-1 block text-xs font-bold text-[#817B73]">
                코스 이름과 날짜만 먼저 정해요.
              </span>
            </span>
            <ChevronRight size={19} className="text-[#AAA49B]" />
          </button>

          <button
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-[#DDE5DD] bg-[#F6FAF6] px-4 text-left"
            onClick={() => navigate("/course/new?mode=ai")}
            type="button"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-[#1F3D35] text-white">
              <Sparkles size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block font-black text-[#202020]">
                AI 추천받기
              </strong>
              <span className="mt-1 block text-xs font-bold text-[#6F776F]">
                취향과 동네에 맞는 하루 코스를 받아요.
              </span>
            </span>
            <ChevronRight size={19} className="text-[#1F3D35]" />
          </button>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={createDirectCourse}>
          <label className="grid gap-2 text-sm font-black text-[#24211E]">
            코스 이름
            <input
              className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 font-semibold outline-none focus:border-[#1F3D35]"
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder={`${tripArea} 쉬는 날 코스`}
              value={draftTitle}
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-[#24211E]">
            날짜
            <span className="relative">
              <CalendarDays
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[#999]"
                size={17}
              />
              <input
                className="min-h-13 w-full rounded-2xl border border-[#E5E1DA] bg-white pl-10 font-semibold disabled:bg-[#F5F3EF] disabled:text-[#AAA49C]"
                disabled={dateUndecided}
                onChange={(event) => setDraftDate(event.target.value)}
                type="date"
                value={draftDate}
              />
            </span>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-[#F7F5F0] px-4 text-sm font-black text-[#5F5A54]">
            <input
              checked={dateUndecided}
              className="size-4 accent-[#1F3D35]"
              onChange={(event) => setDateUndecided(event.target.checked)}
              type="checkbox"
            />
            날짜는 아직 미정이에요
          </label>
          <button
            className="min-h-14 rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#E8E5DF] disabled:text-[#AAA49C]"
            disabled={!draftTitle.trim()}
            type="submit"
          >
            생성하고 상세로 이동
          </button>
        </form>
      )}
    </BottomSheet>
  );
}
