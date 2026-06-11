import { CloudSun, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ShineBorder } from "@/shared/ui/ShineBorder";
import { aiBriefings } from "@/features/home/data/homeContent";
import type { HomeLocation } from "@/features/home/types/homeTypes";

type AiWeatherBriefingProps = {
  location: HomeLocation;
};

const weatherThemes = {
  clear: {
    label: "맑음 · 구름 조금",
    temperature: "32°",
    background: "bg-[image:var(--spot-weather-card)]",
    glowA: "bg-[#FF4300]/10",
    glowB: "bg-[#9c40ff]/8",
    iconClassName:
      "bg-white/80 text-[#FF4300] shadow-[0_10px_24px_rgba(255,67,0,0.12)]",
    animationClassName: "weather-ambient weather-ambient--clear",
  },
  cloudy: {
    label: "흐림 · 바람 약함",
    temperature: "24°",
    background: "bg-[linear-gradient(135deg,#f7f8fa,#ffffff_48%,#eef4ff)]",
    glowA: "bg-[#9db7d5]/14",
    glowB: "bg-[#111111]/6",
    iconClassName:
      "bg-white/80 text-[#6e879f] shadow-[0_10px_24px_rgba(110,135,159,0.12)]",
    animationClassName: "weather-ambient weather-ambient--cloudy",
  },
  rainy: {
    label: "비 · 실내 추천",
    temperature: "21°",
    background: "bg-[linear-gradient(135deg,#f4f8fb,#ffffff_48%,#e9f2fa)]",
    glowA: "bg-[#4d8fc7]/12",
    glowB: "bg-[#111111]/8",
    iconClassName:
      "bg-white/80 text-[#4d8fc7] shadow-[0_10px_24px_rgba(77,143,199,0.12)]",
    animationClassName: "weather-ambient weather-ambient--rainy",
  },
};

type WeatherKey = keyof typeof weatherThemes;

export function AiWeatherBriefing({ location }: AiWeatherBriefingProps) {
  const briefings = useMemo(() => aiBriefings[location], [location]);
  // TODO: Replace this with the weather API's condition code.
  const weatherKey: WeatherKey = "clear";
  const weather = weatherThemes[weatherKey];

  return (
    <section className="mt-5 px-5">
      <ShineBorder>
        <div
          className={`relative overflow-hidden rounded-[27px] p-5 ${weather.background}`}
        >
          <div
            className={`absolute -right-12 -top-14 h-40 w-40 rounded-full ${weather.glowA} blur-3xl`}
          />
          <div
            className={`absolute -bottom-16 left-4 h-36 w-36 rounded-full ${weather.glowB} blur-3xl`}
          />
          <div className={weather.animationClassName} />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--spot-app-text)] px-2.5 py-1 text-[0.68rem] font-black text-[var(--spot-app-bg)]">
                  <Sparkles size={12} />
                  SPOT AI 브리핑
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <strong className="text-[2.35rem] leading-none font-black">
                    {weather.temperature}
                  </strong>
                  <span className="pb-1 text-sm font-bold text-[var(--spot-weather-muted)]">
                    {weather.label}
                  </span>
                </div>
              </div>
              <div
                className={`grid h-14 w-14 place-items-center rounded-2xl backdrop-blur ${weather.iconClassName}`}
              >
                <CloudSun size={31} strokeWidth={2.4} />
              </div>
            </div>

            <div className="mt-5">
              <p className="m-0 text-[1.06rem] leading-relaxed font-black text-[var(--spot-app-text)]">
                {briefings[0]}
              </p>
              <ul className="mt-3 grid list-none gap-2 p-0">
                {briefings.slice(1).map((briefing) => (
                  <li
                    className="flex gap-2 text-[0.96rem] leading-relaxed font-bold text-[var(--spot-app-text-soft)]"
                    key={briefing}
                  >
                    <span className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-[#FF4300]" />
                    <span>{briefing}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ShineBorder>
    </section>
  );
}
