import { useQuery } from "@tanstack/react-query";
import courseLogoUrl from "@/assets/courseLogo.svg";
import {
  apiCourseToDiscovery,
  CourseDiscoveryCard,
  type CourseDiscoveryModel,
  savedCourseToDiscovery,
} from "@/features/course/components/CourseDiscoveryCard";
import {
  getCourseFeed,
  getMyCourses,
  type CourseResponse,
} from "@/features/course/courseApi";
import {
  getSavedCourses,
  saveCourse,
  type SavedCourse,
} from "@/features/course/courseStorage";
import {
  getNearbyHomeNotes,
  getPopularNearbyExperiences,
} from "@/features/home/homeApi";
import { ExperienceCard } from "@/features/home/components/ExperienceCard";
import { SpotNoteCard } from "@/features/home/components/SpotNoteCard";
import { notes, places } from "@/shared/data/mockData";
import type { Experience } from "@/shared/types/domain";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  CalendarDays,
  ChevronRight,
  Heart,
  MapPinned,
  Menu,
  Plus,
  Sparkles,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const fallbackCoordinates = { lat: 37.5568, lng: 126.9019 };
const savedPlaces = places.filter((place) => place.saved);
const savedNotes = notes.filter((note) => note.saved);

export function CoursePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedCourses, setSavedCourses] = useState(() => getSavedCourses());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"choice" | "direct">("choice");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [dateUndecided, setDateUndecided] = useState(false);
  const [isAtPageTop, setIsAtPageTop] = useState(true);
  const [isTripPanelOpen, setIsTripPanelOpen] = useState(false);

  const myCoursesQuery = useQuery({
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    retry: 1,
  });
  const apiCourses = useMemo(() => myCoursesQuery.data ?? [], [myCoursesQuery.data]);
  const latestTrip = useMemo(
    () => getNextTrip(apiCourses, savedCourses),
    [apiCourses, savedCourses],
  );
  const tripCoordinates = latestTrip.coordinates;
  const tripArea = latestTrip.area;
  const nearbyPlacesQuery = useQuery({
    queryFn: () => getPopularNearbyExperiences(tripCoordinates),
    queryKey: [
      "course-nearby-places",
      tripArea,
      tripCoordinates.lat,
      tripCoordinates.lng,
    ],
  });
  const nearbyNotesQuery = useQuery({
    queryFn: () => getNearbyHomeNotes(tripCoordinates),
    queryKey: [
      "course-nearby-notes",
      tripArea,
      tripCoordinates.lat,
      tripCoordinates.lng,
    ],
  });
  const publicCoursesQuery = useQuery({
    queryFn: () =>
      getCourseFeed({
        limit: 20,
        mapX: tripCoordinates.lng,
        mapY: tripCoordinates.lat,
        radius: 5_000,
      }),
    queryKey: [
      "course-public-feed",
      tripArea,
      tripCoordinates.lat,
      tripCoordinates.lng,
    ],
    retry: 1,
  });

  const myCourseCards = useMemo(
    () => [
      ...apiCourses.map(apiCourseToDiscovery),
      ...savedCourses
        .filter((course) => !apiCourses.some((apiCourse) => apiCourse.id === course.id))
        .map(savedCourseToDiscovery),
    ],
    [apiCourses, savedCourses],
  );
  const publicCourseCards =
    publicCoursesQuery.data && publicCoursesQuery.data.length > 0
      ? publicCoursesQuery.data.map(apiCourseToDiscovery)
      : myCourseCards;
  const courseSections = groupCoursesByHashtag(publicCourseCards);
  const tripPanelOpen = isAtPageTop || isTripPanelOpen;

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
    if (searchParams.get("create") !== "1") return;
    setIsCreateOpen(true);
    setCreateMode("choice");
    setSearchParams((current) => {
      current.delete("create");
      return current;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const handleScroll = () => setIsAtPageTop(window.scrollY <= 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    closeCreateSheet();
    navigate(`/course/${course.id}`);
  }

  return (
    <section className="min-h-[calc(100dvh-72px)] overflow-x-hidden bg-white pb-28 text-[#111]">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 backdrop-blur">
        <img alt="곳곳 코스" className="h-6 w-auto" src={courseLogoUrl} />
        <div className="flex items-center gap-1">
          <button
            aria-label="일정 추가"
            className="relative grid size-8 place-items-center rounded-full border-0 bg-white text-[#2D2A26]"
            onClick={() => setIsCreateOpen(true)}
            type="button"
          >
            <CalendarDays size={20} strokeWidth={2.2} />
            <Plus className="absolute mt-5 ml-5" size={12} strokeWidth={3} />
          </button>
          <button
            aria-label="코스 메뉴"
            className="grid size-8 place-items-center rounded-full border-0 bg-white text-[#2D2A26]"
            onClick={() => setIsMenuOpen(true)}
            type="button"
          >
            <Menu size={23} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="px-5 pt-3">
        <p className="m-0 text-sm font-black text-[#242424]">
          <span className="text-[#FD4003]">{latestTrip.daysUntilText}</span>
          {" 여행이 시작되네요!"}
        </p>
        <h1 className="mt-2 mb-0 text-[2rem] leading-tight font-black tracking-[-0.01em] text-[#242424]">
          {tripArea}에서 이어갈
          <br />
          하루 코스를 골라볼까요
        </h1>
      </div>

      <CourseCreatePanel
        onCreate={() => setIsCreateOpen(true)}
        onRecommend={() => navigate("/course/new?mode=ai")}
      />

      <PlaceCarousel
        emptyMessage={`${tripArea} 주변 장소를 준비하고 있어요.`}
        experiences={nearbyPlacesQuery.data ?? []}
        isLoading={nearbyPlacesQuery.isLoading}
        title="이런 곳에 관심 많으실 것 같아요"
      />

      <NoteCarousel
        emptyMessage={`${tripArea} 주변 쪽지를 준비하고 있어요.`}
        isLoading={nearbyNotesQuery.isLoading}
        notes={nearbyNotesQuery.data ?? []}
        title="내 일정에 어울리는 쪽지"
      />

      {courseSections.map((section) => (
        <CourseCarousel
          courses={section.courses}
          emptyMessage="다른 사람들의 코스를 준비하고 있어요."
          isLoading={publicCoursesQuery.isLoading}
          key={section.title}
          title={section.title}
        />
      ))}

      {courseSections.length === 0 ? (
        <CourseCarousel
          courses={[]}
          emptyMessage="다른 사람들의 코스를 준비하고 있어요."
          isLoading={publicCoursesQuery.isLoading}
          title="다른 사람들의 코스"
        />
      ) : null}

      <UpcomingTripPanel
        open={tripPanelOpen}
        trip={latestTrip}
        onClose={() => setIsTripPanelOpen(false)}
        onToggle={() => setIsTripPanelOpen((current) => !current)}
      />

      <BottomSheet
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="코스 메뉴"
      >
        <div className="grid gap-5">
          <MenuList
            emptyMessage="아직 만든 코스가 없어요."
            items={myCourseCards.map((course) => ({
              id: course.id,
              label: course.title,
              meta: `${course.area} · ${course.stops.length}곳`,
              to: `/course/${course.id}`,
            }))}
            title="내 코스"
          />
          <MenuList
            emptyMessage="저장한 장소가 없어요."
            items={savedPlaces.map((place) => ({
              id: place.id,
              label: place.name,
              meta: place.area,
              to: `/map?filter=saved&target=${place.id}`,
            }))}
            title="저장한 장소"
          />
          <MenuList
            emptyMessage="저장한 쪽지가 없어요."
            items={savedNotes.map((note) => ({
              id: note.id,
              label: note.placeName,
              meta: note.authorName,
              to: `/map?filter=saved&target=${note.id}`,
            }))}
            title="저장한 쪽지"
          />
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isCreateOpen}
        onClose={closeCreateSheet}
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
    </section>
  );
}

