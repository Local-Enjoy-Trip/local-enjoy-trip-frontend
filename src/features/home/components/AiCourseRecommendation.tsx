import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AiCourseRecommendation() {
  const navigate = useNavigate();

  return (
    <section className="mt-8 px-5">
      <div className="ai-course-recommendation-glow rounded-[20px] p-[2px] shadow-[0_2px_5px_rgba(17,17,17,0.08)]">
        <article className="relative z-10 rounded-[22px] bg-[#fbfbfb] px-6 py-7">
          <p className="m-0 text-[20px] leading-tight font-extrabold tracking-[-0.035em] text-[#252525]">
            어디갈지 모르겠을 땐, 곳곳 AI 추천
          </p>
          <p className="mt-4 mb-0 text-xs leading-relaxed tracking-[-0.02em] text-[#202020]">
            취향 몇 가지를 입력하면 오늘의 날씨와 동선을 기준으로
            <br />
            곳곳 AI가 가볍게 다녀올 코스를 만들어줘요.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-1 px-2 text-xs font-bold text-[#202020]"
            onClick={() => navigate("/course/new?mode=ai")}
            type="button"
          >
            곳곳 AI로 코스 만들기
            <ArrowRight size={10} strokeWidth={2} />
          </button>
        </article>
      </div>
    </section>
  );
}
