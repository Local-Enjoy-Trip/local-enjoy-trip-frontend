import { courses, experiences, notes, places } from "../data/mockData";

const wait = (ms = 180) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function getHomeBriefing() {
  await wait();

  return {
    dateLabel: "6월 9일 화요일",
    season: "초여름",
    weather: "흐림 · 22도",
    location: "서울 망원동",
    message:
      "오늘은 흐리고 바람이 약해서 망원은 시장 간식과 짧은 한강 산책을 묶기 좋아요.",
    experiences
  };
}

export async function getMapPins() {
  await wait();
  return { places, notes };
}

export async function getLibrary() {
  await wait();
  return {
    savedPlaces: places.filter((place) => place.saved),
    savedNotes: notes.filter((note) => note.saved),
    courses
  };
}