function CourseCarousel({
  courses,
  emptyMessage,
  isLoading,
  title,
}: {
  courses: CourseDiscoveryModel[];
  emptyMessage: string;
  isLoading?: boolean;
  title: string;
}) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
          <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
        </div>
      ) : courses.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {courses.map((course) => (
            <CourseDiscoveryCard course={course} key={course.id} />
          ))}
        </div>
      ) : (
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}

function PlaceCarousel({
  emptyMessage,
  experiences,
  isLoading,
  title,
}: {
  emptyMessage: string;
  experiences: Experience[];
  isLoading?: boolean;
  title: string;
}) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
          <Skeleton className="h-60 w-40 flex-none rounded-[20px]" />
        </div>
      ) : experiences.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {experiences.map((experience) => (
            <ExperienceCard
              experience={experience}
              key={experience.id}
              variant="portrait"
            />
          ))}
        </div>
      ) : (
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}

function NoteCarousel({
  emptyMessage,
  isLoading,
  notes,
  title,
}: {
  emptyMessage: string;
  isLoading?: boolean;
  notes: Parameters<typeof SpotNoteCard>[0]["note"][];
  title: string;
}) {
  return (
    <section className="mt-10">
      <SectionTitle title={title} />
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden px-5 pb-2">
          <Skeleton className="h-[270px] w-[200px] flex-none rounded-[20px]" />
          <Skeleton className="h-[270px] w-[200px] flex-none rounded-[20px]" />
        </div>
      ) : notes.length > 0 ? (
        <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
          {notes.map((note) => (
            <SpotNoteCard note={note} key={note.id} />
          ))}
        </div>
      ) : (
        <EmptyPanel message={emptyMessage} />
      )}
    </section>
  );
}

