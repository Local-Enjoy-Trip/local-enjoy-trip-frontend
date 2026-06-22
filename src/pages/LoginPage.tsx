import { startGoogleLogin } from "@/features/auth/authStore";
import { SpotLogo } from "@/shared/ui/SpotLogo";
import { ChevronRight, Mail } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type LoginRouteState = {
  returnTo?: string;
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.01v2.55h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.39 13.92A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.92V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.63C7.18 7.71 9.39 5.95 12 5.95Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const routeState = location.state as LoginRouteState | null;

  function handleGoogleLogin() {
    const started = startGoogleLogin(routeState?.returnTo);

    if (!started) {
      setMessage("Google 로그인 연결 정보가 아직 설정되지 않았어요.");
    }
  }

  return (
    <section className="flex min-h-dvh flex-col bg-white px-3.5 pt-[calc(24px+env(safe-area-inset-top))] pb-[calc(40px+env(safe-area-inset-bottom))] text-[#111]">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center pb-20">
          <SpotLogo className="w-[82px]" />
          <p className="mt-7 text-center text-[20px] leading-[1.45] font-semibold tracking-[-0.03em] text-[#333]">
            나만 알고싶은 이<span className="text-[#FF4300]">곳</span>저<span className="text-[#FF4300]">곳</span>을
            <br />
            공유하고 발견하는 로컬지도
          </p>
        </div>

        <div className="grid gap-2.5">
          <button
            className="flex h-11 w-full items-center gap-3 rounded-xl border border-[#E5E2DA] bg-white px-3 text-left font-medium shadow-[0_4px_12px_rgba(31,38,35,0.04)]"
            onClick={handleGoogleLogin}
            type="button"
          >
            <span className="grid size-7 place-items-center rounded-full bg-white shadow-[0_0_0_1px_rgba(17,17,17,0.07)]">
              <GoogleIcon />
            </span>
            <span className="flex-1 text-center text-sm">Google로 계속하기</span>
            <ChevronRight className="text-[#888]" size={16} />
          </button>

          <button
            className="flex h-11 w-full items-center gap-3 rounded-xl border-0 bg-[#111] px-3 text-left font-medium text-white shadow-[0_6px_14px_rgba(17,17,17,0.14)]"
            onClick={() =>
              navigate("/login/email", {
                state: { returnTo: routeState?.returnTo },
              })
            }
            type="button"
          >
            <span className="grid size-7 place-items-center rounded-full bg-white/10">
              <Mail size={16} />
            </span>
            <span className="flex-1 text-center text-sm">아이디로 계속하기</span>
            <ChevronRight className="text-white/70" size={16} />
          </button>
        </div>

        <button
          className="mx-auto mt-2 border-0 bg-transparent text-[10px]! font-medium text-[#777] underline underline-offset-2"
          onClick={() => setMessage("계정 찾기 기능은 준비 중이에요.")}
          type="button"
        >
          아이디/비밀번호를 잊으셨나요?
        </button>

        <p
          aria-live="polite"
          className="mt-1 min-h-4 text-center text-[10px] font-bold text-red-500"
        >
          {message}
        </p>
      </div>
    </section>
  );
}
