import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthUser } from "@/features/auth/authStore";
import { UpcomingTripPanel } from "@/features/course/components/UpcomingTripPanel";
import { getMyCourses } from "@/features/course/courseApi";
import { getNextTrip } from "@/features/course/lib/coursePageModels";
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
import { loadKakaoMap } from "@/features/map/lib/kakaoMap";
import { useCurrentLocation } from "@/shared/hooks/useCurrentLocation";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { Coordinates } from "@/shared/types/domain";
import type { NoteLocationSelection } from "@/pages/NoteLocationPage";

type HomeRouteState = {
  homeLocation?: NoteLocationSelection;
};

const defaultHomeLocation = homeLocationOptions[0];

function getDefaultHomeLocation(): NoteLocationSelection {
  return {
    address: defaultHomeLocation.weatherArea,
    coordinates: defaultHomeLocation.coordinates,
    name: defaultHomeLocation.label,
  };
}

function getNeighborhoodName(location: NoteLocationSelection) {
  if (location.neighborhood) return location.neighborhood;

  const addressParts = location.address.trim().split(/\s+/);
  const neighborhood = [...addressParts]
    .reverse()
    .find((part) => /(?:읍|면|동)(?:\s|$)/.test(part));

  return neighborhood ?? location.name;
}

function toCurrentDongSelection({
  address,
  coordinates,
  neighborhood,
}: {
  address: string;
  coordinates: Coordinates;
  neighborhood: string;
}): NoteLocationSelection {
  return {
    address,
    coordinates,
    name: neighborhood,
    neighborhood,
  };
}

