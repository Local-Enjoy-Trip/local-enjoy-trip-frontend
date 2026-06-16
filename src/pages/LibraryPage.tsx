import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Footprints,
  MapPin,
  MoreHorizontal,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { courses, places } from "@/shared/data/mockData";

type CourseStatus = "planning" | "recommended" | "saved";

type CourseCard = {
  day: number;
  id: string;
  title: string;
  area: string;
  duration: string;
  imageUrl: string;
  note: string;
  stopCount: number;
  stops: string[];
  status: CourseStatus;
  transport: string;
  updatedAt: string;
};

const courseCards: CourseCard[] = [
  {
    day: 1,
    id: courses[0]?.id ?? "course-1",
    title: courses[0]?.title ?? "망원시장 간식에서 한강까지",
    area: "망원",
    duration: "반나절",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&q=80",
    note: "시장 간식, 골목 산책, 한강 노을을 한 번에 묶은 가벼운 코스",
    stopCount: courses[0]?.stopCount ?? 4,
    stops: ["망원시장", "망원시장 골목", "망원한강공원", "한강 산책로"],
    status: "planning",
    transport: "도보 34분",
    updatedAt: "오늘 수정",
  },
  {
    day: 2,
    id: "course-seongsu-cafe",
    title: "성수 카페와 서울숲 산책",
    area: "성수",
    duration: "오후 4시간",
    imageUrl:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=640&q=80",
    note: "비 오는 날에도 부담 없는 카페, 전시, 숲길 중심 동선",
    stopCount: 5,
    stops: ["성수 카페 거리", "편집샵 골목", "서울숲", "베이커리 골목"],
    status: "planning",
    transport: "도보 28분",
    updatedAt: "어제 수정",
  },
  {
    day: 1,
    id: "course-ai-river",
    title: "해질녘 한강 산책 추천",
    area: "망원",
    duration: "2시간",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
    note: "저녁 시간대에 맞춰 시장과 강변을 짧게 연결해요.",
    stopCount: 3,
    stops: ["망원시장", "망원한강공원 입구", "강변 산책로"],
    status: "recommended",
    transport: "도보 22분",
    updatedAt: "AI 추천",
  },
  {
    day: 2,
    id: "course-saved-forest",
    title: "서울숲 피크닉 저장 코스",
    area: "성수",
    duration: "반나절",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=640&q=80",
    note: "서울숲 안쪽 벤치와 근처 카페를 이어둔 저장 코스",
    stopCount: 4,
    stops: ["서울숲", "은행나무길", "성수 카페 거리", "베이커리 골목"],
    status: "saved",
    transport: "도보 31분",
    updatedAt: "저장됨",
  },
];

const regions = ["서울", "부산", "제주", "강릉", "전주", "경주"];
const travelStyles = [
  "맛집 중심",
  "카페·감성",
  "자연·산책",
  "문화·전시",
  "알찬 일정",
  "여유로운 일정",
];

const tabs: Array<{ label: string; status: CourseStatus }> = [
  { label: "내 코스", status: "planning" },
  { label: "추천", status: "recommended" },
  { label: "저장됨", status: "saved" },
];

const dayTabs = [
  { label: "전체", value: "all" },
  { label: "DAY 1", value: "1" },
  { label: "DAY 2", value: "2" },
];

