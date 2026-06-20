import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getHomeBriefing } from "@/shared/api/mockApi";
import { AiCourseRecommendation } from "@/features/home/components/AiCourseRecommendation";
import { AiWeatherBriefing } from "@/features/home/components/AiWeatherBriefing";
import { ExperienceSection } from "@/features/home/components/ExperienceSection";
import { HomeHeader } from "@/features/home/components/HomeHeader";
import { SpotNoteCarousel } from "@/features/home/components/SpotNoteCarousel";
import { type HomeLocation } from "@/features/home/types/homeTypes";

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-briefing"],
    queryFn: getHomeBriefing,
  });
  const [selectedLocation, setSelectedLocation] =
    useState<HomeLocation>("장안동");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="grid min-h-screen place-items-center p-6 font-black text-[#6f6a60]">
        오늘의 동네를 불러오는 중...
      </div>
    );
  }

  return (
    <section className="overflow-x-hidden bg-[#faf8f5] pb-8 text-[#111111]">
      <HomeHeader
        selectedLocation={selectedLocation}
        isLocationOpen={isLocationOpen}
        onToggleLocation={() => setIsLocationOpen((value) => !value)}
        onSelectLocation={(location) => {
          setSelectedLocation(location);
          setIsLocationOpen(false);
        }}
      />
      <AiWeatherBriefing location={selectedLocation} />
      <ExperienceSection
        title="여기는 어때요?"
        experiences={data.experiences.slice(0, 2)}
      />
      <SpotNoteCarousel />
      <ExperienceSection
        title="SPOT 인기 큐레이션"
        experiences={data.experiences.slice(2)}
      />
      <AiCourseRecommendation />
    </section>
  );
}
