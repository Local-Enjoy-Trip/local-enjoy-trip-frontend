import {
  getMyCourses,
  type CourseResponse,
} from "@/features/course/courseApi";
import { getSavedCourses, saveCourse } from "@/features/course/courseStorage";
import { notes, places } from "@/shared/data/mockData";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Heart,
  MapPin,
  Route,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type CourseStatus = "planning" | "saved";

type CourseSummary = {
  id: string;
  title: string;
  imageUrl: string;
  note: string;
  status: CourseStatus;
  stopCount: number;
  transport: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80";

const tabs: Array<{ label: string; status: CourseStatus }> = [
  { label: "내 코스", status: "planning" },
  { label: "저장함", status: "saved" },
];

const savedPlaces = places.filter((place) => place.saved);
const savedNotes = notes.filter((note) => note.saved);

function CourseSummaryCard({
  course,
  order = 0,
}: {
  course: CourseSummary;
  order?: number;
}) {
  const navigate = useNavigate();

  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[#EEE6DE] bg-white shadow-[0_8px_22px_rgba(31,38,35,0.04)]"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: Math.min(order * 0.04, 0.2), duration: 0.2 }}
    >
      <button
        className="flex w-full min-w-0 gap-3 border-0 bg-transparent p-3 text-left"
        onClick={() => navigate(`/course/${course.id}`)}
        type="button"
      >
        <img
          alt=""
          className="h-[92px] w-[92px] flex-none rounded-xl object-cover"
          src={course.imageUrl}
        />
        <span className="min-w-0 flex-1 py-0.5">
          <strong className="line-clamp-2 block text-[1.02rem] leading-tight font-black text-[#171717]">
            {course.title}
          </strong>
          <span className="mt-2 line-clamp-2 block text-sm leading-snug font-semibold text-[#746F67]">
            {course.note}
          </span>
          <span className="mt-3 flex flex-wrap gap-1.5 text-xs font-black text-[#7D776F]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0EA] px-2 py-1 text-[#C43B0A]">
              <MapPin size={12} />
              {course.stopCount}곳
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              <Clock3 size={12} />
              {course.transport}
            </span>
          </span>
        </span>
        <ChevronRight className="mt-1 flex-none text-[#B8B2A9]" size={18} />
      </button>
    </motion.article>
  );
}

function toApiCourseSummary(course: CourseResponse): CourseSummary {
  const firstItem = [...course.items].sort((a, b) => a.position - b.position)[0];
  const styles = [
    course.regionName,
    course.visibility === "PUBLIC" ? "공개 코스" : "내 코스",
    course.routeSummary.totalDistanceMeters > 0
      ? `${(course.routeSummary.totalDistanceMeters / 1000).toFixed(1)}km`
      : null,
  ].filter(Boolean);

  return {
    id: course.id,
    imageUrl: course.coverImageUrl ?? fallbackImage,
    note:
      course.description?.trim() ||
      `${styles.join(" · ") || "직접 만든 코스"}${
        firstItem?.title ? ` · ${firstItem.title}부터` : ""
      }`,
    status: "planning",
    stopCount: course.routeSummary.stopCount || course.items.length,
    title: course.title,
    transport:
      course.routeSummary.totalDurationSeconds > 0
        ? `${Math.round(course.routeSummary.totalDurationSeconds / 60)}분`
        : "도보 중심",
  };
}

export function CoursePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStatus, setActiveStatus] = useState<CourseStatus>("planning");
  const [savedCourses, setSavedCourses] = useState(() => getSavedCourses());
  const [apiCourses, setApiCourses] = useState<CourseResponse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"choice" | "direct">("choice");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [dateUndecided, setDateUndecided] = useState(false);

  const allCourseSummaries = useMemo<CourseSummary[]>(
    () => [
      ...apiCourses.map(toApiCourseSummary),
      ...savedCourses
        .filter((course) => !apiCourses.some((apiCourse) => apiCourse.id === course.id))
        .map((course) => ({
        id: course.id,
        title: course.title,
        imageUrl: course.stops[0]?.imageUrl ?? fallbackImage,
        note: `${course.companion} · ${course.styles.join(" · ")} · ${course.pace}`,
        status: "planning" as const,
        stopCount: course.stops.length,
        transport: "도보 중심",
      })),
    ],
    [apiCourses, savedCourses],
  );

  const visibleCourses = allCourseSummaries.filter(
    (course) => course.status === activeStatus,
  );

  useEffect(() => {
    const refresh = () => setSavedCourses(getSavedCourses());
    window.addEventListener("spot:courses-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("spot:courses-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setIsLoadingCourses(true);
      setCourseError("");
      try {
        const courses = await getMyCourses();
        if (!cancelled) setApiCourses(courses);
      } catch {
        if (!cancelled) {
          setApiCourses([]);
          setCourseError("서버 코스를 불러오지 못해 임시 저장 코스를 보여드려요.");
        }
      } finally {
        if (!cancelled) setIsLoadingCourses(false);
      }
    }

    void loadCourses();
    window.addEventListener("focus", loadCourses);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", loadCourses);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    setIsCreateOpen(true);
    setCreateMode("choice");
    setSearchParams((current) => {
      current.delete("create");
      return current;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  function closeCreateSheet() {
    setIsCreateOpen(false);
    window.setTimeout(() => setCreateMode("choice"), 180);
  }

  function createDirectCourse(event: FormEvent) {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;

    const course = {
      id: `direct-${Date.now()}`,
      title,
      area: "미정",
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
    closeCreateSheet();
    navigate(`/course/${course.id}`);
  }

  return (
    <section className="min-h-[calc(100dvh-72px)] overflow-x-hidden bg-white px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-4 text-[#111]">
      <header className="text-center">
        <h1 className="m-0 text-base font-extrabold">하루 코스</h1>
      </header>

      <div className="mt-8">
        <p className="m-0 text-xl leading-snug font-extrabold text-[#202020]">
          저장한 장소와 쪽지를 엮어
          <br />
          오늘 움직일 순서를 정리해보세요.
        </p>
        <p className="mt-3 mb-0 text-sm leading-relaxed font-bold text-[#817B73]">
          지도에서 발견한 것들을 코스에서 정리하는 흐름이에요.
        </p>
      </div>

      <button
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-[#FFD8C7] bg-[#FFF5F0] p-4 text-left shadow-[0_8px_22px_rgba(253,64,3,0.08)] transition-transform active:scale-[0.985]"
        onClick={() => setIsCreateOpen(true)}
        type="button"
      >
        <span className="grid size-12 flex-none place-items-center rounded-xl bg-[#FD4003] text-white">
          <CalendarDays size={23} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-base font-black text-[#171717]">
            새 하루 코스 만들기
          </strong>
          <span className="mt-1 block text-xs font-bold text-[#8A4D39]">
            직접 만들거나 AI 추천으로 시작해요.
          </span>
        </span>
        <ChevronRight size={20} className="text-[#FD4003]" />
      </button>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            className={`h-10 flex-1 rounded-full border px-4 text-sm font-black transition-[background-color,border-color,color,transform] active:scale-95 ${
              activeStatus === tab.status
                ? "border-[#1F3D35] bg-[#1F3D35] text-white shadow-[0_6px_14px_rgba(31,61,53,0.14)]"
                : "border-[#E6E1D8] bg-white text-[#77716A]"
            }`}
            key={tab.status}
            onClick={() => setActiveStatus(tab.status)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {courseError ? (
          <p className="m-0 rounded-2xl bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#A04A14]">
            {courseError}
          </p>
        ) : null}
        {activeStatus === "saved" ? (
          <div className="grid gap-3">
            <button
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#EEE6DE] bg-white px-4 text-left shadow-[0_8px_22px_rgba(31,38,35,0.04)]"
              onClick={() => navigate("/map?filter=saved")}
              type="button"
            >
              <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#FFF0EA] text-[#FD4003]">
                <Heart size={21} fill="currentColor" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-base font-black text-[#171717]">
                  저장한 장소
                </strong>
                <span className="mt-1 block text-xs font-bold text-[#817B73]">
                  {savedPlaces.length}곳을 코스에 담을 수 있어요.
                </span>
              </span>
              <ChevronRight size={19} className="text-[#AAA49B]" />
            </button>
            <button
              className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#EEE6DE] bg-white px-4 text-left shadow-[0_8px_22px_rgba(31,38,35,0.04)]"
              onClick={() => navigate("/map?filter=saved")}
              type="button"
            >
              <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#EEF4EF] text-[#1F3D35]">
                <FileText size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-base font-black text-[#171717]">
                  저장한 쪽지
                </strong>
                <span className="mt-1 block text-xs font-bold text-[#817B73]">
                  {savedNotes.length}개 쪽지를 하루 동선에 붙여볼 수 있어요.
                </span>
              </span>
              <ChevronRight size={19} className="text-[#AAA49B]" />
            </button>
          </div>
        ) : isLoadingCourses && visibleCourses.length === 0 ? (
          <div className="rounded-2xl border border-[#EEE6DE] bg-white p-5 text-center text-sm font-black text-[#817B73]">
            내 코스를 불러오는 중이에요...
          </div>
        ) : null}
        {activeStatus === "planning" && visibleCourses.length > 0 ? (
          visibleCourses.map((course, index) => (
            <CourseSummaryCard course={course} key={course.id} order={index} />
          ))
        ) : activeStatus === "planning" && !isLoadingCourses ? (
          <div className="rounded-2xl border border-dashed border-[#FFD8C7] bg-[#FFF9F5] p-5 text-center">
            <Route className="mx-auto text-[#FD4003]" size={28} />
            <p className="mt-3 mb-0 text-sm font-black text-[#514D47]">
              아직 이 목록에 코스가 없어요.
            </p>
            <button
              className="mt-4 min-h-11 rounded-xl border-0 bg-[#1F3D35] px-4 text-sm font-black text-white"
              onClick={() => setIsCreateOpen(true)}
              type="button"
            >
              코스 만들기
            </button>
          </div>
        ) : null}
      </div>

      <BottomSheet
        isOpen={isCreateOpen}
        onClose={closeCreateSheet}
        title={createMode === "direct" ? "직접 만들기" : "어떻게 시작할까요?"}
      >
        {createMode === "choice" ? <div className="grid gap-3">
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
                저장한 장소와 쪽지를 골라 하루 동선을 정리해요.
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
        </div> : (
          <form className="grid gap-4" onSubmit={createDirectCourse}>
            <label className="grid gap-2 text-sm font-black text-[#24211E]">
              코스 이름
              <input
                className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 font-semibold outline-none focus:border-[#1F3D35]"
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="예: 망원 쉬는 날 코스"
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
    </section>
  );
}
