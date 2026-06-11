import type { NoteCategory, Visibility } from "../types/domain";

export const visibilityLabels: Record<Visibility, string> = {
  public: "전체공개",
  friends: "친구공개",
  private: "나만보기"
};

export const categoryLabels: Record<NoteCategory, string> = {
  best: "가장 좋았던 것",
  music: "음악",
  book: "책",
  movie: "영화",
  tip: "꿀팁",
  move: "이동 팁"
};
