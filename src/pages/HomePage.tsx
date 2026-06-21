import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getHomeBriefing } from "@/shared/api/mockApi";
import { useAuthUser } from "@/features/auth/authStore";
import { AiCourseRecommendation } from "@/features/home/components/AiCourseRecommendation";
import { AiWeatherBriefing } from "@/features/home/components/AiWeatherBriefing";
import { ExperienceSection } from "@/features/home/components/ExperienceSection";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { SpotNoteCarousel } from "@/features/home/components/SpotNoteCarousel";
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
  const { data, isLoading } = useQuery({
    queryKey: ["home-briefing"],
    queryFn: getHomeBriefing,
  });
  const [selectedLocation] = useState<NoteLocationSelection>(() => {
    const nextLocation = routeState?.homeLocation ?? readHomeLocation();
    window.localStorage.setItem(homeLocationStorageKey, JSON.stringify(nextLocation));
    return nextLocation;
  });
  const neighborhoodName = getNeighborhoodName(selectedLocation);

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        오늘의 동네를 불러오는 중...
      </div>
    );
  }

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
      <AiWeatherBriefing location={neighborhoodName} />
      <ExperienceSection
        title="여기는 어때요?"
        experiences={data.experiences.slice(0, 2)}
        variant="portrait"
      />
      <SpotNoteCarousel />
      <ExperienceSection
        title="이곳저곳 인기 큐레이션"
        experiences={data.experiences.slice(2)}
      />
      <AiCourseRecommendation />
    </section>
  );
}
