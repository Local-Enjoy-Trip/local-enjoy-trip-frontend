import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Experience } from "@/shared/types/domain";

type ExperienceCardProps = {
  experience: Experience;
  variant?: "default" | "portrait";
};

export function ExperienceCard({
  experience,
  variant = "default",
}: ExperienceCardProps) {
  const targetPlaceId = experience.placeIds[0];
  const mapParams = new URLSearchParams();
  if (targetPlaceId) {
    mapParams.set("filter", "place");
    mapParams.set("target", targetPlaceId);
  } else {
    mapParams.set("experience", experience.id);
  }
  if (experience.coordinates) {
    mapParams.set("mapX", String(experience.coordinates.lng));
    mapParams.set("mapY", String(experience.coordinates.lat));
  }
  const mapTargetPath = `/map?${mapParams.toString()}`;

  if (variant === "portrait") {
    return (
      <Link
        className="w-[calc(100vw-52px)] max-w-[200px] flex-none snap-start"
        to={mapTargetPath}
      >
        <article className="relative aspect-4/5 w-full overflow-hidden rounded-[1.25rem] ">
          <img
            className="block h-full w-full object-cover"
            src={experience.imageUrl}
            alt=""
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 h-[52%] bg-linear-to-t from-black/95 via-black/55 to-transparent" />
          <div className="absolute top-3 left-3 rounded-full bg-white px-1.5 py-0.5 text-[0.625rem] font-extrabold whitespace-nowrap text-neutral-800">
            곳곳 추천
          </div>
          <div className="absolute inset-x-0 bottom-0 px-5 pb-6 text-white">
            <p className="m-0 line-clamp-2 text-base font-bold tracking-[-0.02em]">
              {experience.title}
            </p>
            <p className="mt-2 mb-0 line-clamp-1 text-xs font-normal text-neutral-200">
              {experience.detailLabel} · {experience.weatherFit}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      className="w-[calc(100vw-80px)] max-w-[250px] flex-none snap-start"
      to={mapTargetPath}
    >
      <div className="relative aspect-[0.96/1] w-full overflow-hidden rounded-[22px] shadow-[0_10px_24px_rgba(17,17,17,0.08)]">
        <img
          className="block h-full w-full object-cover"
          src={experience.imageUrl}
          alt=""
          loading="lazy"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="absolute top-2.5 left-2.5 max-w-[calc(100%-56px)] rounded-full bg-white/95 px-2.5 py-1 text-xs font-black whitespace-nowrap text-[#111111] shadow-[0_4px_12px_rgba(17,17,17,0.12)]">
          {experience.badgeLabel}
        </div>
        <div className="absolute top-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm">
          <Heart size={21} strokeWidth={2.6} />
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="m-0 truncate text-xs font-black text-white/85">
            {experience.area}, 서울
          </p>
        </div>
      </div>
      <h3 className="mt-3 mb-1 line-clamp-2 text-[1rem] leading-tight font-black text-[var(--spot-app-text)]">
        {experience.title}
      </h3>
      <p className="mt-1 mb-0 line-clamp-2 text-[0.86rem] leading-normal font-bold text-[var(--spot-app-muted)]">
        {experience.detailLabel} · {experience.weatherFit}
      </p>
    </Link>
  );
}
