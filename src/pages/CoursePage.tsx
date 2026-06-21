import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { courses, places } from "@/shared/data/mockData";
import { BottomSheet } from "@/shared/ui/BottomSheet";

type CourseStatus = "planning" | "recommended" | "saved";

type CourseSummary = {
  id: string;
  title: string;
  area: string;
  dayLabel: string;
  imageUrl: string;
  note: string;
  status: CourseStatus;
  stops: string[];
  transport: string;
  updatedAt: string;
};

const courseSummaries: CourseSummary[] = [
  {
    id: courses[0]?.id ?? "course-1",
    title: "망원 하루 코스",
    area: "망원",
    dayLabel: "day 1",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&q=80",
    note: "시장 간식에서 한강 산책까지 이어지는 하루 동선",
    status: "planning",
    stops: ["망원시장", "망원시장 골목", "망원한강공원", "한강 산책로"],
    transport: "도보 34분",
    updatedAt: "오늘 수정",
  },
  {
    id: "course-seongsu-cafe",
    title: "성수 카페와 서울숲 산책",
    area: "성수",
    dayLabel: "day 1",
    imageUrl:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=640&q=80",
    note: "카페, 편집샵, 서울숲을 묶은 느긋한 오후 코스",
    status: "planning",
    stops: ["성수 카페 거리", "편집샵 골목", "서울숲", "베이커리 골목"],
    transport: "도보 28분",
    updatedAt: "어제 수정",
  },
  {
    id: "course-ai-river",
    title: "해질녘 한강 산책 추천",
    area: "망원",
    dayLabel: "추천",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
    note: "저녁 시간대에 맞춰 시장과 강변을 짧게 연결해요.",
    status: "recommended",
    stops: ["망원시장", "망원한강공원 입구", "강변 산책로"],
    transport: "도보 22분",
    updatedAt: "AI 추천",
  },
];

