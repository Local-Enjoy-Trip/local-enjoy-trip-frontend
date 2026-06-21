import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  authUserQueryKey,
  getAuthErrorMessage,
  loginWithEmail,
} from "@/features/auth/authStore";

type EmailLoginRouteState = {
  returnTo?: string;
  signupSuccess?: boolean;
};

export function EmailLoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const routeState = location.state as EmailLoginRouteState | null;
  const canSubmit = userId.trim().length > 0 && password.length > 0;
  const loginMutation = useMutation({
    mutationFn: loginWithEmail,
    onSuccess: (user) => {
      queryClient.setQueryData(authUserQueryKey, user);
      navigate(routeState?.returnTo ?? "/my", { replace: true });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    loginMutation.mutate({ password, userId: userId.trim() });
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
        <h1 className="m-0 text-center text-xl font-black">아이디로 로그인</h1>
      </header>

      <form className="mt-12" onSubmit={handleSubmit}>
        {routeState?.signupSuccess ? (
          <p
            aria-live="polite"
            className="mb-6 rounded-2xl bg-[#EEF7F2] px-4 py-3 text-sm font-bold text-[#1F6B4F]"
          >
            회원가입이 완료됐어요. 새 아이디로 로그인해주세요.
          </p>
        ) : null}
        <label className="block text-sm font-black text-[#555]" htmlFor="login-user-id">
          아이디
        </label>
        <input
          autoComplete="username"
          className="mt-3 h-14 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
          id="login-user-id"
          onChange={(event) => setUserId(event.target.value)}
          placeholder="아이디를 입력해주세요."
          value={userId}
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

        <p aria-live="polite" className="mt-4 min-h-5 text-sm font-bold text-[#D63B0B]">
          {loginMutation.isError
            ? getAuthErrorMessage(loginMutation.error)
            : ""}
        </p>

        <button
          className="mt-10 h-14 w-full rounded-2xl border-0 bg-[#FF4300] text-base font-black text-white transition disabled:cursor-not-allowed disabled:bg-[#F0D1C6]"
          disabled={!canSubmit || loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending ? "로그인 중..." : "로그인하기"}
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
