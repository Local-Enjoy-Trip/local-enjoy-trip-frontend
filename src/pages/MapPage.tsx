import { useQuery } from "@tanstack/react-query";
import { LocateFixed, Shuffle } from "lucide-react";
import { useMemo } from "react";
import { getMapPins } from "@/shared/api/mockApi";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import { categoryLabels, visibilityLabels } from "@/shared/lib/labels";
import { useMapStore } from "@/features/map/mapStore";

const filters = [
  { value: "all", label: "전체" },
  { value: "place", label: "장소" },
  { value: "note", label: "쪽지" },
  { value: "friend", label: "친구" },
  { value: "saved", label: "저장됨" },
] as const;

export function MapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["map-pins"],
    queryFn: getMapPins,
  });
  const { filter, selectedPinId, setFilter, selectPin } = useMapStore();
  const location = useCurrentLocation();

  const selected = useMemo(() => {
    if (!data || !selectedPinId) return null;
    return (
      data.places.find((place) => place.id === selectedPinId) ??
      data.notes.find((note) => note.id === selectedPinId) ??
      null
    );
  }, [data, selectedPinId]);

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        지도를 준비하는 중...
      </div>
    );
  }

  const visiblePlaces = data.places.filter((place) => {
    if (filter === "all" || filter === "place") return true;
    return filter === "saved" && place.saved;
  });

  const visibleNotes = data.notes.filter((note) => {
    if (filter === "all" || filter === "note") return true;
    if (filter === "friend") return note.visibility === "friends";
    return filter === "saved" && note.saved;
  });

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#dce9e2]">
      <header className="flex items-start justify-between gap-3.5 px-[18px] py-[22px] pb-3.5">
        <div>
          <p className="mb-2 text-xs font-extrabold text-[#69746e]">
            망원 · 성수
          </p>
          <h1 className="m-0 text-[2rem] leading-tight font-extrabold">
            동네 지도
          </h1>
        </div>
        <button
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border-0 bg-[#e5f0e9] px-3 font-extrabold text-[#245145]"
          onClick={location.requestLocation}
          type="button"
        >
          <LocateFixed size={20} />
        </button>
      </header>

      <div
        className="flex gap-2 overflow-x-auto px-3.5 pb-3"
        role="tablist"
        aria-label="지도 필터"
      >
        {filters.map((item) => (
          <button
            className={`min-h-9 flex-none rounded-full border border-black/10 px-3.5 text-sm font-extrabold ${
              filter === item.value
                ? "bg-[#116149] text-[#fffaf0]"
                : "bg-[#fffaf0]/90 text-[#625d54]"
            }`}
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="relative h-[calc(100vh-285px)] min-h-[430px] overflow-hidden bg-[#dbe7df]"
        aria-label="지도 미리보기"
      >
        <div className="mock-map-grid" />
        {visiblePlaces.map((place, index) => (
          <button
            className={`absolute min-h-[34px] rounded-full border-0 bg-[#116149] px-2.5 text-xs font-black text-[#fffaf0] shadow-[0_8px_18px_rgba(36,35,31,0.18)] ${
              index === 0
                ? "top-[28%] left-[13%]"
                : index === 1
                  ? "top-1/2 left-[53%]"
                  : "top-[19%] right-[13%]"
            }`}
            key={place.id}
            onClick={() => selectPin(place.id)}
            type="button"
          >
            {place.name}
          </button>
        ))}
        {visibleNotes.map((note, index) => (
          <button
            className={`absolute min-h-[34px] rounded-full border-0 bg-[#f6d46b] px-2.5 text-xs font-black text-[#513e12] shadow-[0_8px_18px_rgba(36,35,31,0.18)] ${
              index === 0
                ? "top-[42%] left-[24%]"
                : index === 1
                  ? "top-[63%] right-[20%]"
                  : "top-[34%] right-[36%]"
            }`}
            key={note.id}
            onClick={() => selectPin(note.id)}
            type="button"
          >
            쪽지
          </button>
        ))}
        <button
          className="absolute right-4 bottom-[22px] inline-flex min-h-[42px] items-center gap-2 rounded-full border-0 bg-[#24231f] px-3.5 text-sm font-black text-[#fffaf0]"
          type="button"
        >
          <Shuffle size={17} />
          근처 쪽지 뽑기
        </button>
      </div>

      {location.status === "error" ? (
        <p className="absolute right-4 bottom-[260px] left-4 m-0 rounded-lg bg-[#fffaf0]/95 px-3 py-2.5 text-sm font-extrabold text-[#24463d]">
          {location.error}
        </p>
      ) : null}
      {location.status === "success" ? (
        <p className="absolute right-4 bottom-[260px] left-4 m-0 rounded-lg bg-[#fffaf0]/95 px-3 py-2.5 text-sm font-extrabold text-[#24463d]">
          현재 위치 기준으로 볼 수 있어요.
        </p>
      ) : null}

      <aside className="fixed inset-x-0 bottom-[calc(77px+env(safe-area-inset-bottom))] z-20 mx-auto min-h-[172px] w-full max-w-[430px] rounded-t-[18px] bg-[#fffaf0] p-[18px] shadow-[0_-12px_30px_rgba(36,35,31,0.14)] sm:border-x sm:border-black/10">
        {selected ? (
          "summary" in selected ? (
            <>
              <span className="text-xs font-black text-[#116149]">
                {selected.area}
              </span>
              <h2 className="mt-2 mb-2 text-[1.18rem] font-extrabold">
                {selected.name}
              </h2>
              <p className="m-0 leading-normal text-[#625d54]">
                {selected.summary}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span
                    className="rounded-full bg-[#e5f0e9] px-2.5 py-1.5 text-xs font-extrabold text-[#245145]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#116149] font-black text-[#fffaf0]"
                type="button"
              >
                보관함에 저장
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-black text-[#116149]">
                {categoryLabels[selected.category]}
              </span>
              <h2 className="mt-2 mb-2 text-[1.18rem] font-extrabold">
                {selected.placeName}
              </h2>
              <p className="m-0 leading-normal text-[#625d54]">
                {selected.body}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#e5f0e9] px-2.5 py-1.5 text-xs font-extrabold text-[#245145]">
                  {selected.authorName}
                </span>
                <span className="rounded-full bg-[#e5f0e9] px-2.5 py-1.5 text-xs font-extrabold text-[#245145]">
                  {visibilityLabels[selected.visibility]}
                </span>
              </div>
              <button
                className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-[#116149] font-black text-[#fffaf0]"
                type="button"
              >
                쪽지 저장
              </button>
            </>
          )
        ) : (
          <>
            <span className="text-xs font-black text-[#116149]">탐색 시작</span>
            <h2 className="mt-2 mb-2 text-[1.18rem] font-extrabold">
              핀을 눌러 장소와 쪽지를 확인하세요.
            </h2>
            <p className="m-0 leading-normal text-[#625d54]">
              백엔드 연결 전까지는 기획 흐름을 확인할 수 있는 mock 지도입니다.
            </p>
          </>
        )}
      </aside>
    </section>
  );
}
