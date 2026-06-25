import { CourseCarousel } from "@/features/course/components/CourseCarousel";
import {
  CourseCreatePanel,
  CourseCreateSheet,
} from "@/features/course/components/CourseCreatePanel";
import { CourseMenuSheet } from "@/features/course/components/CourseMenuSheet";
import { CoursePageHeader } from "@/features/course/components/CoursePageHeader";
import {
  NoteCarousel,
  PlaceCarousel,
} from "@/features/course/components/CourseRecommendationCarousels";
import { getCourseFeed, getMyCourses } from "@/features/course/courseApi";
import {
  fallbackTripCoordinates,
  getCourseCards,
  getNextTrip,
  groupCoursesByHashtag,
} from "@/features/course/lib/coursePageModels";
import {
  getNearbyHomeNotes,
  getPopularNearbyExperiences,
} from "@/features/home/homeApi";
import { notes, places } from "@/shared/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const savedPlaces = places.filter((place) => place.saved);
const savedNotes = notes.filter((note) => note.saved);

export function CoursePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const myCoursesQuery = useQuery({
    queryFn: getMyCourses,
    queryKey: ["courses", "me"],
    retry: 1,
  });
  const apiCourses = useMemo(() => myCoursesQuery.data ?? [], [myCoursesQuery.data]);
  const nextTrip = useMemo(
    () => getNextTrip(apiCourses),
    [apiCourses],
  );
  const tripCoordinates = nextTrip?.coordinates ?? fallbackTripCoordinates;
  const tripArea = nextTrip?.area ?? "내 주변";

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
    () => getCourseCards(apiCourses),
    [apiCourses],
  );
  const publicCourseCards =
    publicCoursesQuery.data && publicCoursesQuery.data.length > 0
      ? publicCoursesQuery.data.map((course) => ({
          ...getCourseCards([course])[0],
        }))
      : myCourseCards;
  const courseSections = groupCoursesByHashtag(publicCourseCards);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    setIsCreateOpen(true);
    setSearchParams((current) => {
      current.delete("create");
      return current;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <section className="min-h-[calc(100dvh-72px)] overflow-x-hidden bg-white pb-28 text-[#111]">
      <CoursePageHeader />

      <div className="px-5 pt-10">
        <p className="m-0 text-sm font-extrabold text-[#202020]">
          {nextTrip ? (
            <>
              <span className="text-[#FD4003]">{nextTrip.daysUntilText}</span>
              {" 여행이 시작되네요!"}
            </>
          ) : (
            "첫 코스를 만들면 관심 지역 추천을 더 잘 보여드릴게요."
          )}
        </p>
      </div>

      <PlaceCarousel
        className="mt-1"
        emptyMessage={`${tripArea} 주변 장소를 준비하고 있어요.`}
        experiences={nearbyPlacesQuery.data ?? []}
        isLoading={nearbyPlacesQuery.isLoading}
        title={nextTrip ? "이런 곳에 관심 많으실 것 같아요" : "첫 코스로 담기 좋은 곳"}
        titleClassName="mx-5 mt-0 mb-4 text-xl leading-tight font-extrabold tracking-[-0.01em] text-[#202020]"
      />

      <CourseCreatePanel onClick={() => setIsCreateOpen(true)} />

      <NoteCarousel
        emptyMessage={`${tripArea} 주변 쪽지를 준비하고 있어요.`}
        isLoading={nearbyNotesQuery.isLoading}
        notes={nearbyNotesQuery.data ?? []}
        title="내 일정에 어울리는 쪽지"
        titleClassName="text-xl mx-5 mt-10 mb-4 leading-tight font-extrabold tracking-[-0.01em] text-[#202020]"
      />

      {courseSections.map((section) => (
        <CourseCarousel
          courses={section.courses}
          emptyMessage="다른 사람들의 코스를 준비하고 있어요."
          isLoading={publicCoursesQuery.isLoading}
          key={section.title}
          title={section.title}
          titleClassName="text-xl mx-5 mt-10 mb-4 leading-tight font-extrabold tracking-[-0.01em] text-[#202020]"
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

      <CourseMenuSheet
        isOpen={isMenuOpen}
        myCourses={myCourseCards}
        onClose={() => setIsMenuOpen(false)}
        savedNotes={savedNotes}
        savedPlaces={savedPlaces}
      />
      <CourseCreateSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        tripArea={tripArea}
      />
    </section>
  );
}
