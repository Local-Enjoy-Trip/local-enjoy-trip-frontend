import { SectionHeader } from "@/shared/ui/SectionHeader";
import { Link } from "react-router-dom";

type CuratedCourse = {
  id: string;
  badge: string;
  title: string;
  imageUrl: string;
  stops: string[];
};

const curatedCourses: CuratedCourse[] = [
  {
    id: "course-1",
    badge: "산책 코스",
    title: "중랑천-어린이대공원 산책",
    imageUrl:
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=720&q=85",
    stops: ["장안동 터크립 카페", "중랑천 산책길", "군자교", "어린이대공원"],
  },
  {
    id: "course-ai-river",
    badge: "반나절 힐링 코스",
    title: "장안동 반나절 힐링 코스",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=720&q=85",
    stops: ["카페 정화", "잇선", "배봉산 숲속 도서관", "배봉산 정상"],
  },
];

function CourseRoute({ stops }: { stops: string[] }) {
  return (
    <ol className="mt-1.5 mb-0 list-none p-0">
      {stops.map((stop, index) => (
        <li className="relative flex min-h-5 items-start pl-5" key={stop}>
          {index < stops.length - 1 ? (
            <span className="absolute top-3 bottom-[-12px] left-[5px] border-l border-dashed border-[#FD4003]" />
          ) : null}
          <span className="absolute top-[7px] left-0 size-[11px] rounded-full border-[3px] border-white bg-[#FD4003]" />
          <span className="truncate text-[0.625rem] leading-5 text-[#202020]">
            {stop}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CourseCurationSection() {
  return (
    <section className="mt-8">
      <SectionHeader title="이곳저곳 인기 큐레이션" actionTo="/course" />
      <div className="flex snap-x scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden">
        {curatedCourses.map((course) => (
          <Link
            className="w-[200px] flex-none snap-start text-inherit no-underline"
            key={course.id}
            to={`/course/${course.id}`}
          >
            <article className="h-[310px] overflow-hidden rounded-[20px] border border-[#BDBDBD] bg-white shadow-[0_2px_4px_rgba(17,17,17,0.04)]">
              <div className="relative h-[170px] overflow-hidden">
                <img
                  alt=""
                  className="block h-full w-full object-cover"
                  loading="lazy"
                  src={course.imageUrl}
                />
                <span className="absolute top-3 left-3 rounded-full bg-white px-2 py-1 text-[0.625rem] font-extrabold text-[#202020] shadow-[0_2px_6px_rgba(17,17,17,0.08)]">
                  {course.badge}
                </span>
              </div>
              <div className="h-[140px] px-4 pt-3.5 pb-3">
                <p className="m-0 truncate text-[13px] leading-snug font-bold tracking-[-0.02em] text-[#202020]">
                  {course.title}
                </p>
                <CourseRoute stops={course.stops} />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
