import {
  type SavedCourse,
  type SavedCourseStop,
} from "@/features/course/courseStorage";
import {
  createCourse,
  generateAiCourse,
  type CourseCreateRequest,
  type CourseItemRequest,
  type AiCourseCompanion,
  type AiCourseTheme,
  type AiCoursePace,
} from "@/features/course/courseApi";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton } from "@/shared/ui/Skeleton";

type DirectStop = { id: number; name: string };

const neighborhoods = [
  "망원동",
  "성수동",
  "연남동",
  "서촌",
  "을지로",
  "익선동",
  "해방촌",
  "잠실",
];
const companions = ["혼자", "친구와", "연인과", "아이와", "부모님과", "반려동물과"];
const travelStyles = [
  "동네 맛집",
  "감성 카페",
  "로컬 산책",
  "문화·전시",
  "자연 속 휴식",
  "사진 명소",
  "시장·골목",
  "쇼핑",
];
const paces = [
  { value: "여유롭게", description: "3곳 안팎, 오래 머무는 일정" },
  { value: "알맞게", description: "4곳 안팎, 걷고 쉬는 균형 일정" },
  { value: "알차게", description: "5곳 안팎, 동네를 꽉 채운 일정" },
];

function toCourseCreateRequest(course: SavedCourse): CourseCreateRequest | null {
  const items = course.stops.flatMap<CourseItemRequest>((stop, index) => {
    if (stop.attractionId) {
      return [{
        attractionId: stop.attractionId,
        day: 1,
        itemType: "ATTRACTION" as const,
        memo: stop.description,
        position: index + 1,
        stayMinutes: 60,
      }];
    }
    if (stop.noteId) {
      return [{
        day: 1,
        itemType: "NOTE" as const,
        memo: stop.description,
        noteId: stop.noteId,
        position: index + 1,
        stayMinutes: 60,
      }];
    }
    return [];
  });

  if (items.length < 2) return null;

  return {
    coverImageUrl: course.stops[0]?.imageUrl,
    description: `${course.companion} · ${course.styles.join(" · ")} · ${course.pace}`,
    id: course.id,
    items,
    regionName: course.area,
    status: "READY",
    title: course.title,
    visibility: "PRIVATE",
  };
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative min-h-16 rounded-2xl border px-3 text-[0.95rem] font-black transition-all ${
        selected
          ? "border-[#1F3D35] bg-[#1F3D35] text-white shadow-[0_8px_20px_rgba(31,61,53,0.16)]"
          : "border-[#ECE8E1] bg-[#FAF9F7] text-[#69645E]"
      }`}
      onClick={onClick}
      type="button"
    >
      {selected ? <Check className="absolute top-2 right-2" size={14} /> : null}
      {label}
    </button>
  );
}

function AiCourseCreator() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [area, setArea] = useState("");
  const [companion, setCompanion] = useState("");
  const [styles, setStyles] = useState<string[]>([]);
  const [pace, setPace] = useState("");
  const [phase, setPhase] = useState<"questions" | "loading" | "result">("questions");
  const [version, setVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [recommendation, setRecommendation] = useState<SavedCourse | null>(null);
  const aiRequestIdRef = useRef(0);

  async function requestAiCourse(requestVersion: number) {
    const requestId = aiRequestIdRef.current + 1;
    aiRequestIdRef.current = requestId;
    setPhase("loading");

    const neighborhoodToGugunCode: Record<string, number> = {
      "망원동": 14,
      "성수동": 4,
      "연남동": 14,
      "서촌": 1,
      "을지로": 2,
      "익선동": 1,
      "해방촌": 3,
      "잠실": 24,
    };

    const companionMap: Record<string, AiCourseCompanion> = {
      "혼자": "ALONE",
      "친구와": "WITH_FRIEND",
      "연인과": "WITH_PARTNER",
      "아이와": "WITH_CHILD",
      "부모님과": "WITH_PARENTS",
      "반려동물과": "WITH_PET",
    };

    const themeMap: Record<string, AiCourseTheme> = {
      "동네 맛집": "FOOD",
      "감성 카페": "CAFE",
      "로컬 산책": "WALK",
      "문화·전시": "CULTURE",
      "자연 속 휴식": "NATURE",
      "사진 명소": "PHOTO",
      "시장·골목": "MARKET",
      "쇼핑": "SHOPPING",
    };

    const paceMap: Record<string, AiCoursePace> = {
      "여유롭게": "RELAXED",
      "알맞게": "MODERATE",
      "알차게": "PACKED",
    };

    const gugun = neighborhoodToGugunCode[area];
    const comp = companionMap[companion] ?? "ALONE";
    const selectedThemes = styles.map((s) => themeMap[s]).filter(Boolean) as AiCourseTheme[];
    const selectedPace = paceMap[pace] ?? "MODERATE";

    try {
      setSaveNotice("");
      const response = await generateAiCourse({
        sidoCode: 1,
        gugunCode: gugun,
        companion: comp,
        themes: selectedThemes.length > 0 ? selectedThemes : ["WALK"],
        pace: selectedPace,
      });

      if (aiRequestIdRef.current !== requestId) return;

      const stops: SavedCourseStop[] = response.stops.map((stop, index) => ({
        id: index + 1,
        attractionId: stop.attractionId,
        title: stop.title,
        category: stop.addr1 ? stop.addr1.split(" ").slice(0, 2).join(" ") : "관광지",
        description: stop.addr1 ?? "",
        imageUrl: stop.firstImage || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80",
        lat: 0,
        lng: 0,
      }));

      setRecommendation({
        id: `ai-${Date.now()}-${requestVersion}`,
        title: response.title || `${area} AI 추천 코스`,
        area,
        companion,
        styles,
        pace,
        savedAt: new Date().toISOString(),
        collaborators: [],
        stops,
      });
      setPhase("result");
    } catch (error) {
      if (aiRequestIdRef.current !== requestId) return;
      console.error("AI course generation failed", error);
      setSaveNotice("AI 코스 생성에 실패했습니다. 다시 시도해 주세요.");
      setPhase("questions");
    }
  }

  const selections = [Boolean(area), Boolean(companion), styles.length > 0, Boolean(pace)];
  const stepContent = [
    { emoji: "📍", title: "떠나고 싶은 서울 동네는?", description: "하루 동안 천천히 둘러볼 동네를 골라주세요.", values: neighborhoods },
    { emoji: "🫶", title: "누구와 떠나나요?", description: "일행에 잘 맞는 장소와 이동 속도를 추천해요.", values: companions },
    { emoji: "✨", title: "어떤 하루를 보내고 싶나요?", description: "좋아하는 취향을 여러 개 골라도 좋아요.", values: travelStyles },
  ];

  function chooseValue(value: string) {
    if (step === 0) setArea(value);
    if (step === 1) setCompanion(value);
    if (step === 2) {
      setStyles((current) =>
        current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      );
    }
  }

  function goBack() {
    if (step === 0) navigate(-1);
    else setStep((current) => current - 1);
  }

  function reset() {
    aiRequestIdRef.current += 1;
    setArea("");
    setCompanion("");
    setStyles([]);
    setPace("");
    setVersion(0);
    setStep(0);
    setRecommendation(null);
    setPhase("questions");
  }

  async function saveRecommendation() {
    if (isSaving || !recommendation) return;

    setIsSaving(true);
    setSaveNotice("");
    const request = toCourseCreateRequest(recommendation);

    if (!request) {
      setSaveNotice("서버에 저장할 실제 장소 ID가 부족해요.");
      setIsSaving(false);
      return;
    }

    try {
      const course = await createCourse(request);
      navigate(`/course/${course.id}`);
    } catch {
      setSaveNotice("코스를 서버에 저장하지 못했어요. 로그인 상태를 확인해 주세요.");
      setIsSaving(false);
    }
  }

  if (phase === "loading") {
    return (
      <section className="fixed inset-0 z-50 mx-auto w-full max-w-[430px] overflow-hidden bg-[#F8F6F1] px-5 text-center text-[#171717]">
        <div className="pt-[calc(54px+env(safe-area-inset-top))]">
          <div className="relative mx-auto grid size-28 place-items-center rounded-full bg-white shadow-[0_18px_50px_rgba(31,61,53,0.12)]">
            <LoaderCircle className="animate-spin text-[#1F3D35]" size={58} strokeWidth={1.7} />
            <MapPin className="absolute text-[#FD4003]" size={26} fill="#FD4003" />
          </div>
          <h1 className="mt-8 mb-0 text-3xl font-black tracking-tighter">추천 코스를 만들고 있어요</h1>
          <p className="mt-3 text-sm leading-relaxed font-bold text-[#817B73]">
            {area}의 장소들을 살펴보고<br />{companion} 걷기 좋은 순서로 정리하는 중이에요.
          </p>
          <div className="mx-auto mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-[#E7E2D9]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#FD4003]" />
          </div>
        </div>
        <div className="mt-10 rounded-[26px] bg-white p-4 text-left shadow-[0_14px_34px_rgba(31,38,35,0.08)]">
          <Skeleton className="h-5 w-36 rounded-full" />
          <div className="relative mt-4 h-36 overflow-hidden rounded-[22px] bg-[#DCE9DF]">
            <Skeleton className="absolute top-6 left-6 size-9 rounded-full bg-white/70" />
            <Skeleton className="absolute top-1/2 left-1/3 h-2 w-28 rounded-full bg-white/60" />
            <Skeleton className="absolute right-8 bottom-8 size-9 rounded-full bg-white/70" />
          </div>
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="flex items-center gap-3" key={index}>
                <Skeleton className="size-16 flex-none rounded-xl" />
                <span className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="mt-2 h-3 w-full rounded-full" />
                  <Skeleton className="mt-2 h-3 w-2/3 rounded-full" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (phase === "result") {
    if (!recommendation) return null;
    return (
      <section className="fixed inset-0 z-50 mx-auto w-full max-w-[430px] overflow-y-auto bg-[#F7F5F0] pb-[calc(28px+env(safe-area-inset-bottom))] text-[#171717]">
        <header className="flex items-center justify-between px-5 pt-[calc(18px+env(safe-area-inset-top))]">
          <button aria-label="닫기" className="grid size-10 place-items-center rounded-full border-0 bg-white" onClick={() => navigate("/course")} type="button"><X size={22} /></button>
          <span className="rounded-full bg-[#EAF2EC] px-3 py-1.5 text-xs font-black text-[#1F3D35]">AI 추천 완성</span>
          <span className="size-10" />
        </header>

        <div className="px-5 pt-7 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#1F3D35] text-white shadow-[0_12px_28px_rgba(31,61,53,0.18)]"><Sparkles size={29} /></div>
          <p className="mt-5 mb-1 text-sm font-black text-[#FD4003]">{companion} · {pace}</p>
          <h1 className="m-0 text-[2rem] leading-tight font-black tracking-tighter">{recommendation.title}</h1>
          <p className="mt-2 text-sm font-bold text-[#817B73]">지금의 취향으로 고른 {recommendation.stops.length}곳을 소개할게요.</p>
        </div>

        <div className="relative mx-5 mt-7 h-44 overflow-hidden rounded-[24px] bg-[#DCE9DF]">
          <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(32deg, transparent 46%, white 47%, white 51%, transparent 52%), linear-gradient(145deg, transparent 42%, #B8D4C0 43%, #B8D4C0 48%, transparent 49%)", backgroundSize: "90px 90px, 130px 130px" }} />
          <div className="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-[#75877A]" />
          {recommendation.stops.map((stop, index) => (
            <span className="absolute grid size-9 place-items-center rounded-full border-4 border-white bg-[#FD4003] text-xs font-black text-white shadow-md" key={stop.id} style={{ left: `${12 + index * (72 / Math.max(recommendation.stops.length - 1, 1))}%`, top: `${index % 2 === 0 ? 36 : 57}%` }}>{index + 1}</span>
          ))}
          <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-[#4E5D53]">{area} 하루 동선</span>
        </div>

        <div className="mx-5 mt-4 grid gap-3">
          {recommendation.stops.map((stop, index) => (
            <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(34,34,34,0.05)]" key={stop.id}>
              <img alt="" className="size-20 flex-none rounded-xl object-cover" src={stop.imageUrl} />
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-center gap-2"><span className="grid size-6 flex-none place-items-center rounded-full bg-[#FD4003] text-[11px] font-black text-white">{index + 1}</span><strong className="truncate text-[0.98rem] font-black">{stop.title}</strong></div>
                <p className="mt-1 mb-0 text-xs font-black text-[#8A847D]">{stop.category}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed font-semibold text-[#716C65]">{stop.description}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mx-5 mt-8 rounded-[26px] bg-white p-5 text-center shadow-[0_10px_30px_rgba(31,38,35,0.06)]">
          <div className="text-3xl">💚</div>
          <h2 className="mt-2 mb-0 text-xl font-black">이 코스가 마음에 드나요?</h2>
          <p className="mt-2 text-sm font-semibold text-[#817B73]">담아두면 내 코스에서 언제든 편집하고 친구와 함께 볼 수 있어요.</p>
          {saveNotice ? <p className="mt-3 mb-0 rounded-xl bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#A04A14]">{saveNotice}</p> : null}
          <button className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#AAB8AE]" disabled={isSaving} onClick={saveRecommendation} type="button"><Plus size={20} />{isSaving ? "담는 중..." : "내 코스에 담기"}</button>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-0 bg-[#F2F0EB] text-sm font-black text-[#55504A]" onClick={() => { const nextVersion = version + 1; setVersion(nextVersion); void requestAiCourse(nextVersion); }} type="button"><RefreshCw size={17} />새로운 추천</button>
            <button className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-0 bg-[#F2F0EB] text-sm font-black text-[#55504A]" onClick={reset} type="button"><RotateCcw size={17} />처음부터</button>
          </div>
        </div>
      </section>
    );
  }

  const current = stepContent[step];
  return (
    <section className="fixed inset-0 z-50 mx-auto flex w-full max-w-[430px] flex-col overflow-y-auto bg-white px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] text-[#171717]">
      <header className="flex items-center justify-between">
        <button aria-label="이전" className="grid size-10 place-items-center rounded-full border-0 bg-[#F5F3EF]" onClick={goBack} type="button"><ArrowLeft size={22} /></button>
        <div className="flex gap-1.5">{[0, 1, 2, 3].map((item) => <span className={`h-1.5 rounded-full transition-all ${item === step ? "w-8 bg-[#FD4003]" : item < step ? "w-4 bg-[#1F3D35]" : "w-4 bg-[#E7E3DC]"}`} key={item} />)}</div>
        <span className="text-sm font-black text-[#FD4003]">{step + 1}/4</span>
      </header>

      <main className="flex-1 pt-14">
        {step < 3 && current ? (
          <>
            <div className="text-center"><span className="text-5xl">{current.emoji}</span><h1 className="mt-5 mb-0 text-[1.8rem] leading-tight font-black tracking-[-0.05em]">{current.title}</h1><p className="mt-2 text-sm font-bold text-[#9A958E]">{current.description}</p></div>
            <div className="mt-10 grid grid-cols-2 gap-3">{current.values.map((value) => <ChoiceButton key={value} label={value} selected={step === 0 ? area === value : step === 1 ? companion === value : styles.includes(value)} onClick={() => chooseValue(value)} />)}</div>
          </>
        ) : (
          <>
            <div className="text-center"><span className="text-5xl">🗺️</span><h1 className="mt-5 mb-0 text-[1.8rem] leading-tight font-black tracking-[-0.05em]">어떤 속도로 둘러볼까요?</h1><p className="mt-2 text-sm font-bold text-[#9A958E]">머무는 시간과 장소 수를 조절할게요.</p></div>
            <div className="mt-10 grid gap-3">{paces.map((item) => <button className={`flex min-h-20 items-center rounded-2xl border px-5 text-left ${pace === item.value ? "border-[#1F3D35] bg-[#EEF4EF]" : "border-[#ECE8E1] bg-[#FAF9F7]"}`} key={item.value} onClick={() => setPace(item.value)} type="button"><span className="min-w-0 flex-1"><strong className="block font-black text-[#282622]">{item.value}</strong><span className="mt-1 block text-xs font-bold text-[#928C84]">{item.description}</span></span>{pace === item.value ? <span className="grid size-7 place-items-center rounded-full bg-[#1F3D35] text-white"><Check size={15} /></span> : null}</button>)}</div>
          </>
        )}
      </main>

      <button className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#E8E5DF] disabled:text-[#AAA49C]" disabled={!selections[step]} onClick={() => step < 3 ? setStep(step + 1) : void requestAiCourse(version)} type="button">{step === 3 ? <><WandSparkles size={20} />내 코스 추천받기</> : <>다음<ArrowRight size={19} /></>}</button>
    </section>
  );
}

function DirectCourseCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlace = searchParams.get("place")?.trim() ?? "";
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [stops, setStops] = useState<DirectStop[]>(initialPlace ? [{ id: Date.now(), name: initialPlace }] : []);
  const [newStop, setNewStop] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function addStop() {
    if (!newStop.trim()) return;
    setStops((current) => [...current, { id: Date.now(), name: newStop.trim() }]);
    setNewStop("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    try {
      setIsSaving(true);
      setSaveError("");
      const course = await createCourse({
        description: date || undefined,
        id: `direct-${Date.now()}`,
        items: [],
        status: "DRAFT",
        title: trimmedTitle,
        visibility: "PRIVATE",
      });
      navigate(`/course/${course.id}`);
    } catch {
      setSaveError("코스를 서버에 저장하지 못했어요. 로그인 상태를 확인해 주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="min-h-screen bg-white px-5 pt-[calc(20px+env(safe-area-inset-top))] pb-8 text-[#111]">
      <header className="flex items-center gap-3"><button aria-label="뒤로 가기" className="grid size-10 place-items-center rounded-full border-0 bg-[#F5F3EF]" onClick={() => navigate(-1)} type="button"><ArrowLeft size={21} /></button><div><h1 className="m-0 text-[1.65rem] font-extrabold">여행 일정 만들기</h1></div></header>
      <form className="mt-8 grid gap-6" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-black">코스 이름<input className="min-h-13 rounded-2xl border border-[#E5E1DA] px-4 font-semibold outline-none focus:border-[#1F3D35]" onChange={(event) => setTitle(event.target.value)} placeholder="여행 코스 이름" value={title} /></label>
        <label className="grid gap-2 text-sm font-black">여행 날짜<span className="relative"><CalendarDays className="absolute top-1/2 left-3 -translate-y-1/2 text-[#999]" size={17} /><input className="min-h-13 w-full rounded-2xl border border-[#E5E1DA] pl-10 font-semibold" onChange={(event) => setDate(event.target.value)} type="date" value={date} /></span></label>
        <div><div className="flex items-center justify-between"><strong className="text-sm">방문 장소</strong><span className="text-xs font-black text-[#FD4003]">{stops.length}곳</span></div><div className="mt-3 grid gap-2">{stops.map((stop, index) => <div className="flex min-h-13 items-center gap-3 rounded-2xl border border-[#EEEAE3] px-3" key={stop.id}><span className="grid size-7 place-items-center rounded-full bg-[#FFF0EA] text-xs font-black text-[#FD4003]">{index + 1}</span><span className="flex-1 text-sm font-black">{stop.name}</span><button aria-label={`${stop.name} 삭제`} className="grid size-8 place-items-center rounded-full border-0 bg-[#F5F3EF]" onClick={() => setStops((current) => current.filter((item) => item.id !== stop.id))} type="button"><X size={15} /></button></div>)}</div><div className="mt-3 flex gap-2"><input className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[#E5E1DA] px-4 text-sm font-semibold" onChange={(event) => setNewStop(event.target.value)} placeholder="장소 이름 입력" value={newStop} /><button aria-label="장소 추가" className="grid size-12 place-items-center rounded-2xl border-0 bg-[#1F3D35] text-white" onClick={addStop} type="button"><Plus size={20} /></button></div></div>
        <button className="min-h-14 rounded-2xl border-0 bg-[#1F3D35] font-black text-white disabled:bg-[#E8E5DF]" disabled={!title.trim() || isSaving} type="submit">{isSaving ? "저장 중..." : "코스 저장하기"}</button>
        {saveError ? <p className="m-0 rounded-xl bg-[#FFF0EE] px-3 py-2 text-xs font-bold text-[#D5483D]">{saveError}</p> : null}
      </form>
    </section>
  );
}

export function CreateCoursePage() {
  const [searchParams] = useSearchParams();
  return searchParams.get("mode") === "ai" ? <AiCourseCreator /> : <DirectCourseCreator />;
}