const tabs: Array<{ label: string; status: CourseStatus }> = [
  { label: "내 코스", status: "planning" },
  { label: "추천", status: "recommended" },
  { label: "저장됨", status: "saved" },
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

function MiniRoute({ stops }: { stops: string[] }) {
  return (
    <div className="mt-3 rounded-xl bg-[#FAF9F6] p-3">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {stops.slice(0, 4).map((stop, index) => (
          <div className="flex min-w-0 items-center gap-1.5" key={stop}>
            <span className="grid size-5 flex-none place-items-center rounded-full bg-[#7957F2] text-[10px] font-black text-white">
              {index + 1}
            </span>
            <span className="max-w-[72px] truncate text-xs font-black text-[#514D47]">
              {stop}
            </span>
            {index < Math.min(stops.length, 4) - 1 ? (
              <span className="h-px w-5 flex-none border-t border-dashed border-[#AAA49B]" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseSummaryCard({
  course,
}: {
  course: CourseSummary;
}) {
  const navigate = useNavigate();

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E9E4DC] bg-white p-3 shadow-[0_8px_22px_rgba(31,38,35,0.04)]">
      <button
        className="flex w-full min-w-0 gap-3 border-0 bg-transparent p-0 text-left"
        onClick={() => navigate(`/course/${course.id}`)}
        type="button"
      >
        <img
          alt=""
          className="h-[92px] w-[92px] flex-none rounded-xl object-cover"
          src={course.imageUrl}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start gap-2">
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-black text-[#6B756E]">
                {course.area} · {course.dayLabel}
              </span>
              <strong className="mt-1 line-clamp-2 block text-[1.02rem] leading-tight font-black text-[#171717]">
                {course.title}
              </strong>
            </span>
          </span>
          <span className="mt-2 line-clamp-2 block text-sm leading-snug font-semibold text-[#746F67]">
            {course.note}
          </span>
          <span className="mt-2 flex flex-wrap gap-1.5 text-xs font-black text-[#8B857C]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              <MapPin size={12} />
              {course.stops.length}곳
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F3EF] px-2 py-1">
              <Clock3 size={12} />
              {course.transport}
            </span>
          </span>
        </span>
      </button>
      <MiniRoute stops={course.stops} />
    </article>
  );
}

export function CoursePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeStatus, setActiveStatus] = useState<CourseStatus>("planning");
  const [sheetStep, setSheetStep] = useState<"choose" | "ai">("choose");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const isCreateOpen = searchParams.get("create") === "1";
  const visibleCourses = courseSummaries.filter(
    (course) => course.status === activeStatus,
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
    <section className="min-h-screen overflow-x-hidden bg-white px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[2rem] leading-tight font-black">
            내 여행
          </h1>
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
            {courseSummaries.filter((course) => course.status === "planning").length}
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
            {courseSummaries.filter((course) => course.status === "recommended").length}
          </strong>
        </div>
      </div>

      <button
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#E6E1D8] bg-white p-3.5 text-left"
        onClick={openCreateSheet}
        type="button"
      >
        <span className="grid size-11 flex-none place-items-center rounded-xl bg-[#F4F3EF] text-[#1F3D35]">
          <CalendarDays size={21} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-black text-[#171717]">
            새 하루 코스 만들기
          </strong>
        </span>
        <ChevronRight size={19} className="text-[#AAA49B]" />
      </button>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            className={`h-10 flex-1 rounded-full border px-4 text-sm font-black transition-colors ${
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
        {visibleCourses.length > 0 ? (
          visibleCourses.map((course) => (
            <CourseSummaryCard course={course} key={course.id} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#D8D3C9] bg-white p-5 text-center">
            <p className="m-0 text-sm font-black text-[#514D47]">
              아직 표시할 여행이 없어요.
            </p>
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={isCreateOpen}
        onClose={closeCreateSheet}
        title={sheetStep === "choose" ? "어떻게 시작할까요?" : "여행 취향을 알려주세요"}
      >
        {sheetStep === "choose" ? (
          <div className="grid gap-3">
            <button
              className="flex items-center gap-3 rounded-xl border border-[#EEEAE2] bg-white p-4 text-left"
              onClick={() => navigate("/course/new")}
              type="button"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-[#F4F3EF] text-[#222]">
                <CalendarDays size={22} />
              </span>
              <span className="flex-1">
                <strong className="block font-black">직접 만들기</strong>
              </span>
              <ChevronRight size={19} className="text-[#aaa]" />
            </button>

            <button
              className="flex items-center gap-3 rounded-xl border border-[#DDE5DD] bg-[#F6FAF6] p-4 text-left"
              onClick={() => setSheetStep("ai")}
              type="button"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-[#1F3D35] text-white">
                <Sparkles size={22} />
              </span>
              <span className="flex-1">
                <strong className="block font-black text-[#222]">
                  AI 추천받기
                </strong>
              </span>
              <ChevronRight size={19} className="text-[#1F3D35]" />
            </button>
          </div>
        ) : (
          <>
            <div>
              <h3 className="mb-2.5 text-sm font-black">어디로 떠날까요?</h3>
              <div className="flex flex-wrap gap-2">
                {regions.map((region) => (
                  <button
                    className={`rounded-full border px-3.5 py-2 text-sm font-black ${
                      selectedRegion === region
                        ? "border-[#1F3D35] bg-[#EEF6F0] text-[#1F3D35]"
                        : "border-[#E6E1D8] bg-white text-[#77716A]"
                    }`}
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    type="button"
                  >
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
                      onClick={() => toggleStyle(style)}
                      type="button"
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
              disabled={!selectedRegion || selectedStyles.length === 0}
              onClick={() => {
                const params = new URLSearchParams({
                  mode: "ai",
                  region: selectedRegion,
                  styles: selectedStyles.join(","),
                });
                navigate(`/course/new?${params.toString()}`);
              }}
              type="button"
            >
              AI 코스 추천받기
            </button>
          </>
        )}
      </BottomSheet>
    </section>
  );
}
