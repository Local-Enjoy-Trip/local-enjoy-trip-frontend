import {
  ArrowLeft,
  CalendarDays,
  GripVertical,
  MapPin,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Stop = {
  id: number;
  name: string;
};

const aiStops: Stop[] = [
  { id: 1, name: "성수 연무장길" },
  { id: 2, name: "서울숲 산책로" },
  { id: 3, name: "뚝섬 한강공원" },
];

export function CreateCoursePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAiMode = searchParams.get("mode") === "ai";
  const initialPlace = searchParams.get("place")?.trim() ?? "";
  const recommendedRegion = searchParams.get("region") ?? "성수";
  const recommendedStyles = searchParams.get("styles")?.split(",") ?? [];
  const [title, setTitle] = useState(
    isAiMode ? `${recommendedRegion} 맞춤 여행 코스` : "",
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stops, setStops] = useState<Stop[]>(() =>
    isAiMode
      ? aiStops
      : initialPlace
        ? [{ id: Date.now(), name: initialPlace }]
        : [],
  );
  const [newStop, setNewStop] = useState("");

  function addStop() {
    const trimmedStop = newStop.trim();

    if (!trimmedStop) {
      return;
    }

    setStops((current) => [
      ...current,
      { id: Date.now(), name: trimmedStop },
    ]);
    setNewStop("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.alert("백엔드 연결 후 코스가 저장됩니다.");
    navigate("/course");
  }

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-8 text-[#111]">
      <header className="flex items-center gap-3">
        <button
          className="grid h-10 w-10 flex-none place-items-center rounded-full border-0 bg-[#f5f5f5]"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <p className="mb-1 text-xs font-black text-[#FF4300]">
            {isAiMode ? "AI 추천 코스" : "직접 만들기"}
          </p>
          <h1 className="m-0 text-[1.65rem] font-black tracking-[-0.04em]">
            여행 일정 만들기
          </h1>
        </div>
      </header>

      {isAiMode ? (
        <div className="mt-6 flex gap-3 rounded-2xl bg-[#fff5f1] p-4 text-[#222]">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-[#FF4300] text-white">
            <Sparkles size={20} />
          </span>
          <div>
            <strong className="text-sm font-black">
              선택한 취향으로 일정을 만들었어요
            </strong>
            <p className="mt-1 mb-0 text-xs leading-relaxed font-medium text-[#777]">
              {recommendedRegion}
              {recommendedStyles.length > 0
                ? ` · ${recommendedStyles.join(" · ")}`
                : ""}
              를 반영했어요. 장소를 추가하거나 순서를 바꿔 완성해보세요.
            </p>
          </div>
        </div>
      ) : null}

      <form className="mt-7 grid gap-7" onSubmit={handleSubmit}>
        <label className="grid gap-2.5 text-sm font-black">
          코스 이름
          <input
            className="min-h-13 rounded-2xl border border-[#e5e5e5] px-4 font-semibold outline-none focus:border-[#FF4300] focus:shadow-[0_0_0_3px_rgba(255,67,0,0.08)]"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="여행 코스 이름을 입력하세요"
          />
        </label>

        <fieldset className="m-0 border-0 p-0">
          <legend className="mb-2.5 text-sm font-black">여행 날짜</legend>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <label className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#999]"
                size={17}
              />
              <input
                className="min-h-13 w-full rounded-2xl border border-[#e5e5e5] pl-9 text-sm font-semibold outline-none focus:border-[#FF4300]"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <span className="text-[#aaa]">-</span>
            <label className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#999]"
                size={17}
              />
              <input
                className="min-h-13 w-full rounded-2xl border border-[#e5e5e5] pl-9 text-sm font-semibold outline-none focus:border-[#FF4300]"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <div>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="m-0 text-sm font-black">방문 장소</h2>
              <p className="mt-1 mb-0 text-xs font-medium text-[#888]">
                방문할 순서대로 장소를 추가하세요.
              </p>
            </div>
            <span className="text-xs font-black text-[#FF4300]">
              {stops.length}곳
            </span>
          </div>

          <div className="grid gap-2">
            {stops.map((stop, index) => (
              <div
                className="flex min-h-13 items-center gap-3 rounded-2xl border border-[#eee] bg-white px-3"
                key={stop.id}
              >
                <GripVertical size={18} className="text-[#bbb]" />
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff0eb] text-xs font-black text-[#FF4300]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-black">
                  {stop.name}
                </span>
                <button
                  className="grid h-8 w-8 place-items-center rounded-full border-0 bg-[#f7f7f7] text-[#999]"
                  type="button"
                  onClick={() =>
                    setStops((current) =>
                      current.filter((item) => item.id !== stop.id),
                    )
                  }
                  aria-label={`${stop.name} 삭제`}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <label className="relative min-w-0 flex-1">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#FF4300]"
                size={17}
              />
              <input
                className="min-h-12 w-full rounded-2xl border border-[#e5e5e5] pr-3 pl-9 text-sm font-semibold outline-none focus:border-[#FF4300]"
                value={newStop}
                onChange={(event) => setNewStop(event.target.value)}
                placeholder="장소 이름 입력"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addStop();
                  }
                }}
              />
            </label>
            <button
              className="grid h-12 w-12 flex-none place-items-center rounded-2xl border-0 bg-[#111] text-white disabled:bg-[#ddd]"
              type="button"
              onClick={addStop}
              disabled={!newStop.trim()}
              aria-label="장소 추가"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <button
          className="min-h-14 rounded-2xl border-0 bg-[#FF4300] font-black text-white shadow-[0_12px_26px_rgba(255,67,0,0.2)] disabled:bg-[#eee] disabled:text-[#aaa] disabled:shadow-none"
          type="submit"
          disabled={!title.trim() || stops.length === 0}
        >
          코스 저장하기
        </button>
      </form>
    </section>
  );
}
