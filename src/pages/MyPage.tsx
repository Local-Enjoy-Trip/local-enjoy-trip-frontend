import { Bell, LogOut, Settings, UserPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";

const menuItems = [
  {
    icon: UsersRound,
    label: "친구 관리",
    detail: "친구 추가와 공개 기록 보기",
  },
  {
    icon: Settings,
    label: "공개 범위 기본값",
    detail: "쪽지와 코스 공개 범위 설정",
  },
  { icon: UserPlus, label: "취향 설정", detail: "날씨, 이동방식, 관심사" },
  { icon: Bell, label: "알림 설정", detail: "근처 쪽지와 친구 공유 알림" },
  { icon: LogOut, label: "로그아웃", detail: "계정 연결 후 활성화" },
];

export function MyPage() {
  return (
    <section className="p-[22px_18px_28px]">
      <PageHeader
        eyebrow="프로필"
        title="마이페이지"
        description="개인 설정과 친구 공개 범위를 관리합니다."
      />

      <article className="mb-[18px] flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4">
        <div className="grid h-[58px] w-[58px] flex-none place-items-center rounded-full bg-[#116149] text-xl font-black text-[#fffaf0]">
          동
        </div>
        <div>
          <h2 className="m-0 text-xl font-extrabold">동네핀 사용자</h2>
          <p className="mt-1 mb-0 text-[#6f6a60]">망원 · 성수 탐색 중</p>
        </div>
      </article>

      <div className="grid gap-2.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white p-4 text-left text-[#24231f]"
              key={item.label}
              type="button"
            >
              <Icon size={21} />
              <span className="grid gap-1">
                <strong>{item.label}</strong>
                <small className="leading-normal text-[#6f6a60]">
                  {item.detail}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