function CourseCardItem({ course }: { course: CourseCard }) {
  return (
    <article className="w-full overflow-hidden rounded-2xl border border-[#E9E4DC] bg-white p-3 shadow-[0_8px_22px_rgba(31,38,35,0.04)]">
      <div className="flex min-w-0 gap-3">
        <img
          className="h-[92px] w-[92px] flex-none rounded-xl object-cover"
          src={course.imageUrl}
          alt=""
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="m-0 text-xs font-black text-[#6B756E]">
                {course.area} · {course.duration}
              </p>
              <h2 className="mt-1 mb-0 line-clamp-2 text-[1.02rem] leading-tight font-black text-[#171717]">
                {course.title}
              </h2>
            </div>
            <button
              aria-label={`${course.title} 메뉴`}
              className="grid size-8 flex-none place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#5D5A54]"
              type="button"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
          <p className="mt-2 mb-0 line-clamp-2 text-sm leading-snug font-semibold text-[#746F67]">
            {course.note}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-black text-[#8B857C]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              DAY {course.day}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              <MapPin size={12} />
              {course.stopCount}곳
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              <Clock3 size={12} />
              {course.updatedAt}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-[#FAF9F6] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-black text-[#6B756E]">
            동선 미리보기
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-black text-[#8B857C]">
            <Footprints size={13} />
            {course.transport}
          </span>
        </div>
        <div className="grid gap-2">
          {course.stops.slice(0, 4).map((stop, index) => (
            <div
              className="grid grid-cols-[20px_1fr] items-start gap-2"
              key={`${course.id}-${stop}`}
            >
              <span className="relative grid size-5 place-items-center rounded-full bg-[#1F3D35] text-[10px] font-black text-white">
                {index + 1}
                {index < Math.min(course.stops.length, 4) - 1 ? (
                  <span className="absolute top-5 h-4 w-px bg-[#D8D3C9]" />
                ) : null}
              </span>
              <span className="min-w-0 truncate text-xs font-black text-[#514D47]">
                {stop}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeDay, setActiveDay] = useState("all");
  const [activeTab, setActiveTab] = useState<CourseStatus>("planning");
  const [sheetStep, setSheetStep] = useState<"choose" | "ai">("choose");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const isCreateOpen = searchParams.get("create") === "1";
  const visibleCourses = courseCards.filter(
    (course) =>
      course.status === activeTab &&
      (activeDay === "all" || course.day === Number(activeDay)),
  );

  function openCreateSheet() {
    setSearchParams({ create: "1" });
  }

  function closeCreateSheet() {
    setSearchParams({});
    setSheetStep("choose");
  }

  function toggleStyle(style: string) {
    setSelectedStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style],
    );
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#F8F7F3] px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black tracking-[0.08em] text-[#6B756E]">
            TRIP COURSES
          </p>
          <h1 className="m-0 text-[2rem] leading-tight font-black">
            코스
          </h1>
          <p className="mt-2 mb-0 text-sm font-semibold text-[#77716A]">
            지도에서 담은 장소를 여행 동선으로 정리해요.
          </p>
        </div>
        <button
          aria-label="코스 만들기"
          className="grid size-11 flex-none place-items-center rounded-full bg-[#1F3D35] text-white shadow-[0_8px_18px_rgba(31,61,53,0.18)]"
          onClick={openCreateSheet}
          type="button"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3">
          <p className="m-0 text-xs font-black text-[#8B857C]">내 코스</p>
          <strong className="mt-1 block text-xl font-black text-[#171717]">
            {courseCards.filter((course) => course.status === "planning").length}
          </strong>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="m-0 text-xs font-black text-[#8B857C]">담은 장소</p>
          <strong className="mt-1 block text-xl font-black text-[#171717]">
            {places.filter((place) => place.saved).length}
          </strong>
        </div>
        <div className="rounded-xl bg-white p-3">
          <p className="m-0 text-xs font-black text-[#8B857C]">추천</p>
          <strong className="mt-1 block text-xl font-black text-[#171717]">
            {courseCards.filter((course) => course.status === "recommended").length}
          </strong>
        </div>
      </div>

      <button
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#E6E1D8] bg-white p-3.5 text-left"
        type="button"
        onClick={openCreateSheet}
      >
        <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#F4F3EF] text-[#1F3D35]">
          <CalendarDays size={21} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-black text-[#171717]">
            새 코스 만들기
          </strong>
          <small className="mt-1 block text-xs font-bold text-[#807A72]">
            직접 만들거나 AI 추천으로 시작해요.
          </small>
        </span>
        <ChevronRight size={19} className="text-[#AAA49B]" />
      </button>

      <div className="mt-6 grid grid-cols-3 rounded-xl bg-[#EDEAE3] p-1">
        {tabs.map((tab) => (
          <button
            className={`h-9 rounded-lg text-sm font-black ${
              activeTab === tab.status
                ? "bg-white text-[#171717] shadow-[0_3px_10px_rgba(31,38,35,0.08)]"
                : "text-[#77716A]"
            }`}
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {dayTabs.map((day) => (
          <button
            className={`h-9 flex-none rounded-full border px-4 text-sm font-black ${
              activeDay === day.value
                ? "border-[#1F3D35] bg-[#1F3D35] text-white"
                : "border-[#E6E1D8] bg-white text-[#77716A]"
            }`}
            key={day.value}
            onClick={() => setActiveDay(day.value)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {visibleCourses.length > 0 ? (
          visibleCourses.map((course) => (
            <CourseCardItem course={course} key={course.id} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8D3C9] bg-white p-5 text-center">
            <p className="m-0 text-sm font-black text-[#514D47]">
              이 날짜에 표시할 코스가 없어요.
            </p>
            <p className="mt-1 mb-0 text-xs font-bold text-[#8B857C]">
              다른 DAY를 선택하거나 새 코스를 만들어보세요.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreateOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateSheet}
          >
            <motion.section
              className="w-full max-w-[430px] rounded-t-[24px] bg-white px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(0,0,0,0.18)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-label="코스 생성"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#D8D5CE]" />

              {sheetStep === "choose" ? (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-xs font-black text-[#6B756E]">
                        코스 생성
                      </p>
                      <h2 className="m-0 text-xl font-black">
                        어떻게 시작할까요?
                      </h2>
                    </div>
                    <button
                      className="grid size-9 place-items-center rounded-full border-0 bg-[#F4F3EF]"
                      type="button"
                      onClick={closeCreateSheet}
                      aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <button
                      className="flex items-center gap-3 rounded-xl border border-[#EEEAE2] bg-white p-4 text-left"
                      type="button"
                      onClick={() => navigate("/course/new")}
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-[#F4F3EF] text-[#222]">
                        <CalendarDays size={22} />
                      </span>
                      <span className="flex-1">
                        <strong className="block font-black">
                          직접 만들기
                        </strong>
                        <small className="mt-1 block text-xs font-bold text-[#888]">
                          날짜와 장소를 직접 골라 계획해요.
                        </small>
                      </span>
                      <ChevronRight size={19} className="text-[#aaa]" />
                    </button>

                    <button
                      className="flex items-center gap-3 rounded-xl border border-[#DDE5DD] bg-[#F6FAF6] p-4 text-left"
                      type="button"
                      onClick={() => setSheetStep("ai")}
                    >
                      <span className="grid size-11 place-items-center rounded-xl bg-[#1F3D35] text-white">
                        <Sparkles size={22} />
                      </span>
                      <span className="flex-1">
                        <strong className="block font-black text-[#222]">
                          AI 추천받기
                        </strong>
                        <small className="mt-1 block text-xs font-bold text-[#888]">
                          취향과 지역에 맞춰 코스를 추천해요.
                        </small>
                      </span>
                      <ChevronRight size={19} className="text-[#1F3D35]" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-xs font-black text-[#6B756E]">
                        AI 코스 추천
                      </p>
                      <h2 className="m-0 text-xl font-black">
                        여행 취향을 알려주세요
                      </h2>
                    </div>
                    <button
                      className="grid size-9 place-items-center rounded-full border-0 bg-[#F4F3EF]"
                      type="button"
                      onClick={closeCreateSheet}
                      aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div>
                    <h3 className="mb-2.5 text-sm font-black">
                      어디로 떠날까요?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {regions.map((region) => (
                        <button
                          className={`rounded-full border px-3.5 py-2 text-sm font-black ${
                            selectedRegion === region
                              ? "border-[#1F3D35] bg-[#EEF6F0] text-[#1F3D35]"
                              : "border-[#E6E1D8] bg-white text-[#77716A]"
                          }`}
                          key={region}
                          type="button"
                          onClick={() => setSelectedRegion(region)}
                        >
                          <MapPin className="mr-1 inline" size={14} />
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-2.5 text-sm font-black">
                      어떤 여행을 좋아하나요?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {travelStyles.map((style) => {
                        const isSelected = selectedStyles.includes(style);

                        return (
                          <button
                            className={`rounded-full border px-3.5 py-2 text-sm font-black ${
                              isSelected
                                ? "border-[#1F3D35] bg-[#1F3D35] text-white"
                                : "border-[#E6E1D8] bg-white text-[#77716A]"
                            }`}
                            key={style}
                            type="button"
                            onClick={() => toggleStyle(style)}
                          >
                            {isSelected ? (
                              <Check className="mr-1 inline" size={14} />
                            ) : null}
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    className="mt-7 min-h-13 w-full rounded-xl border-0 bg-[#1F3D35] font-black text-white shadow-[0_10px_24px_rgba(31,61,53,0.18)] disabled:bg-[#eee] disabled:text-[#aaa] disabled:shadow-none"
                    type="button"
                    disabled={!selectedRegion || selectedStyles.length === 0}
                    onClick={() => {
                      const params = new URLSearchParams({
                        mode: "ai",
                        region: selectedRegion,
                        styles: selectedStyles.join(","),
                      });
                      navigate(`/course/new?${params.toString()}`);
                    }}
                  >
                    AI 코스 추천받기
                  </button>
                </>
              )}
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
