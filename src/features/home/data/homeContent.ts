import type { HomeLocation, HomeNote } from "@/features/home/types/homeTypes";

export const aiBriefings: Record<HomeLocation, string[]> = {
  장안1동: [
    "오늘은 햇빛이 강하지 않아 동네 골목을 천천히 걷기 좋아요.",
    "장안시장 쪽에서 간단히 먹고, 중랑천 방향으로 짧게 이어가는 코스를 추천해요.",
    "카페보다 산책 비중을 높이면 지금 날씨와 더 잘 맞아요.",
  ],
  망원동: [
    "망원은 시장 간식과 한강 산책을 같이 묶기 좋은 날이에요.",
    "오후에는 골목 카페보다 강변 쪽 바람이 더 시원하게 느껴질 거예요.",
    "가볍게 걷는 코스로 잡으면 이동 부담이 적어요.",
  ],
  성수동: [
    "성수는 실내 편집샵과 짧은 카페 휴식을 섞기 좋은 날이에요.",
    "서울숲 쪽은 점심 이후 그늘이 많아 가볍게 걷기 좋아요.",
    "사람이 많은 메인 거리보다 골목 안쪽 코스를 추천해요.",
  ],
  을지로: [
    "을지로는 해가 내려간 뒤 조명과 골목 분위기가 살아나는 동네예요.",
    "낮에는 노포 골목을 짧게 보고, 저녁에는 조명 거리로 이어가면 좋아요.",
    "사진을 남기고 싶다면 해지기 30분 전쯤 도착하는 걸 추천해요.",
  ],
};

export const similarSpotNotes: HomeNote[] = [
  {
    id: "note-card-1",
    name: "지민",
    location: "장안1동 · 12분 전",
    body: "시장 골목 끝에서 커피 향이 제일 진해요. 오늘처럼 맑은 날은 창가 쪽 자리가 좋아요.",
    place: "망원 골목 카페",
  },
  {
    id: "note-card-2",
    name: "현우",
    location: "을지로 · 어제",
    body: "해 지기 전에 들르면 조명이 켜지는 골목을 같이 볼 수 있어요.",
    place: "을지로 조명 거리",
    image:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",
  },
  {
    id: "note-card-3",
    name: "서윤",
    location: "성수 · 28분 전",
    body: "숲길 안쪽 벤치는 점심 지나면 조용해져요. 책 들고 가기 좋은 자리예요.",
    place: "서울숲 안쪽 벤치",
  },
];
