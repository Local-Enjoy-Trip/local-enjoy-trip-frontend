import {
  Bell,
  Bookmark,
  ChevronRight,
  Heart,
  LogOut,
  MapPinned,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout, useAuthUser } from "@/features/auth/authStore";
import { courses, notes, places } from "@/shared/data/mockData";

const menuItems = [
  {
    icon: UsersRound,
    label: "친구 관리",
    detail: "친구 추가와 공개 기록 보기",
  },
  {
    icon: ShieldCheck,
    label: "공개 범위 기본값",
    detail: "쪽지와 코스 공개 범위 설정",
  },
  { icon: Sparkles, label: "취향 설정", detail: "날씨, 이동방식, 관심사" },
  { icon: Bell, label: "알림 설정", detail: "근처 쪽지와 친구 공유 알림" },
  { icon: Settings, label: "앱 설정", detail: "테마, 위치 권한, 데이터 관리" },
];

const savedPlaceCount = places.filter((place) => place.saved).length;
const savedNoteCount = notes.filter((note) => note.saved).length;
const privateCourseCount = courses.filter(
  (course) => course.visibility === "private",
).length;

function LoginPrompt() {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-[#F8F7F3] px-5 pt-[calc(28px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <header>
        <p className="m-0 text-xs font-black tracking-[0.12em] text-[#8B857C]">
          MY
        </p>
        <h1 className="mt-2 mb-0 text-[2rem] leading-tight font-black">
          로그인하고
          <br />
          내 여행을 이어가요
        </h1>
      </header>

      <article className="mt-8 rounded-2xl bg-white p-5 shadow-[0_10px_28px_rgba(31,38,35,0.06)]">
        <div className="grid size-14 place-items-center rounded-2xl bg-[#1F3D35] text-white">
          <UserRound size={28} strokeWidth={2.4} />
        </div>
        <h2 className="mt-5 mb-0 text-xl font-black">
          저장한 장소와 코스를 한 곳에
        </h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#746F67]">
          찜한 장소, 만든 여행 코스, 친구 공개 범위를 계정에 연결해 관리할 수
          있어요.
        </p>

        <button
          className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#1F3D35] text-sm font-black text-white"
          onClick={() => navigate("/login")}
          type="button"
        >
          로그인하기
        </button>
      </article>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "찜한 장소", value: savedPlaceCount },
          { label: "내 코스", value: courses.length },
          { label: "저장 쪽지", value: savedNoteCount },
        ].map((item) => (
          <div className="rounded-xl bg-white p-3" key={item.label}>
            <p className="m-0 text-xs font-black text-[#8B857C]">
              {item.label}
            </p>
            <strong className="mt-1 block text-xl font-black">
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MyPage() {
  const navigate = useNavigate();
  const user = useAuthUser();

  if (!user) {
    return <LoginPrompt />;
  }

  function handleLogout() {
    logout();
    navigate("/my", { replace: true });
  }

  return (
    <section className="min-h-screen bg-[#F8F7F3] px-5 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 text-xs font-black tracking-[0.12em] text-[#8B857C]">
            MY
          </p>
          <h1 className="mt-1 mb-0 text-[2rem] leading-tight font-black">
            마이
          </h1>
        </div>
        <button
          aria-label="설정"
          className="grid size-11 place-items-center rounded-full bg-white text-[#333] shadow-[0_8px_18px_rgba(31,38,35,0.06)]"
          type="button"
        >
          <Settings size={22} />
        </button>
      </header>

      <article className="mt-6 rounded-2xl bg-white p-4 shadow-[0_10px_28px_rgba(31,38,35,0.06)]">
        <div className="flex items-center gap-3">
          <div
            className="grid size-16 flex-none place-items-center rounded-2xl text-xl font-black text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 truncate text-xl font-black">{user.name}</h2>
            <p className="mt-1 mb-0 truncate text-sm font-bold text-[#746F67]">
              {user.email}
            </p>
            <p className="mt-1 mb-0 text-xs font-black text-[#8B857C]">
              {user.area} · {user.travelStyle}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Heart, label: "찜", value: savedPlaceCount },
            { icon: MapPinned, label: "코스", value: courses.length },
            { icon: Bookmark, label: "쪽지", value: savedNoteCount },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div className="rounded-xl bg-[#F6F5F1] p-3" key={item.label}>
                <Icon size={16} className="text-[#746F67]" />
                <strong className="mt-2 block text-lg font-black">
                  {item.value}
                </strong>
                <span className="text-xs font-black text-[#8B857C]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </article>

      <section className="mt-5">
        <h2 className="m-0 text-base font-black">여행 상태</h2>
        <div className="mt-3 grid gap-2">
          <button
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-[0_8px_20px_rgba(31,38,35,0.04)]"
            onClick={() => navigate("/course")}
            type="button"
          >
            <span>
              <strong className="block text-sm font-black">
                비공개 코스 {privateCourseCount}개
              </strong>
              <small className="mt-1 block text-xs font-bold text-[#8B857C]">
                친구에게 공유하기 전까지 나만 볼 수 있어요.
              </small>
            </span>
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="m-0 text-base font-black">계정 관리</h2>
        <div className="mt-3 grid gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left text-[#24231f] shadow-[0_8px_20px_rgba(31,38,35,0.04)]"
                key={item.label}
                type="button"
              >
                <span className="grid size-9 flex-none place-items-center rounded-full bg-[#F4F3EF]">
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-black">
                    {item.label}
                  </strong>
                  <small className="mt-1 block truncate text-xs font-bold text-[#8B857C]">
                    {item.detail}
                  </small>
                </span>
                <ChevronRight size={18} className="text-[#AAA49B]" />
              </button>
            );
          })}

          <button
            className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left text-[#D5483D] shadow-[0_8px_20px_rgba(31,38,35,0.04)]"
            onClick={handleLogout}
            type="button"
          >
            <span className="grid size-9 flex-none place-items-center rounded-full bg-[#FFF0EE]">
              <LogOut size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">로그아웃</strong>
              <small className="mt-1 block text-xs font-bold text-[#B36A64]">
                이 기기에서 mock session을 지웁니다.
              </small>
            </span>
          </button>
        </div>
      </section>
    </section>
  );
}
