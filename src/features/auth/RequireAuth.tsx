import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  clearAuthSession,
  hasAuthSession,
  useAuthUser,
} from "@/features/auth/authStore";
import { PageLoadingSkeleton } from "@/shared/ui/Skeleton";

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasSession = hasAuthSession();
  const authQuery = useAuthUser();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  if (!hasSession) {
    return <Navigate replace state={{ returnTo }} to="/login" />;
  }

  if (authQuery.isLoading) {
    return <PageLoadingSkeleton type="profile" />;
  }

  if (authQuery.isError) {
    return (
      <main className="grid min-h-dvh place-items-center bg-white p-6 text-center text-[#111]">
        <div>
          <h1 className="m-0 text-2xl font-black">로그인 정보를 확인하지 못했어요</h1>
          <p className="mt-3 mb-0 text-sm font-semibold text-[#746F67]">
            연결을 확인하고 다시 시도하거나 로그인부터 다시 진행해주세요.
          </p>
          <div className="mt-7 flex justify-center gap-2">
            <button
              className="h-12 rounded-xl bg-[#F1EFEA] px-5 text-sm font-black text-[#333]"
              onClick={() => authQuery.refetch()}
              type="button"
            >
              다시 시도
            </button>
            <button
              className="h-12 rounded-xl bg-[#111] px-5 text-sm font-black text-white"
              onClick={() => {
                clearAuthSession();
                navigate("/login", { replace: true, state: { returnTo } });
              }}
              type="button"
            >
              다시 로그인
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!authQuery.data) {
    return <Navigate replace state={{ returnTo }} to="/login" />;
  }

  return children;
}
