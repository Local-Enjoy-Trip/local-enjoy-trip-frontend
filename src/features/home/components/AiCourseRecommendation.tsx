import { ArrowRight } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export function AiCourseRecommendation() {
  return (
    <section className="mt-8 px-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[1.45rem] leading-tight font-bold text-black">
          사용자 맞춤 SPOT AI 코스 추천
        </h2>
      </div>
      <article className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_14px_34px_rgba(17,17,17,0.09)]">
        <BorderBeam size={82} duration={8} borderWidth={1.5} />
        <button
          className="absolute right-5 top-7 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-sm font-black text-white"
          type="button"
        >
          <ArrowRight size={16} strokeWidth={3} />
        </button>
        <div className="pr-16">
          <h3 className="text-[1.2rem] leading-tight font-semibold text-[#111111]">
            어디갈지 모르겠을 때,
            <br />
            SPOT AI로 추천받기
          </h3>
          <p className="mt-4 mb-0 text-sm leading-relaxed font-bold text-[#333333]">
            취향 몇 가지를 고르면 오늘 날씨와 동선을 기준으로 가볍게 다녀올
            코스를 만들어줘요.
          </p>
        </div>
      </article>
    </section>
  );
}
