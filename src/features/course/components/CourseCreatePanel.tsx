import { createCourse } from "@/features/course/courseApi";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

type CreateMode = "choice" | "direct";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

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
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  function closeSheet() {
    onClose();
    window.setTimeout(() => setCreateMode("choice"), 180);
  }

  async function createDirectCourse(event: FormEvent) {
    event.preventDefault();
    if (isCreating) return;

    const title = draftTitle.trim();
    if (!title) return;

    const course = {
      id: `direct-${Date.now()}`,
      title,
      description: dateUndecided || !draftDate ? undefined : draftDate,
      items: [],
      regionName: tripArea,
      status: "DRAFT",
      visibility: "PRIVATE",
    };

    try {
      setIsCreating(true);
      setCreateError("");
      const createdCourse = await createCourse(course);
      setDraftTitle("");
      setDraftDate("");
      setDateUndecided(false);
      setCalendarMonth(startOfMonth(new Date()));
      closeSheet();
      navigate(`/course/${createdCourse.id}`);
    } catch {
      setCreateError("코스를 서버에 저장하지 못했어요. 로그인 상태를 확인해 주세요.");
    } finally {
      setIsCreating(false);
    }
  }

  function selectDraftDate(date: string) {
    setDraftDate(date);
    setDateUndecided(false);
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

          <div className="grid gap-2 text-sm font-black text-[#24211E]">
            <div className="flex items-center justify-between gap-3">
              <span>날짜</span>
              <label className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#E4DED3] bg-[#FAF8F4] px-3 text-xs font-black text-[#5F5A54]">
                <input
                  checked={dateUndecided}
                  className="size-4 accent-[#1F3D35]"
                  onChange={(event) => {
                    setDateUndecided(event.target.checked);
                    if (event.target.checked) setDraftDate("");
                  }}
                  type="checkbox"
                />
                미정
              </label>
            </div>

            <CourseDraftCalendar
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              onSelectDate={selectDraftDate}
              selectedDate={draftDate}
              undecided={dateUndecided}
            />
          </div>

          <button
            className="min-h-14 rounded-2xl border-0 bg-[#1F3D35] font-extrabold text-white disabled:bg-[#E8E5DF] disabled:text-[#AAA49C]"
            disabled={!draftTitle.trim() || isCreating}
            type="submit"
          >
            생성하기
          </button>
          {createError ? (
            <p className="m-0 rounded-xl bg-[#FFF0EE] px-3 py-2 text-xs font-bold text-[#D5483D]">
              {createError}
            </p>
          ) : null}
        </form>
      )}
    </BottomSheet>
  );
}

function CourseDraftCalendar({
  month,
  onMonthChange,
  onSelectDate,
  selectedDate,
  undecided,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  undecided: boolean;
}) {
  const days = getCalendarDays(month);
  const monthLabel = new Intl.DateTimeFormat("ko", {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E9E2D7] bg-[#FFFDF8] shadow-[0_10px_22px_rgba(31,61,53,0.07)]">
      <div className="flex items-center justify-between gap-2 bg-[#F8F4EC] px-2.5 py-2.5">
        <button
          aria-label="이전 달"
          className="grid size-8 flex-none place-items-center rounded-full border border-[#E4DDD2] bg-white text-[#4E4941] shadow-sm"
          onClick={() => onMonthChange(addMonths(month, -1))}
          type="button"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>

        <div className="flex min-w-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[#1F3D35] shadow-sm">
          <CalendarCheck size={16} strokeWidth={2.4} />
          <strong className="truncate text-xs font-black">{monthLabel}</strong>
        </div>

        <button
          aria-label="다음 달"
          className="grid size-8 flex-none place-items-center rounded-full border border-[#E4DDD2] bg-white text-[#4E4941] shadow-sm"
          onClick={() => onMonthChange(addMonths(month, 1))}
          type="button"
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div className="px-2.5 pt-2 pb-3">
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {weekdayLabels.map((label, index) => (
            <span
              className={`py-0.5 text-[10px] font-black ${
                index === 0
                  ? "text-[#FD4003]"
                  : index === 6
                    ? "text-[#3F73A8]"
                    : "text-[#8B857C]"
              }`}
              key={label}
            >
              {label}
            </span>
          ))}

          {days.map((date, index) => {
            if (!date) {
              return <span aria-hidden="true" key={`blank-${index}`} />;
            }

            const dateValue = formatDateInputValue(date);
            const selected = !undecided && selectedDate === dateValue;
            const today = dateValue === formatDateInputValue(new Date());

            return (
              <button
                className={`grid aspect-square min-h-8 place-items-center rounded-xl text-[11px] font-black transition ${
                  selected
                    ? "bg-[#FD4003] text-white shadow-[0_8px_16px_rgba(253,64,3,0.25)]"
                    : today
                      ? "bg-[#EEF4EF] text-[#1F3D35] ring-1 ring-[#BFD0C2]"
                      : "bg-transparent text-[#2E2A25] hover:bg-[#F4EFE7]"
                } ${undecided ? "opacity-45" : ""}`}
                disabled={undecided}
                key={dateValue}
                onClick={() => onSelectDate(dateValue)}
                type="button"
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const blanks = Array.from<null>({ length: firstDay.getDay() }).fill(null);
  const dates = Array.from(
    { length: dayCount },
    (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
  );
  const trailingBlanks = Array.from<null>({
    length: 42 - blanks.length - dates.length,
  }).fill(null);

  return [...blanks, ...dates, ...trailingBlanks];
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
