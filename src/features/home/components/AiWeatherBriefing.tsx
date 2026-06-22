import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Cloudy,
  MoonStar,
  Snowflake,
  Sparkles,
  SunMedium,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import type {
  NeighborhoodBriefing,
  WeatherForecast,
} from "@/features/home/homeApi";

export type WeatherCondition =
  | "clearDay"
  | "clearNight"
  | "cloudy"
  | "rainy"
  | "snowy";

type AiWeatherBriefingProps = {
  briefing?: NeighborhoodBriefing;
  error: Error | null;
  isLoading: boolean;
  location: string;
  onRetry: () => void;
};

const weatherThemes: Record<
  WeatherCondition,
  {
    accent: string;
    background: string;
    badgeBackground: string;
    currentIcon: LucideIcon;
    hourlyIcon: string;
    panelBackground: string;
    panelText: string;
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
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.62), rgba(255,230,217,0.34))",
    panelText: "#292524",
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
    panelBackground:
      "linear-gradient(135deg, rgba(226,234,249,0.56), rgba(144,159,190,0.32))",
    panelText: "#20283A",
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
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.58), rgba(213,221,226,0.32))",
    panelText: "#27333D",
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
    panelBackground:
      "linear-gradient(135deg, rgba(225,240,249,0.52), rgba(135,166,186,0.3))",
    panelText: "#20313D",
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
    panelBackground:
      "linear-gradient(135deg, rgba(255,255,255,0.68), rgba(224,241,249,0.38))",
    panelText: "#274051",
    topMuted: "rgba(39,64,81,0.66)",
    topText: "#274051",
  },
};

export function AiWeatherBriefing({
  briefing,
  error,
  isLoading,
  location,
  onRetry,
}: AiWeatherBriefingProps) {
  if (isLoading) {
    return (
      <section className="mt-5 px-5" aria-label="날씨와 AI 브리핑 불러오는 중">
        <div className="h-[25rem] animate-pulse rounded-[28px] bg-[#E8EBEE]" />
      </section>
    );
  }

  if (!briefing) {
    return (
      <section className="mt-5 px-5">
        <div className="grid min-h-60 place-items-center rounded-[28px] bg-[#F3F5F6] px-6 text-center">
          <div>
            <Cloudy className="mx-auto text-[#70808C]" size={32} />
            <p className="mt-4 mb-0 text-base font-extrabold">
              날씨와 AI 브리핑을 불러오지 못했어요
            </p>
            <p className="mt-2 mb-0 text-xs leading-relaxed font-semibold text-[#6F777C]">
              {error?.message ?? "잠시 후 다시 시도해주세요."}
            </p>
            <button
              className="mt-5 rounded-full bg-[#111] px-5 py-2.5 text-xs font-extrabold text-white"
              onClick={onRetry}
              type="button"
            >
              다시 시도
            </button>
          </div>
        </div>
      </section>
    );
  }

  const activeCondition = toWeatherCondition(briefing.weather.condition);
  const theme = weatherThemes[activeCondition];
  const CurrentWeatherIcon = theme.currentIcon;
  const forecasts = briefing.forecasts.slice(0, 6);

  return (
    <section className="mt-5 px-5">
      <article
        className="overflow-hidden rounded-[28px]"
        data-weather-theme={activeCondition}
        style={{ background: theme.background }}
      >
        <div className="px-5 pt-7 pb-4" style={{ color: theme.topText }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[2.5rem] leading-none font-bold tracking-[-0.055em]">
                {formatTemperature(briefing.weather.temperature)}
              </p>
              <p
                className="mt-2 mb-0 text-xs font-bold"
                style={{ color: theme.topMuted }}
              >
                최저 {formatTemperature(briefing.weather.tempMin)} · 최고{" "}
                {formatTemperature(briefing.weather.tempMax)}
              </p>
            </div>
            <div className="pt-1 text-right">
              <CurrentWeatherIcon
                className="ml-auto"
                size={25}
                strokeWidth={1.8}
              />
              <p className="mt-1 mb-0 text-xs font-extrabold">
                {briefing.weather.condition}
              </p>
              <p
                className="mt-1 mb-0 text-[0.625rem] font-bold"
                style={{ color: theme.topMuted }}
              >
                강수 확률 {formatRainChance(briefing.weather.rainChance)}
              </p>
            </div>
          </div>

          {forecasts.length > 0 ? (
            <div
              className="mt-6 grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${forecasts.length}, minmax(0, 1fr))`,
              }}
            >
              {forecasts.map((forecast, index) => (
                <ForecastItem
                  forecast={forecast}
                  iconColor={theme.hourlyIcon}
                  mutedColor={theme.topMuted}
                  textColor={theme.topText}
                  key={`${forecast.time}-${index}`}
                />
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex items-center justify-center gap-5 text-[0.625rem] font-bold">
            <span className="inline-flex items-center gap-1.5">
              <Sunrise size={14} /> 일출 {briefing.weather.sunrise ?? "-"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sunset size={14} /> 일몰 {briefing.weather.sunset ?? "-"}
            </span>
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
              알수록 정겨운 동네, {briefing.region || location}
            </p>
            <p className="mt-3 mb-0 whitespace-pre-line text-sm leading-relaxed font-bold">
              {briefing.briefing}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

function ForecastItem({
  forecast,
  iconColor,
  mutedColor,
  textColor,
}: {
  forecast: WeatherForecast;
  iconColor: string;
  mutedColor: string;
  textColor: string;
}) {
  const Icon = getWeatherIcon(forecast.condition);

  return (
    <div className="min-w-0 text-center">
      <span
        className="block truncate text-[0.625rem] font-medium"
        style={{ color: mutedColor }}
      >
        {formatForecastTime(forecast.time)}
      </span>
      <Icon
        className="mx-auto mt-2"
        color={iconColor}
        size={22}
        strokeWidth={2}
      />
      <strong
        className="mt-1.5 block text-xs font-bold"
        style={{ color: textColor }}
      >
        {formatTemperature(forecast.temperature)}
      </strong>
      <span
        className="mt-0.5 block text-[0.5625rem] font-semibold"
        style={{ color: mutedColor }}
      >
        {formatRainChance(forecast.rainChance)}
      </span>
    </div>
  );
}

function toWeatherCondition(condition: string): WeatherCondition {
  if (condition.includes("눈")) return "snowy";
  if (
    condition.includes("비") ||
    condition.includes("소나기") ||
    condition.includes("이슬비") ||
    condition.includes("천둥")
  ) {
    return "rainy";
  }
  if (
    condition.includes("구름") ||
    condition.includes("흐림") ||
    condition.includes("안개")
  ) {
    return "cloudy";
  }

  const hour = new Date().getHours();
  return hour >= 19 || hour < 6 ? "clearNight" : "clearDay";
}

function getWeatherIcon(condition: string): LucideIcon {
  if (condition.includes("눈")) return Snowflake;
  if (condition.includes("천둥")) return CloudLightning;
  if (
    condition.includes("비") ||
    condition.includes("소나기") ||
    condition.includes("이슬비")
  ) {
    return CloudRain;
  }
  if (condition.includes("안개")) return CloudFog;
  if (condition.includes("구름") || condition.includes("흐림")) return Cloud;
  return SunMedium;
}

function formatTemperature(value: number | null) {
  return value === null ? "-" : `${value}°`;
}

function formatRainChance(value: number | null) {
  return value === null ? "-" : `${value}%`;
}

function formatForecastTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;

  const hour = Number(match[1]);
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;
  return `${period} ${displayHour}시`;
}
