import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  authUserQueryKey,
  completeGoogleSignup,
  getAuthErrorMessage,
  getCurrentUser,
  readOAuthReturnTo,
  storeGoogleLogin,
} from "@/features/auth/authStore";

type OAuthCallbackData = {
  accessToken: string | null;
  email: string | null;
  error: string | null;
  expiresIn: number;
  oauthSignupTicket: string | null;
  suggestedName: string;
};

const oauthErrorMessages: Record<string, string> = {
  google_email_missing: "Google 계정에서 이메일 정보를 확인하지 못했습니다.",
  google_login_failed: "Google 로그인에 실패했습니다. 다시 시도해주세요.",
};

function parseOAuthCallback(search: string, hash: string): OAuthCallbackData {
  const searchParams = new URLSearchParams(search);
  const fragmentParams = new URLSearchParams(hash.replace(/^#/, ""));

  return {
    accessToken: fragmentParams.get("accessToken"),
    email: fragmentParams.get("email"),
    error: searchParams.get("error"),
    expiresIn: Number(fragmentParams.get("expiresIn")),
    oauthSignupTicket: fragmentParams.get("oauthSignupTicket"),
    suggestedName: fragmentParams.get("suggestedName") ?? "",
  };
}

export function OAuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const callback = useMemo(
    () => parseOAuthCallback(location.search, location.hash),
    [location.hash, location.search],
  );
  const handledLoginRef = useRef(false);
  const [name, setName] = useState(callback.suggestedName);
  const [loginError, setLoginError] = useState("");
  const completeSignupMutation = useMutation({
    mutationFn: completeGoogleSignup,
    onSuccess: (user) => {
      queryClient.setQueryData(authUserQueryKey, user);
      navigate(readOAuthReturnTo(), { replace: true });
    },
  });

  useEffect(() => {
    window.history.replaceState(null, "", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    if (
      handledLoginRef.current ||
      callback.error ||
      !callback.accessToken ||
      callback.expiresIn <= 0
    ) {
      return;
    }

    handledLoginRef.current = true;
    storeGoogleLogin(callback.accessToken, callback.expiresIn);
    queryClient
      .fetchQuery({ queryFn: getCurrentUser, queryKey: authUserQueryKey })
      .then(() => navigate(readOAuthReturnTo(), { replace: true }))
      .catch((error: unknown) => setLoginError(getAuthErrorMessage(error)));
  }, [callback, navigate, queryClient]);

  function handleCompleteSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!callback.oauthSignupTicket || name.trim().length < 2) return;

    completeSignupMutation.mutate({
      name: name.trim(),
      oauthSignupTicket: callback.oauthSignupTicket,
    });
  }

  if (callback.error || loginError) {
    return (
      <OAuthMessage
        action={() => navigate("/login", { replace: true })}
        actionLabel="로그인으로 돌아가기"
        message={
          loginError ||
          oauthErrorMessages[callback.error ?? ""] ||
          "Google 로그인을 완료하지 못했습니다."
        }
        title="로그인에 문제가 생겼어요"
      />
    );
  }

  if (callback.oauthSignupTicket) {
    const canSubmit = name.trim().length >= 2;

    return (
      <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-white px-5 pt-[calc(48px+env(safe-area-inset-top))] pb-8 text-[#111]">
        <p className="m-0 text-xs font-black tracking-[0.12em] text-[#4285F4]">
          GOOGLE SIGNUP
        </p>
        <h1 className="mt-3 mb-0 text-3xl font-black tracking-[-0.04em]">
          마지막 한 단계만
          <br />
          확인해주세요
        </h1>
        <p className="mt-3 mb-0 text-sm leading-relaxed font-semibold text-[#746F67]">
          {callback.email} 계정으로 동네핀에 가입합니다.
        </p>

        <form className="mt-10" onSubmit={handleCompleteSignup}>
          <label className="block text-sm font-black text-[#555]" htmlFor="oauth-name">
            이름
          </label>
          <input
            autoComplete="name"
            className="mt-3 h-14 w-full rounded-2xl border border-[#DDDAD4] bg-white px-4 text-base font-semibold outline-none transition focus:border-[#4285F4] focus:ring-4 focus:ring-[#4285F4]/10"
            id="oauth-name"
            maxLength={30}
            onChange={(event) => setName(event.target.value)}
            placeholder="서비스에서 사용할 이름"
            value={name}
          />
          <p aria-live="polite" className="mt-4 min-h-5 text-sm font-bold text-[#D63B0B]">
            {completeSignupMutation.isError
              ? getAuthErrorMessage(completeSignupMutation.error)
              : ""}
          </p>
          <button
            className="mt-6 h-14 w-full rounded-2xl border-0 bg-[#111] text-base font-black text-white disabled:bg-[#D5D2CC]"
            disabled={!canSubmit || completeSignupMutation.isPending}
            type="submit"
          >
            {completeSignupMutation.isPending ? "가입 중..." : "Google로 가입 완료"}
          </button>
        </form>
      </main>
    );
  }

  if (!callback.accessToken || callback.expiresIn <= 0) {
    return (
      <OAuthMessage
        action={() => navigate("/login", { replace: true })}
        actionLabel="로그인으로 돌아가기"
        message="OAuth 응답에 필요한 인증 정보가 없습니다."
        title="잘못된 로그인 응답이에요"
      />
    );
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-white p-6 text-center font-black text-[#555]">
      Google 로그인을 마무리하는 중...
    </div>
  );
}

type OAuthMessageProps = {
  action: () => void;
  actionLabel: string;
  message: string;
  title: string;
};

function OAuthMessage({ action, actionLabel, message, title }: OAuthMessageProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-white p-6 text-center text-[#111]">
      <div>
        <h1 className="m-0 text-2xl font-black">{title}</h1>
        <p className="mt-3 mb-0 text-sm font-semibold text-[#746F67]">{message}</p>
        <button
          className="mt-7 h-12 rounded-xl bg-[#111] px-6 text-sm font-black text-white"
          onClick={action}
          type="button"
        >
          {actionLabel}
        </button>
      </div>
    </main>
  );
}