function CourseCurationSkeleton() {
  return (
    <section className="mt-8">
      <SectionHeader title="현재 위치 코스" actionTo="/course" />
      <div className="flex gap-4 overflow-hidden px-5 pb-2">
        <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
        <Skeleton className="h-[330px] w-[252px] flex-none rounded-[22px]" />
      </div>
    </section>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const currentLocation = useCurrentLocation();
  const routeLocation = useLocation();
  const [isTripPanelOpen, setIsTripPanelOpen] = useState(true);
  const tripPanelAnimationLockRef = useRef(false);
  const tripPanelUnlockTimeoutRef = useRef<number | null>(null);
  const geocodeRequestRef = useRef(0);
  const routeState = routeLocation.state as HomeRouteState | null;
  const hasRouteSelectedHomeLocation = Boolean(routeState?.homeLocation);
  const [selectedLocation, setSelectedLocation] =
    useState<NoteLocationSelection | null>(() => routeState?.homeLocation ?? null);
  const locationReady = Boolean(selectedLocation);
  const neighborhoodName = selectedLocation
    ? getNeighborhoodName(selectedLocation)
    : "";
  const displayLocation = selectedLocation
    ? neighborhoodName
    : "현재 위치 확인 중";
  const briefingQuery = useQuery({
    enabled: locationReady,
    queryFn: () => {
      if (!selectedLocation) throw new Error("Home location is not ready.");
      return getNeighborhoodBriefing({
        coordinates: selectedLocation.coordinates,
        regionName: neighborhoodName,
      });
    },
    queryKey: [
      "neighborhood-briefing",
      neighborhoodName,
      selectedLocation?.coordinates.lat,
      selectedLocation?.coordinates.lng,
    ],
    retry: 1,
  });
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
  const popularExperiencesQuery = useQuery({
    enabled: locationReady,
    queryFn: () => {
      if (!selectedLocation) throw new Error("Home location is not ready.");
      return getPopularNearbyExperiences(selectedLocation.coordinates);
    },
    queryKey: [
      "home-popular-nearby",
      neighborhoodName,
      selectedLocation?.coordinates.lat,
      selectedLocation?.coordinates.lng,
    ],
  });
  const nearbyNotesQuery = useQuery({
    enabled: locationReady,
    queryFn: () => {
      if (!selectedLocation) throw new Error("Home location is not ready.");
      return getNearbyHomeNotes(selectedLocation.coordinates);
    },
    queryKey: [
      "home-nearby-notes",
      neighborhoodName,
      selectedLocation?.coordinates.lat,
      selectedLocation?.coordinates.lng,
    ],
  });

  useEffect(() => {
    if (routeState?.homeLocation) {
      setSelectedLocation(routeState.homeLocation);
    }
  }, [routeState?.homeLocation]);

  useEffect(() => {
    if (hasRouteSelectedHomeLocation) return;
    if (currentLocation.status !== "idle") return;

    currentLocation.requestLocation();
  }, [currentLocation, hasRouteSelectedHomeLocation]);

  useEffect(() => {
    if (hasRouteSelectedHomeLocation) return;
    if (currentLocation.status !== "success") return;

    const coordinates = currentLocation.coordinates;
    const requestId = geocodeRequestRef.current + 1;
    geocodeRequestRef.current = requestId;

    loadKakaoMap().then((status) => {
      if (geocodeRequestRef.current !== requestId) return;
      if (status !== "ready") {
        setSelectedLocation(getDefaultHomeLocation());
        return;
      }

      const kakaoMaps = window.kakao?.maps;

      if (!kakaoMaps?.services?.Geocoder) {
        setSelectedLocation(getDefaultHomeLocation());
        return;
      }

      const geocoder = new kakaoMaps.services.Geocoder();

      geocoder.coord2RegionCode(
        coordinates.lng,
        coordinates.lat,
        (result, geocodeStatus) => {
          if (geocodeRequestRef.current !== requestId) return;
          if (geocodeStatus !== kakaoMaps.services?.Status.OK) {
            setSelectedLocation(getDefaultHomeLocation());
            return;
          }

          const administrativeNeighborhood = result.find(
            (region) => region.region_type === "H",
          );

          if (
            !administrativeNeighborhood ||
            !administrativeNeighborhood.address_name.startsWith("서울")
          ) {
            setSelectedLocation(getDefaultHomeLocation());
            return;
          }

          setSelectedLocation(
            toCurrentDongSelection({
              address: administrativeNeighborhood.address_name,
              coordinates,
              neighborhood: administrativeNeighborhood.region_3depth_name,
            }),
          );
        },
      );
    });
  }, [
    currentLocation.coordinates,
    currentLocation.status,
    hasRouteSelectedHomeLocation,
  ]);

  useEffect(() => {
    if (hasRouteSelectedHomeLocation) return;
    if (currentLocation.status !== "error") return;

    setSelectedLocation(getDefaultHomeLocation());
  }, [currentLocation.status, hasRouteSelectedHomeLocation]);

  useEffect(() => {
    const requestTripPanelOpen = (nextOpen: boolean) => {
      if (tripPanelAnimationLockRef.current) return;
      setIsTripPanelOpen((current) => {
        if (current === nextOpen) return current;
        tripPanelAnimationLockRef.current = true;
        if (tripPanelUnlockTimeoutRef.current) {
          window.clearTimeout(tripPanelUnlockTimeoutRef.current);
        }
        tripPanelUnlockTimeoutRef.current = window.setTimeout(() => {
          tripPanelAnimationLockRef.current = false;
          tripPanelUnlockTimeoutRef.current = null;
        }, 360);
        return nextOpen;
      });
    };

    const handleScroll = () => {
      requestTripPanelOpen(window.scrollY <= 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (tripPanelUnlockTimeoutRef.current) {
        window.clearTimeout(tripPanelUnlockTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="overflow-x-hidden bg-white pb-28 text-[#111111]">
      <HomeHeader
        nickname={user?.name ?? "사용자"}
        selectedLocation={displayLocation}
        onChangeLocation={() =>
          navigate("/note/location", {
            state: {
              noteLocation: selectedLocation ?? getDefaultHomeLocation(),
              locationPurpose: "home",
            },
          })
        }
      />
      <AiWeatherBriefing
        briefing={briefingQuery.data}
        error={briefingQuery.error}
        isLoading={!locationReady || briefingQuery.isLoading}
        location={displayLocation}
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
        isLoading={!locationReady || popularExperiencesQuery.isLoading}
        variant="portrait"
      />
      <SpotNoteCarousel
        isError={nearbyNotesQuery.isError}
        isLoading={!locationReady || nearbyNotesQuery.isLoading}
        notes={nearbyNotesQuery.data ?? []}
      />
      {selectedLocation ? (
        <CourseCurationSection
          location={neighborhoodName}
        />
      ) : (
        <CourseCurationSkeleton />
      )}
      <AiCourseRecommendation />
      <UpcomingTripPanel
        onToggle={() => setIsTripPanelOpen((current) => !current)}
        open={isTripPanelOpen}
        trip={nextTrip}
      />
    </section>
  );
}
