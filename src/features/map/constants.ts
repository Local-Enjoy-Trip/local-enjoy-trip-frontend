import type { Coordinates } from "@/shared/types/domain";
import type { MapPoint } from "./types";

export const mapCenter: Coordinates = { lat: 37.5665, lng: 126.978 };
export const initialMapLevel = 9;

const placeCategoryColors: Record<string, string> = {
  관광지: "#3B82F6",
  문화시설: "#8B5CF6",
  축제: "#EC4899",
  레포츠: "#22A06B",
  숙박: "#6366F1",
  쇼핑: "#F59E0B",
  음식점: "#FD4003",
  간식: "#FF7A1A",
  걷기: "#16A174",
  노을: "#F44D63",
  산책: "#16A174",
  숲길: "#2F80ED",
  시장: "#FF7A1A",
  카페: "#7F6BFF",
  피크닉: "#2F80ED",
  한강: "#1E88E5"
};

const fallbackPlaceColors = ["#FF7A1A", "#7F6BFF", "#16A174", "#F44D63"];

export function getPlaceMarkerColor(point: MapPoint) {
  if (point.kind !== "place") return "#2B7A55";

  const category = point.source.tags[0];
  if (category && placeCategoryColors[category]) {
    return placeCategoryColors[category];
  }

  const colorIndex = Array.from(point.name).reduce(
    (total, character) => total + character.charCodeAt(0),
    0
  );

  return fallbackPlaceColors[colorIndex % fallbackPlaceColors.length];
}
