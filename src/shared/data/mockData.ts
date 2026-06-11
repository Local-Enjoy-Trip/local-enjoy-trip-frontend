import type { Course, Experience, LocalNote, Place } from "../types/domain";

export const places: Place[] = [
  {
    id: "place-mangwon-market",
    name: "망원시장",
    area: "망원",
    summary: "시장 간식과 골목 산책을 묶기 좋은 출발점",
    tags: ["시장", "간식", "산책"],
    coordinates: { lat: 37.5567, lng: 126.9057 },
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    saved: true
  },
  {
    id: "place-hangang",
    name: "망원한강공원",
    area: "망원",
    summary: "해질녘 바람과 강변 산책이 잘 어울리는 곳",
    tags: ["한강", "노을", "걷기"],
    coordinates: { lat: 37.5548, lng: 126.8959 },
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    saved: false
  },
  {
    id: "place-seoul-forest",
    name: "서울숲",
    area: "성수",
    summary: "카페와 숲길을 같은 코스로 엮기 좋은 동네",
    tags: ["숲길", "카페", "피크닉"],
    coordinates: { lat: 37.5444, lng: 127.0374 },
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    saved: false
  }
];

export const notes: LocalNote[] = [
  {
    id: "note-1",
    body: "시장 소리가 멀어질 때쯤 잔잔한 음악이 잘 어울려요.",
    authorName: "지우",
    category: "music",
    visibility: "public",
    placeName: "망원시장 골목",
    coordinates: { lat: 37.5562, lng: 126.9049 },
    saved: true
  },
  {
    id: "note-2",
    body: "비 오면 창가 자리가 먼저 차요. 조금 일찍 가는 게 좋아요.",
    authorName: "민서",
    category: "tip",
    visibility: "friends",
    placeName: "성수 카페 거리",
    coordinates: { lat: 37.5449, lng: 127.0442 },
    saved: false
  },
  {
    id: "note-3",
    body: "한강으로 빠지는 골목에서 해가 제일 부드럽게 보여요.",
    authorName: "나",
    category: "best",
    visibility: "private",
    placeName: "망원한강공원 입구",
    coordinates: { lat: 37.5545, lng: 126.897 },
    saved: false
  }
];

export const experiences: Experience[] = [
  {
    id: "exp-market-walk",
    title: "겨울 시장 간식 산책",
    area: "망원",
    description: "따뜻한 간식을 하나 들고 골목을 지나 한강 쪽으로 걷는 짧은 코스",
    weatherFit: "흐림 · 바람 약함",
    imageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    badgeLabel: "오늘 추천",
    detailLabel: "시장 · 골목 · 한강",
    placeIds: ["place-mangwon-market", "place-hangang"]
  },
  {
    id: "exp-rainy-window",
    title: "비 오는 날 창가 카페",
    area: "성수",
    description: "전시와 편집샵 사이에 앉아 쉬기 좋은 실내 중심 경험",
    weatherFit: "비 · 실내 선호",
    imageUrl:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80",
    badgeLabel: "실내 코스",
    detailLabel: "카페 · 전시 · 편집샵",
    placeIds: ["place-seoul-forest"]
  },
  {
    id: "exp-sunset-river",
    title: "해질녘 한강 산책",
    area: "망원",
    description: "노을 시간에 맞춰 시장과 강변을 가볍게 연결",
    weatherFit: "맑음 · 일몰",
    imageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    badgeLabel: "산책",
    detailLabel: "노을 · 강변 · 걷기",
    placeIds: ["place-hangang"]
  },
  {
    id: "exp-forest-date",
    title: "서울숲 초여름 피크닉",
    area: "성수",
    description: "나무 그늘 아래 쉬고 근처 카페까지 이어지는 가벼운 데이트 코스",
    weatherFit: "초여름 · 구름 조금",
    imageUrl:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    badgeLabel: "반나절 코스",
    detailLabel: "숲길 · 카페 · 피크닉",
    placeIds: ["place-seoul-forest"]
  }
];

export const courses: Course[] = [
  {
    id: "course-1",
    title: "망원시장 간식에서 한강까지",
    area: "망원",
    stopCount: 4,
    visibility: "private"
  }
];