function CourseCreatePanel({
  onCreate,
  onRecommend,
}: {
  onCreate: () => void;
  onRecommend: () => void;
}) {
  return (
    <section className="mx-5 mt-8 rounded-[22px] border border-[#FFE0D2] bg-[#FFF7F2] p-4 shadow-[0_10px_24px_rgba(253,64,3,0.07)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-2xl bg-[#FD4003] text-white">
          <CalendarDays size={22} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-base font-black text-[#171717]">
            새 하루 코스 만들기
          </h2>
          <p className="mt-1 mb-0 text-xs leading-relaxed font-bold text-[#8A4D39]">
            직접 만들거나 추천을 받아 다음 여행을 빠르게 준비해요.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="h-11 rounded-2xl border-0 bg-[#1F3D35] text-sm font-black text-white"
          onClick={onCreate}
          type="button"
        >
          직접 만들기
        </button>
        <button
          className="h-11 rounded-2xl border border-[#F2D0C0] bg-white text-sm font-black text-[#FD4003]"
          onClick={onRecommend}
          type="button"
        >
          AI 추천
        </button>
      </div>
    </section>
  );
}

function UpcomingTripPanel({
  onClose,
  onToggle,
  open,
  trip,
}: {
  onClose: () => void;
  onToggle: () => void;
  open: boolean;
  trip: ReturnType<typeof getNextTrip>;
}) {
  if (open) {
    return (
      <aside className="fixed right-4 bottom-[calc(86px+env(safe-area-inset-bottom))] left-4 z-30 mx-auto max-w-[430px]">
        <div className="flex min-h-24 items-center gap-4 rounded-[28px] bg-linear-to-r from-[#5FC9C9] to-[#4D9FF3] px-4 py-3 text-white shadow-[0_16px_34px_rgba(55,135,202,0.28)]">
          <button
            aria-label="다가오는 여행 접기"
            className="grid size-16 flex-none place-items-center rounded-full border-8 border-white/25 bg-white/15 p-0"
            onClick={onClose}
            type="button"
          >
            <img
              alt=""
              className="size-full rounded-full object-cover"
              src={trip.coverImageUrl}
            />
          </button>
          <button
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-white"
            onClick={onToggle}
            type="button"
          >
            <strong className="block truncate text-xl font-black">
              {trip.title}
            </strong>
            <span className="mt-2 block text-base font-black">
              D-{trip.daysUntil} | {trip.dateLabel}
            </span>
          </button>
          <span className="h-14 w-px flex-none bg-white/25" />
          <button
            className="grid min-w-16 flex-none place-items-center border-0 bg-transparent text-white"
            onClick={onToggle}
            type="button"
          >
            <CalendarDays size={28} strokeWidth={2.5} />
            <span className="mt-1 text-xs font-black">내 일정</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <button
      aria-label="다가오는 여행 열기"
      className="fixed right-5 bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 grid size-16 place-items-center rounded-full border-4 border-white bg-white p-0 shadow-[0_12px_28px_rgba(17,17,17,0.22)]"
      onClick={onToggle}
      type="button"
    >
      <img
        alt=""
        className="size-full rounded-full object-cover"
        src={trip.coverImageUrl}
      />
    </button>
  );
}

function MenuList({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string;
  items: Array<{ id: string; label: string; meta: string; to: string }>;
  title: string;
}) {
  const navigate = useNavigate();

  return (
    <section>
      <h3 className="m-0 text-sm font-black text-[#171717]">{title}</h3>
      <div className="mt-2 grid gap-2">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <button
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#EEE8DF] bg-white px-3 text-left"
              key={item.id}
              onClick={() => navigate(item.to)}
              type="button"
            >
              <span className="grid size-9 flex-none place-items-center rounded-xl bg-[#F4F3EF] text-[#FD4003]">
                {title === "내 코스" ? (
                  <MapPinned size={18} />
                ) : (
                  <Heart size={18} fill={title === "저장한 장소" ? "currentColor" : "none"} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-[#24211E]">
                  {item.label}
                </strong>
                <span className="mt-0.5 block truncate text-xs font-bold text-[#817A71]">
                  {item.meta}
                </span>
              </span>
              <ChevronRight size={17} className="text-[#AAA49B]" />
            </button>
          ))
        ) : (
          <p className="m-0 rounded-2xl bg-[#F7F6F3] px-4 py-4 text-center text-xs font-bold text-[#817A71]">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mx-5 mt-0 mb-4 text-[1.35rem] leading-tight font-black tracking-[-0.01em] text-[#111]">
      {title}
    </h2>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <p className="mx-5 my-0 rounded-[20px] bg-[#F7F6F3] px-5 py-8 text-center text-sm font-bold text-[#77736C]">
      {message}
    </p>
  );
}

function getNextTrip(apiCourses: CourseResponse[], savedCourses: SavedCourse[]) {
  const upcomingSaved = savedCourses
    .filter((course) => course.date)
    .map((course) => ({
      course,
      daysUntil: getDaysUntil(course.date ?? ""),
    }))
    .filter((item) => item.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  if (upcomingSaved) {
    return savedCourseToTrip(upcomingSaved.course, upcomingSaved.daysUntil);
  }

  const latestSaved = [...savedCourses].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  )[0];
  if (latestSaved) return savedCourseToTrip(latestSaved, 0);

  const latestApi = [...apiCourses].sort(
    (a, b) =>
      new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.updatedAt ?? a.createdAt ?? 0).getTime(),
  )[0];
  if (latestApi) {
    return {
      coverImageUrl:
        latestApi.coverImageUrl ||
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80",
      area: latestApi.regionName || "망원동",
      coordinates: latestApi.startLocation
        ? {
            lat: latestApi.startLocation.latitude,
            lng: latestApi.startLocation.longitude,
          }
        : fallbackCoordinates,
      dateLabel: "일정 미정",
      daysUntil: 0,
      daysUntilText: "0일 뒤",
      title: latestApi.title,
    };
  }

  return {
    area: "망원동",
    coverImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80",
    coordinates: fallbackCoordinates,
    dateLabel: "일정 미정",
    daysUntil: 0,
    daysUntilText: "0일 뒤",
    title: "망원동 여행",
  };
}

function groupCoursesByHashtag(courses: CourseDiscoveryModel[]) {
  const tagCounts = new Map<string, number>();
  courses.forEach((course) => {
    course.hashtags
      .filter((tag) => !isAreaLikeTag(tag, course.area))
      .forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  const popularTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
  const pairedTags = chunkTags(
    popularTags.length > 0 ? popularTags : ["가볍게", "알찬하루", "산책", "로컬"],
  );

  return pairedTags
    .map((tags) => ({
      courses: courses.filter((course) =>
        tags.some((tag) => course.hashtags.includes(tag)),
      ),
      title: tags.map((tag) => `#${tag}`).join(" "),
    }))
    .filter((section) => section.courses.length > 0)
    .slice(0, 4)
    .map((section) =>
      section.courses.length >= 2
        ? section
        : { ...section, courses: courses.slice(0, Math.min(courses.length, 6)) },
    );
}

function savedCourseToTrip(course: SavedCourse, daysUntil: number) {
  const firstStop = course.stops[0];
  const date = course.date ? new Date(course.date) : null;

  return {
    area: course.area || "망원동",
    coordinates: firstStop
      ? { lat: firstStop.lat, lng: firstStop.lng }
      : fallbackCoordinates,
    coverImageUrl:
      firstStop?.imageUrl ||
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80",
    dateLabel: date
      ? new Intl.DateTimeFormat("ko", {
          day: "numeric",
          month: "numeric",
          weekday: "short",
        }).format(date)
      : "일정 미정",
    daysUntil,
    daysUntilText: `${daysUntil}일 뒤`,
    title: course.title,
  };
}

function chunkTags(tags: string[]) {
  const pairs: string[][] = [];
  for (let index = 0; index < tags.length; index += 2) {
    pairs.push(tags.slice(index, index + 2));
  }

  return pairs;
}

function isAreaLikeTag(tag: string, area: string) {
  const normalizedTag = tag.replace(/\s+/g, "");
  const normalizedArea = area.replace(/\s+/g, "");

  return (
    normalizedTag === normalizedArea ||
    normalizedTag.includes("동") ||
    normalizedTag.includes("구")
  );
}

function getDaysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);

  return diff;
}
