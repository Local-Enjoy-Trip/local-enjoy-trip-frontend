import { MapPinned } from "lucide-react";
import { SectionHeader } from "@/shared/ui/SectionHeader";

export function CourseCurationSection({ location }: { location: string }) {
  return (
    <section className="mt-8">
      <SectionHeader title="이곳저곳 인기 큐레이션" actionTo="/course" />
      <div className="mx-5 grid min-h-36 place-items-center rounded-[20px] bg-[#F7F6F3] px-6 text-center">
        <div>
          <MapPinned className="mx-auto text-[#FD4003]" size={26} />
          <p className="mt-3 mb-0 text-sm font-extrabold text-[#302E2A]">
            {location} 인기 코스를 준비하고 있어요
          </p>
          <p className="mt-1.5 mb-0 text-xs font-semibold text-[#817A71]">
            동네별 공개 코스 API가 연결되면 바로 보여드릴게요.
          </p>
        </div>
      </div>
    </section>
  );
}
