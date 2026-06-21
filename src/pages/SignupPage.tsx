import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { registerWithEmail } from "@/features/auth/authStore";

type SignupRouteState = {
  returnTo?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const routeState = location.state as SignupRouteState | null;

  const hasEmailError = email.length > 0 && !emailPattern.test(email);
  const hasNicknameError = nickname.length > 0 && nickname.trim().length < 2;
  const hasPasswordError = password.length > 0 && password.length < 8;
  const hasPasswordConfirmError =
    passwordConfirm.length > 0 && password !== passwordConfirm;
  const canSubmit =
    emailPattern.test(email) &&
    nickname.trim().length >= 2 &&
    password.length >= 8 &&
    password === passwordConfirm &&
    agreedToTerms;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

    registerWithEmail({ email: email.trim(), name: nickname.trim() });
    navigate(routeState?.returnTo ?? "/my", { replace: true });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-white px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(28px+env(safe-area-inset-bottom))] text-[#111] shadow-[0_0_0_1px_rgba(17,17,17,0.06)] sm:my-6 sm:min-h-[calc(100dvh-48px)] sm:rounded-3xl">
      <header className="grid h-12 grid-cols-[40px_1fr_40px] items-center">
        <button
          aria-label="뒤로 가기"
          className="grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#333]"
          onClick={() => navigate(-1)}
          type="button"
        >
          <ArrowLeft size={25} />
        </button>
        <h1 className="m-0 text-center text-xl font-black">회원가입</h1>
      </header>

      <form className="mt-8" noValidate onSubmit={handleSubmit}>
        <FieldLabel htmlFor="signup-email">이메일 주소</FieldLabel>
        <input
          autoComplete="email"
          aria-describedby={hasEmailError ? "signup-email-error" : undefined}
          aria-invalid={hasEmailError}
          className="mt-2.5 h-13 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
          id="signup-email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="ID@example.com"
          type="email"
          value={email}
        />
        <FieldError id="signup-email-error" visible={hasEmailError}>
          이메일 형식을 확인해주세요.
        </FieldError>

        <FieldLabel className="mt-4" htmlFor="signup-nickname">
          닉네임
        </FieldLabel>
        <input
          autoComplete="nickname"
          aria-describedby={hasNicknameError ? "signup-nickname-error" : undefined}
          aria-invalid={hasNicknameError}
          className="mt-2.5 h-13 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
          id="signup-nickname"
          maxLength={20}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="2~20자로 입력해주세요."
          value={nickname}
        />
        <FieldError id="signup-nickname-error" visible={hasNicknameError}>
          닉네임은 2자 이상 입력해주세요.
        </FieldError>

        <FieldLabel className="mt-4" htmlFor="signup-password">
          비밀번호
        </FieldLabel>
        <div className="relative mt-2.5">
          <input
            autoComplete="new-password"
            aria-describedby={hasPasswordError ? "signup-password-error" : undefined}
            aria-invalid={hasPasswordError}
            className="h-13 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 pr-12 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
            id="signup-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상 입력해주세요."
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
        <FieldError id="signup-password-error" visible={hasPasswordError}>
          비밀번호는 8자 이상 입력해주세요.
        </FieldError>

        <FieldLabel className="mt-4" htmlFor="signup-password-confirm">
          비밀번호 확인
        </FieldLabel>
        <input
          autoComplete="new-password"
          aria-describedby={
            hasPasswordConfirmError ? "signup-password-confirm-error" : undefined
          }
          aria-invalid={hasPasswordConfirmError}
          className="mt-2.5 h-13 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#FF4300] focus:ring-4 focus:ring-[#FF4300]/10"
          id="signup-password-confirm"
          onChange={(event) => setPasswordConfirm(event.target.value)}
          placeholder="비밀번호를 한 번 더 입력해주세요."
          type={showPassword ? "text" : "password"}
          value={passwordConfirm}
        />
        <FieldError id="signup-password-confirm-error" visible={hasPasswordConfirmError}>
          비밀번호가 일치하지 않아요.
        </FieldError>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#FFF4F0] p-4 text-sm font-bold text-[#444]">
          <input
            checked={agreedToTerms}
            className="peer sr-only"
            onChange={(event) => setAgreedToTerms(event.target.checked)}
            type="checkbox"
          />
          <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-md border-2 border-[#C7C2BA] bg-white text-transparent peer-checked:border-[#FF4300] peer-checked:bg-[#FF4300] peer-checked:text-white">
            <Check size={14} strokeWidth={3} />
          </span>
          <span>
            <strong className="text-[#FF4300]">[필수]</strong> 서비스 이용약관 및
            개인정보 처리방침에 동의합니다.
          </span>
        </label>

        <button
          className="mt-6 h-14 w-full rounded-2xl border-0 bg-[#FF4300] text-base font-black text-white transition disabled:cursor-not-allowed disabled:bg-[#F0D1C6]"
          disabled={!canSubmit}
          type="submit"
        >
          가입하기
        </button>
      </form>

      <button
        className="mx-auto mt-6 block border-0 bg-transparent text-sm font-bold text-[#555] underline decoration-[#FF4300] underline-offset-4"
        onClick={() => navigate("/login/email", { state: routeState })}
        type="button"
      >
        이미 계정이 있으신가요? 로그인
      </button>
    </main>
  );
}

type FieldLabelProps = {
  children: string;
  className?: string;
  htmlFor: string;
};

function FieldLabel({ children, className = "", htmlFor }: FieldLabelProps) {
  return (
    <label className={`block text-sm font-black text-[#555] ${className}`} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

type FieldErrorProps = {
  children: string;
  id: string;
  visible: boolean;
};

function FieldError({ children, id, visible }: FieldErrorProps) {
  return (
    <p className="mt-1.5 min-h-4 text-xs font-bold text-[#D63B0B]" id={id}>
      {visible ? children : ""}
    </p>
  );
}
