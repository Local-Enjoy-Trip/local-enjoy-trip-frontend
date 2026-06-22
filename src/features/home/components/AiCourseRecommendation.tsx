import { ArrowRight } from "lucide-react";

export function AiCourseRecommendation() {
  return (
    <section className="mt-8 px-5">
      <div className="rounded-[24px] bg-linear-to-br from-[#ff957f] via-[#ffd1cc] to-[#ff6549] p-[2px] shadow-[0_2px_5px_rgba(17,17,17,0.08)]">
        <article className="rounded-[22px] bg-[#fbfbfb] px-6 py-7">
          <h2 className="m-0 text-[1.35rem] leading-tight font-extrabold tracking-[-0.035em] text-[#252525]">
            어디갈지 모르겠을 땐, 곳곳 AI 추천
          </h2>
          <p className="mt-4 mb-0 text-[0.9rem] leading-relaxed font-medium tracking-[-0.02em] text-[#444444]">
            취향 몇 가지를 입력하면 오늘의 날씨와 동선을 기준으로
            <br />
            곳곳 AI가 가볍게 다녀올 코스를 만들어줘요.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f1e8e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#333333] shadow-[0_3px_12px_rgba(76,49,42,0.12)]"
            type="button"
          >
            곳곳 AI 로 코스 만들기
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        </article>
      </div>
    </section>
  );
}
