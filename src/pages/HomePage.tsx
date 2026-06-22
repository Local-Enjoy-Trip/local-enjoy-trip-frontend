import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthUser } from "@/features/auth/authStore";
import { AiCourseRecommendation } from "@/features/home/components/AiCourseRecommendation";
import { AiWeatherBriefing } from "@/features/home/components/AiWeatherBriefing";
import { CourseCurationSection } from "@/features/home/components/CourseCurationSection";
import { ExperienceSection } from "@/features/home/components/ExperienceSection";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { SpotNoteCarousel } from "@/features/home/components/SpotNoteCarousel";
import {
  getNearbyHomeNotes,
  getNeighborhoodBriefing,
  getPopularNearbyExperiences,
} from "@/features/home/homeApi";
import { homeLocationOptions } from "@/features/home/types/homeTypes";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";

type HomeRouteState = {
  homeLocation?: NoteLocationSelection;
};

const homeLocationStorageKey = "spot-home-location";
const defaultHomeLocation = homeLocationOptions[0];

function getDefaultHomeLocation(): NoteLocationSelection {
  return {
    address: defaultHomeLocation.weatherArea,
    coordinates: defaultHomeLocation.coordinates,
    name: defaultHomeLocation.label,
  };
}

function readHomeLocation() {
  try {
    const savedLocation = window.localStorage.getItem(homeLocationStorageKey);

    if (!savedLocation) return getDefaultHomeLocation();

    return JSON.parse(savedLocation) as NoteLocationSelection;
  } catch {
    return getDefaultHomeLocation();
  }
}

function getNeighborhoodName(location: NoteLocationSelection) {
  if (location.neighborhood) return location.neighborhood;

  const addressParts = location.address.trim().split(/\s+/);
  const neighborhood = [...addressParts]
    .reverse()
    .find((part) => /(?:읍|면|동)(?:\s|$)/.test(part));

  return neighborhood ?? location.name;
}

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const routeLocation = useLocation();
  const routeState = routeLocation.state as HomeRouteState | null;
  const [selectedLocation] = useState<NoteLocationSelection>(() => {
    const nextLocation = routeState?.homeLocation ?? readHomeLocation();
    window.localStorage.setItem(homeLocationStorageKey, JSON.stringify(nextLocation));
    return nextLocation;
  });
  const neighborhoodName = getNeighborhoodName(selectedLocation);
  const briefingQuery = useQuery({
    queryFn: () =>
      getNeighborhoodBriefing({
        coordinates: selectedLocation.coordinates,
        regionName: neighborhoodName,
      }),
    queryKey: [
      "neighborhood-briefing",
      neighborhoodName,
      selectedLocation.coordinates.lat,
      selectedLocation.coordinates.lng,
    ],
    retry: 1,
  });
  const popularExperiencesQuery = useQuery({
    queryFn: () =>
      getPopularNearbyExperiences(selectedLocation.coordinates),
    queryKey: [
      "home-popular-nearby",
      neighborhoodName,
      selectedLocation.coordinates.lat,
      selectedLocation.coordinates.lng,
    ],
  });
  const nearbyNotesQuery = useQuery({
    queryFn: () => getNearbyHomeNotes(selectedLocation.coordinates),
    queryKey: [
      "home-nearby-notes",
      neighborhoodName,
      selectedLocation.coordinates.lat,
      selectedLocation.coordinates.lng,
    ],
  });

  return (
    <section className="overflow-x-hidden bg-white pb-8 text-[#111111]">
      <HomeHeader
        nickname={user?.name ?? "사용자"}
        selectedLocation={neighborhoodName}
        onChangeLocation={() =>
          navigate("/note/location", {
            state: {
              noteLocation: selectedLocation,
              locationPurpose: "home",
            },
          })
        }
      />
      <AiWeatherBriefing
        briefing={briefingQuery.data}
        error={briefingQuery.error}
        isLoading={briefingQuery.isLoading}
        location={neighborhoodName}
        onRetry={() => briefingQuery.refetch()}
      />
      <ExperienceSection
        emptyMessage={
          popularExperiencesQuery.isError
            ? "주변 추천 장소를 불러오지 못했어요."
            : `${neighborhoodName} 주변 추천 장소를 준비하고 있어요.`
        }
        title="여기는 어때요?"
        experiences={popularExperiencesQuery.data ?? []}
        isLoading={popularExperiencesQuery.isLoading}
        variant="portrait"
      />
      <SpotNoteCarousel
        isError={nearbyNotesQuery.isError}
        isLoading={nearbyNotesQuery.isLoading}
        notes={nearbyNotesQuery.data ?? []}
      />
      <CourseCurationSection location={neighborhoodName} />
      <AiCourseRecommendation />
    </section>
  );
}
