import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  apiGet,
  apiPost,
  AUTH_TOKEN_STORAGE_KEY,
} from "@/shared/api/http";

export type AuthProvider = "google" | "email";

type UserResponse = {
  createdAt: string;
  email: string;
  name: string;
  nickname?: string | null;
  profileImageUrl?: string | null;
  representativeLatitude?: number | null;
  representativeLongitude?: number | null;
  representativeRegionName?: string | null;
  userId: string;
};

export type AuthUser = {
  area: string;
  avatarColor: string;
  email: string;
  id: string;
  name: string;
  profileImageUrl?: string;
  provider: AuthProvider;
  travelStyle: string;
};

type LoginRequest = {
  password: string;
  userId: string;
};

type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  user: UserResponse;
};

export type SignupRequest = {
  email: string;
  name: string;
  nickname: string;
  password: string;
  userId: string;
};

type MeResponse = {
  user: UserResponse;
};

const AUTH_USER_ID_STORAGE_KEY = "local-enjoy-trip-auth-user-id";
const AUTH_EXPIRES_AT_STORAGE_KEY = "local-enjoy-trip-auth-expires-at";
const AUTH_PROVIDER_STORAGE_KEY = "local-enjoy-trip-auth-provider";

export const authUserQueryKey = ["auth", "me"] as const;

function toAuthUser(user: UserResponse, provider: AuthProvider = "email"): AuthUser {
  return {
    area: user.representativeRegionName ?? "관심 동네를 설정해주세요",
    avatarColor: "#1F3D35",
    email: user.email,
    id: user.userId,
    name: user.nickname?.trim() || user.name,
    profileImageUrl: user.profileImageUrl ?? undefined,
    provider,
    travelStyle: "취향을 설정해주세요",
  };
}

function storeSession(
  accessToken: string,
  expiresIn: number,
  provider: AuthProvider,
  userId?: string,
) {
  const expiresAt = Date.now() + expiresIn * 1000;

  window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
  window.sessionStorage.setItem(AUTH_EXPIRES_AT_STORAGE_KEY, String(expiresAt));
  window.sessionStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, provider);
  if (userId) window.sessionStorage.setItem(AUTH_USER_ID_STORAGE_KEY, userId);
}

export function clearAuthSession() {
  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_USER_ID_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_EXPIRES_AT_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY);
  } catch {
    // The in-memory query cache is cleared by the caller.
  }
}

export function hasAuthSession() {
  try {
    const token = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const expiresAt = Number(
      window.sessionStorage.getItem(AUTH_EXPIRES_AT_STORAGE_KEY),
    );

    if (!token || !expiresAt || expiresAt <= Date.now()) {
      clearAuthSession();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function loginWithEmail(request: LoginRequest) {
  const response = await apiPost<LoginResponse>("/api/members/login", request);
  storeSession(
    response.accessToken,
    response.expiresIn,
    "email",
    response.user.userId,
  );
  return toAuthUser(response.user);
}

export async function signupWithEmail(request: SignupRequest) {
  return apiPost<string>("/api/members", request);
}

export async function completeGoogleSignup(request: {
  name: string;
  nickname: string;
  oauthSignupTicket: string;
}) {
  const response = await apiPost<LoginResponse>("/api/members/oauth", request);
  storeSession(
    response.accessToken,
    response.expiresIn,
    "google",
    response.user.userId,
  );
  return toAuthUser(response.user, "google");
}

export function storeGoogleLogin(accessToken: string, expiresIn: number) {
  storeSession(accessToken, expiresIn, "google");
}

export async function getCurrentUser() {
  try {
    const response = await apiGet<MeResponse>("/api/members/me");
    const provider =
      window.sessionStorage.getItem(AUTH_PROVIDER_STORAGE_KEY) === "google"
        ? "google"
        : "email";
    window.sessionStorage.setItem(AUTH_USER_ID_STORAGE_KEY, response.user.userId);
    return toAuthUser(response.user, provider);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAuthSession();
    throw error;
  }
}

export async function logout() {
  const userId = window.sessionStorage.getItem(AUTH_USER_ID_STORAGE_KEY);

  try {
    if (userId) await apiPost<string>("/api/members/logout", { userId });
  } finally {
    clearAuthSession();
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export function startGoogleLogin(returnTo?: string) {
  if (returnTo) window.sessionStorage.setItem("oauth-return-to", returnTo);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? window.location.origin;
  window.location.assign(
    new URL("/oauth2/authorization/google", apiBaseUrl).toString(),
  );
  return true;
}

export function readOAuthReturnTo() {
  const returnTo = window.sessionStorage.getItem("oauth-return-to") ?? "/my";
  window.sessionStorage.removeItem("oauth-return-to");
  return returnTo;
}

export function useAuthUser() {
  return useQuery({
    enabled: hasAuthSession(),
    queryFn: getCurrentUser,
    queryKey: authUserQueryKey,
    retry: false,
  });
}
