import type { HomeLocation, HomeNote } from "@/features/home/types/homeTypes";

export const aiBriefings: Record<HomeLocation, string[]> = {
  장안동: [
    "오늘은 햇빛이 강하지 않아 동네 골목을 천천히 걷기 좋아요.",
    "장안시장 쪽에서 간단히 먹고, 중랑천 방향으로 짧게 이어가는 코스를 추천해요.",
    "카페보다 산책 비중을 높이면 지금 날씨와 더 잘 맞아요.",
  ],
  회기동: [
    "회기역 주변은 점심 이후 바람이 조금 살아나 짧은 산책을 붙이기 좋아요.",
    "경희대 앞 골목에서 가볍게 먹고, 홍릉수목원 방향으로 천천히 이어가 보세요.",
    "실내 카페와 야외 산책을 반반 섞으면 지금 날씨와 잘 맞아요.",
  ],
  휘경동: [
    "휘경동은 중랑천 쪽으로 걷기 좋은 날씨라 이동 부담이 적어요.",
    "역 주변보다 주택가 안쪽 골목이 덜 붐벼 조용한 코스로 좋아요.",
    "바람이 있는 편이라 강변에 오래 머무를 땐 얇은 겉옷을 챙겨도 좋아요.",
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
    name: "도리",
    location: "장안 1동 · 12분 전",
    body: "너무 덥지도 않고 산책로가 잘 조성되어 있어서 커피 한 잔 들고 기분 좋은 산책 했어요.",
    place: "중랑천 벚꽃길",
    image:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=700&q=80",
    profileImage:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    id: "note-card-2",
    name: "치키카바라",
    location: "답십리 · 3일 전",
    body: "카페 정화에서 라떼 한 잔 마시며\n‘Fall in Love with Me’ 꼭 들어주세요\n\n매주 주말 나의 모닝 힐링 방앗간\n(✿´꒳``✿)",
    place: "카페 정화",
    profileImage:
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=150&h=150&q=80",
  },
  {
    id: "note-card-3",
    name: "소소",
    location: "성수동 · 1시간 전",
    body: "성수동 골목 구석구석 숨겨진 소품샵 투어하기 딱 좋은 날씨예요. 가벼운 마음으로 걸어보세요!",
    place: "성수동 소품샵 거리",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=700&q=80",
    profileImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80",
  },
];
