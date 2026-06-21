import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithProvider } from "@/features/auth/authStore";

type EmailLoginRouteState = {
  returnTo?: string;
};

export function EmailLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const routeState = location.state as EmailLoginRouteState | null;
  const canSubmit = email.trim().length > 0 && password.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    loginWithProvider("email");
    navigate(routeState?.returnTo ?? "/my", { replace: true });
  }

  return (
    <section className="min-h-dvh bg-white px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(28px+env(safe-area-inset-bottom))] text-[#111]">
      <header className="grid h-12 grid-cols-[40px_1fr_40px] items-center">
        <button
          aria-label="뒤로 가기"
          className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={25} />
        </button>
        <h1 className="m-0 text-center text-xl font-black">이메일로 로그인</h1>
      </header>

      <form className="mt-12" onSubmit={handleSubmit}>
        <label className="block text-sm font-black text-[#555]" htmlFor="login-email">
          이메일 주소
        </label>
        <input
          autoComplete="email"
          className="mt-3 h-14 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
          id="login-email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ID@example.com"
          type="email"
          value={email}
        />

        <label className="mt-7 block text-sm font-black text-[#555]" htmlFor="login-password">
          비밀번호
        </label>
        <div className="relative mt-3">
          <input
            autoComplete="current-password"
            className="h-14 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 pr-12 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
            id="login-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력해주세요."
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute inset-y-0 right-1 grid w-11 place-items-center border-0 bg-transparent text-[#777]"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          className="mt-10 h-14 w-full rounded-2xl border-0 bg-[#FF4300] text-base font-black text-white transition disabled:cursor-not-allowed disabled:bg-[#F0D1C6]"
          disabled={!canSubmit}
          type="submit"
        >
          로그인하기
        </button>
      </form>

      <button
        className="mx-auto mt-8 block border-0 bg-transparent text-sm font-black text-[#333] underline decoration-[#FF4300] decoration-2 underline-offset-4"
        onClick={() => navigate("/signup", { state: routeState })}
        type="button"
      >
        회원가입
      </button>
    </section>
  );
}
