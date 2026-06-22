import { aiBriefings } from "@/features/home/data/homeContent";
import { homeLocations } from "@/features/home/types/homeTypes";
import {
  Cloud,
  CloudRain,
  CloudSun,
  Cloudy,
  MoonStar,
  Snowflake,
  Sparkles,
  SunMedium,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { useMemo } from "react";

export type WeatherCondition =
  | "clearDay"
  | "clearNight"
  | "cloudy"
  | "rainy"
  | "snowy";

type AiWeatherBriefingProps = {
  condition?: WeatherCondition;
  location: string;
};

type HourlyWeather = {
  accent?: boolean;
  Icon: LucideIcon;
  temperature: string;
  time: string;
};

const weatherThemes: Record<
  WeatherCondition,
  {
    accent: string;
    background: string;
    badgeBackground: string;
    currentIcon: LucideIcon;
    hourlyIcon: string;
    label: string;
    panelBackground: string;
    panelText: string;
    temperature: string;
    topMuted: string;
    topText: string;
  }
> = {
  clearDay: {
    accent: "#FF4B16",
    background:
      "linear-gradient(180deg, #96B4E7 0%, #96B4E7 40%, #E4E2E4 62%, #FF744A 100%)",
    badgeBackground: "rgba(255,255,255,0.9)",
    currentIcon: CloudSun,
    hourlyIcon: "#FFFFFF",
    label: "맑음 · 구름 조금",
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,230,217,0.34))",
    panelText: "#292524",
    temperature: "32°",
    topMuted: "rgba(255,255,255,0.8)",
    topText: "#FFFFFF",
  },
  clearNight: {
    accent: "#FF4B16",
    background:
      "linear-gradient(180deg, #0B315A 0%, #0B315A 40%, #7186A2 62%, #8791AA 100%)",
    badgeBackground: "rgba(255,255,255,0.92)",
    currentIcon: MoonStar,
    hourlyIcon: "#F8FAFC",
    label: "맑음 · 구름 조금",
    panelBackground:
      "linear-gradient(135deg, rgba(226,234,249,0.56), rgba(144,159,190,0.32))",
    panelText: "#20283A",
    temperature: "24°",
    topMuted: "rgba(255,255,255,0.76)",
    topText: "#FFFFFF",
  },
  cloudy: {
    accent: "#526F86",
    background:
      "linear-gradient(180deg, #7895AD 0%, #7895AD 40%, #D2D5D7 62%, #B9ACA6 100%)",
    badgeBackground: "rgba(255,255,255,0.86)",
    currentIcon: Cloudy,
    hourlyIcon: "#F8FAFC",
    label: "흐림 · 바람 약함",
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.58), rgba(213,221,226,0.32))",
    panelText: "#27333D",
    temperature: "23°",
    topMuted: "rgba(255,255,255,0.78)",
    topText: "#FFFFFF",
  },
  rainy: {
    accent: "#2F79B8",
    background:
      "linear-gradient(180deg, #284A63 0%, #284A63 40%, #8BA0AF 62%, #748A98 100%)",
    badgeBackground: "rgba(239,247,252,0.9)",
    currentIcon: CloudRain,
    hourlyIcon: "#EAF6FF",
    label: "비 · 실내 추천",
    panelBackground:
      "linear-gradient(135deg, rgba(225,240,249,0.52), rgba(135,166,186,0.3))",
    panelText: "#20313D",
    temperature: "20°",
    topMuted: "rgba(234,246,255,0.78)",
    topText: "#F4FAFF",
  },
  snowy: {
    accent: "#4F83A5",
    background:
      "linear-gradient(180deg, #A6C6DC 0%, #A6C6DC 40%, #F1F7FA 62%, #D9E4EA 100%)",
    badgeBackground: "rgba(255,255,255,0.9)",
    currentIcon: Snowflake,
    hourlyIcon: "#4F7188",
    label: "눈 · 포근하게",
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(224,241,249,0.38))",
    panelText: "#274051",
    temperature: "-1°",
    topMuted: "rgba(39,64,81,0.66)",
    topText: "#274051",
  },
};

