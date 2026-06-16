import {
  CalendarDays,
  Check,
  ChevronRight,
  MapPin,
  MoreHorizontal,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type TripPlan = {
  id: string;
  title: string;
  dates: string;
  cityCount: number;
  imageUrl: string;
};

const upcomingTrips: TripPlan[] = [
  {
    id: "upcoming-1",
    title: "강릉·속초 여행",
    dates: "2026. 6. 20 - 6. 22",
    cityCount: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=320&q=80",
  },
];

const pastTrips: TripPlan[] = [
  {
    id: "past-1",
    title: "서울 골목 여행",
    dates: "2026. 4. 12 - 4. 13",
    cityCount: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=320&q=80",
  },
  {
    id: "past-2",
    title: "부산 바다 여행",
    dates: "2025. 12. 24 - 12. 26",
    cityCount: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?auto=format&fit=crop&w=320&q=80",
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

function TripList({
  title,
  trips,
}: {
  title: string;
  trips: TripPlan[];
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[1.05rem] font-black text-[#222]">{title}</h2>
      <div className="grid gap-3">
        {trips.map((trip) => (
          <article
            className="flex items-center gap-3 rounded-2xl border border-[#eee] bg-white p-3"
            key={trip.id}
          >
            <img
              className="h-[78px] w-[78px] flex-none rounded-2xl object-cover"
              src={trip.imageUrl}
              alt=""
            />
            <div className="min-w-0 flex-1">
              <h3 className="m-0 truncate text-base font-black text-[#222]">
                {trip.title}
              </h3>
              <p className="mt-1 mb-0 text-sm font-medium text-[#777]">
                {trip.dates}
              </p>
              <p className="mt-1 mb-0 text-xs font-bold text-[#aaa]">
                {trip.cityCount}개 도시
              </p>
            </div>
            <button
              className="grid h-10 w-10 flex-none place-items-center rounded-full border-0 bg-transparent text-[#777]"
              type="button"
              aria-label={`${trip.title} 메뉴`}
            >
              <MoreHorizontal size={22} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetStep, setSheetStep] = useState<"choose" | "ai">("choose");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const isCreateOpen = searchParams.get("create") === "1";

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
    <section className="min-h-screen bg-white px-5 pt-[calc(26px+env(safe-area-inset-top))] pb-8 text-[#111]">
      <header>
        <p className="mb-2 text-xs font-black tracking-[0.08em] text-[#FF4300]">
          MY TRIP
        </p>
        <h1 className="m-0 text-[2rem] leading-tight font-black tracking-[-0.04em]">
          나의 여행 코스
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[#777]">
          다가오는 일정과 지난 여행을 한곳에서 관리해보세요.
        </p>
      </header>

      <button
        className="mt-7 flex w-full items-center gap-3 rounded-2xl border border-[#eee] bg-white p-4 text-left shadow-[0_8px_24px_rgba(17,17,17,0.05)]"
        type="button"
        onClick={openCreateSheet}
      >
        <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#FF4300] text-white shadow-[0_8px_18px_rgba(255,67,0,0.2)]">
          <Plus size={24} strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-base font-black text-[#222]">
            여행 일정 만들기
          </strong>
          <small className="mt-1 block text-sm font-medium text-[#888]">
            새로운 여행 코스를 계획해보세요.
          </small>
        </span>
        <ChevronRight size={20} className="text-[#aaa]" />
      </button>

      <TripList title="다가오는 여행" trips={upcomingTrips} />
      <TripList title="지난 여행" trips={pastTrips} />

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
              className="w-full max-w-[430px] rounded-t-[28px] bg-white px-5 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-[0_-20px_50px_rgba(0,0,0,0.18)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
              aria-modal="true"
              role="dialog"
              aria-label="일정 생성"
            >
              <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#ddd]" />

              {sheetStep === "choose" ? (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-xs font-black text-[#FF4300]">
                        일정 생성
                      </p>
                      <h2 className="m-0 text-xl font-black">
                        어떻게 만들까요?
                      </h2>
                    </div>
                    <button
                      className="grid h-9 w-9 place-items-center rounded-full border-0 bg-[#f5f5f5]"
                      type="button"
                      onClick={closeCreateSheet}
                      aria-label="닫기"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <button
                      className="flex items-center gap-3 rounded-2xl border border-[#eee] bg-white p-4 text-left"
                      type="button"
                      onClick={() => navigate("/course/new")}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5f5f5] text-[#222]">
                        <CalendarDays size={22} />
                      </span>
                      <span className="flex-1">
                        <strong className="block font-black">
                          직접 일정 만들기
                        </strong>
                        <small className="mt-1 block text-xs font-medium text-[#888]">
                          날짜와 장소를 직접 골라 계획해요.
                        </small>
                      </span>
                      <ChevronRight size={19} className="text-[#aaa]" />
                    </button>

                    <button
                      className="flex items-center gap-3 rounded-2xl border border-[#ffd7c8] bg-[#fff8f5] p-4 text-left"
                      type="button"
                      onClick={() => setSheetStep("ai")}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FF4300] text-white">
                        <Sparkles size={22} />
                      </span>
                      <span className="flex-1">
                        <strong className="block font-black text-[#222]">
                          AI 일정 추천받기
                        </strong>
                        <small className="mt-1 block text-xs font-medium text-[#888]">
                          취향과 지역에 맞춰 코스를 추천해요.
                        </small>
                      </span>
                      <ChevronRight size={19} className="text-[#FF4300]" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="mb-1 text-xs font-black text-[#FF4300]">
                        AI 일정 추천
                      </p>
                      <h2 className="m-0 text-xl font-black">
                        여행 취향을 알려주세요
                      </h2>
                    </div>
                    <button
                      className="grid h-9 w-9 place-items-center rounded-full border-0 bg-[#f5f5f5]"
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
                              ? "border-[#FF4300] bg-[#fff0eb] text-[#FF4300]"
                              : "border-[#e8e8e8] bg-white text-[#777]"
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
                                ? "border-[#FF4300] bg-[#FF4300] text-white"
                                : "border-[#e8e8e8] bg-white text-[#777]"
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
                    className="mt-7 min-h-13 w-full rounded-2xl border-0 bg-[#FF4300] font-black text-white shadow-[0_10px_24px_rgba(255,67,0,0.2)] disabled:bg-[#eee] disabled:text-[#aaa] disabled:shadow-none"
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
