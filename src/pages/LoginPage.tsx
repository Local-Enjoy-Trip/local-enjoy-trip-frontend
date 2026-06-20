import {
  ArrowLeft,
  ChevronRight,
  LockKeyhole,
  Mail,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  type AuthProvider,
  loginWithProvider,
} from "@/features/auth/authStore";

const loginOptions: Array<{
  description: string;
  label: string;
  provider: AuthProvider;
  tone: string;
  icon: typeof MessageCircle;
}> = [
  {
    description: "친구 공유와 일정 알림까지 바로 연결",
    icon: MessageCircle,
    label: "카카오로 계속하기",
    provider: "kakao",
    tone: "bg-[#FEE500] text-[#191600]",
  },
  {
    description: "저장한 장소와 코스를 여러 기기에서 관리",
    icon: LockKeyhole,
    label: "Google로 계속하기",
    provider: "google",
    tone: "bg-white text-[#1F1F1F] border border-[#E5E2DA]",
  },
  {
    description: "테스트용 계정으로 빠르게 둘러보기",
    icon: Mail,
    label: "이메일로 시작하기",
    provider: "email",
    tone: "bg-[#1F3D35] text-white",
  },
];

export function LoginPage() {
  const navigate = useNavigate();

  function handleLogin(provider: AuthProvider) {
    loginWithProvider(provider);
    navigate("/my", { replace: true });
  }

  return (
    <section className="flex min-h-dvh flex-col bg-[#F6F5F1] px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(28px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="flex h-11 items-center">
        <button
          aria-label="뒤로 가기"
          className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="flex flex-1 flex-col justify-between pt-8">
        <div>
          <div className="grid size-14 place-items-center rounded-2xl bg-[#1F3D35] text-xl font-black text-white shadow-[0_10px_24px_rgba(31,61,53,0.18)]">
            SP
          </div>
          <h1 className="mt-6 mb-0 text-[2rem] leading-tight font-black tracking-normal">
            내 여행을 저장하고
            <br />
            이어서 계획해요
          </h1>
          <p className="mt-3 mb-0 text-[0.98rem] leading-relaxed font-semibold text-[#746F67]">
            찜한 장소, 만든 코스, 친구와 공유한 쪽지를 한 곳에서 관리할 수
            있어요.
          </p>

          <div className="mt-8 grid gap-3">
            {loginOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  className={`flex min-h-[62px] w-full items-center gap-3 rounded-2xl px-4 text-left shadow-[0_8px_18px_rgba(31,38,35,0.05)] ${option.tone}`}
                  key={option.provider}
                  onClick={() => handleLogin(option.provider)}
                  type="button"
                >
                  <span className="grid size-9 flex-none place-items-center rounded-full bg-black/8">
                    <Icon size={19} strokeWidth={2.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[0.98rem] font-black">
                      {option.label}
                    </strong>
                    <span className="mt-0.5 block text-xs font-bold opacity-70">
                      {option.description}
                    </span>
                  </span>
                  <ChevronRight size={19} strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </div>

        <p className="mt-8 mb-0 text-xs leading-relaxed font-semibold text-[#928C83]">
          지금은 개발용 mock 로그인입니다. 실제 계정 연동 시 인증 API와 토큰
          저장 방식만 교체하면 됩니다.
        </p>
      </div>
    </section>
  );
}