const hourlyForecasts: Record<WeatherCondition, HourlyWeather[]> = {
  clearDay: [
    { time: "오후 1시", temperature: "32°", Icon: CloudSun },
    { time: "오후 2시", temperature: "31°", Icon: SunMedium },
    { time: "오후 3시", temperature: "30°", Icon: SunMedium },
    { time: "오후 4시", temperature: "29°", Icon: CloudSun },
    { time: "오후 5시", temperature: "28°", Icon: CloudSun },
    { time: "오후 6시", temperature: "27°", Icon: Sunset, accent: true },
  ],
  clearNight: [
    { time: "오후 6시", temperature: "26°", Icon: Cloud },
    { time: "오후 7시", temperature: "25°", Icon: Cloud },
    { time: "오후 7:56", temperature: "24°", Icon: Sunset, accent: true },
    { time: "오후 8시", temperature: "24°", Icon: Cloud },
    { time: "오후 9시", temperature: "23°", Icon: MoonStar },
    { time: "오후 10시", temperature: "22°", Icon: MoonStar },
  ],
  cloudy: [
    { time: "오후 1시", temperature: "23°", Icon: Cloudy },
    { time: "오후 2시", temperature: "23°", Icon: Cloud },
    { time: "오후 3시", temperature: "22°", Icon: Cloudy },
    { time: "오후 4시", temperature: "22°", Icon: Cloud },
    { time: "오후 5시", temperature: "21°", Icon: Cloudy },
    { time: "오후 6시", temperature: "21°", Icon: Cloud },
  ],
  rainy: [
    { time: "오후 1시", temperature: "20°", Icon: CloudRain },
    { time: "오후 2시", temperature: "20°", Icon: CloudRain },
    { time: "오후 3시", temperature: "19°", Icon: CloudRain },
    { time: "오후 4시", temperature: "19°", Icon: CloudRain },
    { time: "오후 5시", temperature: "18°", Icon: CloudRain },
    { time: "오후 6시", temperature: "18°", Icon: CloudRain },
  ],
  snowy: [
    { time: "오후 1시", temperature: "-1°", Icon: Snowflake },
    { time: "오후 2시", temperature: "-1°", Icon: Snowflake },
    { time: "오후 3시", temperature: "-2°", Icon: Cloud },
    { time: "오후 4시", temperature: "-2°", Icon: Snowflake },
    { time: "오후 5시", temperature: "-3°", Icon: Snowflake },
    { time: "오후 6시", temperature: "-3°", Icon: Cloud },
  ],
};

function getDefaultCondition(): WeatherCondition {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6 ? "clearNight" : "clearDay";
}

export function AiWeatherBriefing({
  condition,
  location,
}: AiWeatherBriefingProps) {
  const briefings = useMemo(() => {
    const knownLocation = homeLocations.find((candidate) => {
      const neighborhoodStem = candidate.replace(/동$/, "");
      return (
        location.includes(candidate) || location.startsWith(neighborhoodStem)
      );
    });

    return aiBriefings[knownLocation ?? homeLocations[0]];
  }, [location]);
  const activeCondition = condition ?? getDefaultCondition();
  const theme = weatherThemes[activeCondition];
  const forecast = hourlyForecasts[activeCondition];
  const CurrentWeatherIcon = theme.currentIcon;

  return (
    <section className="mt-5 px-5">
      <article
        className="overflow-hidden rounded-[28px]"
        data-weather-theme={activeCondition}
        style={{ background: theme.background }}
      >
        <div className="px-5 pt-7 pb-4" style={{ color: theme.topText }}>
          <div className="flex items-start justify-between gap-4">
            <p className="m-0 text-[2.5rem] leading-none font-bold tracking-[-0.055em]">
              {theme.temperature}
            </p>
            <div className="pt-1 text-right">
              <CurrentWeatherIcon
                className="ml-auto"
                size={25}
                strokeWidth={1.8}
              />
              <p className="mt-1 mb-0 text-xs font-extrabold">{theme.label}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-6 gap-1">
            {forecast.map(({ accent, Icon, temperature, time }) => (
              <div className="min-w-0 text-center" key={time}>
                <span
                  className="block truncate text-[0.625rem] font-medium"
                  style={{ color: theme.topMuted }}
                >
                  {time}
                </span>
                <Icon
                  className="mx-auto mt-2"
                  color={accent ? theme.accent : theme.hourlyIcon}
                  fill={Icon === Cloud ? "currentColor" : "none"}
                  size={22}
                  strokeWidth={2}
                />
                <strong
                  className="mt-1.5 block text-xs font-bold"
                  style={{ color: theme.topText }}
                >
                  {temperature}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative rounded-[1.25rem] border border-white/40 px-5 pt-5 pb-6 backdrop-blur-[20px] backdrop-saturate-150"
          style={{
            background: theme.panelBackground,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.44), inset 0 -1px 0 rgba(255,255,255,0.1)",
            color: theme.panelText,
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-white/55 px-3 py-2 text-[0.625rem] font-bold"
            style={{ background: theme.badgeBackground }}
          >
            <Sparkles size={13} fill="currentColor" />
            곳곳 AI 브리핑
          </div>

          <div className="mt-2">
            <p className="m-0 text-sm leading-snug font-bold">
              알수록 정겨운 동네, {location}
            </p>
            <p className="text-sm leading-relaxed font-bold">{briefings[0]}</p>
            <ul className="mt-4 grid list-none gap-2.5 p-0">
              {briefings.slice(1).map((briefing) => (
                <li
                  className="flex gap-2 text-xs leading-relaxed font-medium"
                  key={briefing}
                >
                  <span
                    className="mt-2 h-1.5 w-1.5 flex-none rounded-full"
                    style={{ background: theme.accent }}
                  />
                  <span>{briefing}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </section>
  );
}
