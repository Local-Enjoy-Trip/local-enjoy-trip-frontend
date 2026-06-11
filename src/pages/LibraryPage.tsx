import { useQuery } from "@tanstack/react-query";
import { Map, Route } from "lucide-react";
import { getLibrary } from "@/shared/api/mockApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { visibilityLabels } from "@/shared/lib/labels";

export function LibraryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: getLibrary,
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        코스를 불러오는 중...
      </div>
    );
  }

  return (
    <section className="p-[22px_18px_28px]">
      <PageHeader
        eyebrow="나의 여행"
        title="코스"
        description="저장한 장소와 SPOT을 모아 여행 동선을 관리해보세요."
      />

      <div className="mt-6 mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.05rem] font-extrabold">저장한 장소</h2>
        <span className="text-sm font-extrabold text-[#116149]">
          {data.savedPlaces.length}
        </span>
      </div>
      <div className="grid gap-2.5">
        {data.savedPlaces.map((place) => (
          <article
            className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4"
            key={place.id}
          >
            <Map size={20} />
            <div>
              <h3 className="mb-1 text-base font-extrabold">{place.name}</h3>
              <p className="m-0 leading-normal text-[#6f6a60]">
                {place.summary}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.05rem] font-extrabold">저장한 쪽지</h2>
        <span className="text-sm font-extrabold text-[#116149]">
          {data.savedNotes.length}
        </span>
      </div>
      <div className="grid gap-2.5">
        {data.savedNotes.map((note) => (
          <article
            className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4"
            key={note.id}
          >
            <span className="h-5 w-5 flex-none rounded-full bg-[#f6d46b]" />
            <div>
              <h3 className="mb-1 text-base font-extrabold">
                {note.placeName}
              </h3>
              <p className="m-0 leading-normal text-[#6f6a60]">{note.body}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.05rem] font-extrabold">내 코스</h2>
        <button
          className="border-0 bg-transparent text-sm font-extrabold text-[#116149]"
          type="button"
        >
          새 코스
        </button>
      </div>
      <div className="grid gap-2.5">
        {data.courses.map((course) => (
          <article
            className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4"
            key={course.id}
          >
            <Route size={20} />
            <div>
              <h3 className="mb-1 text-base font-extrabold">{course.title}</h3>
              <p className="m-0 leading-normal text-[#6f6a60]">
                {course.area} · {course.stopCount}개 지점 ·{" "}
                {visibilityLabels[course.visibility]}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
