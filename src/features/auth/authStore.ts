import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  apiGet,
  apiPost,
  apiPut,
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
  nickname?: string;
  profileImageUrl?: string;
  provider: AuthProvider;
  realName: string;
  travelStyle: string;
};

type LoginRequest = {
  password: string;
  userId: string;
};

type EmailLoginRequest = {
  email: string;
  password: string;
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

type UsersResponse = {
  users: UserResponse[];
};

type EmailCheckResponse =
  | boolean
  | {
      available?: boolean;
      duplicate?: boolean;
      duplicated?: boolean;
      exists?: boolean;
      isAvailable?: boolean;
      isDuplicate?: boolean;
    };

type ProfileImagePresignedUploadResponse = {
  expiresAt: string;
  objectKey: string;
  publicUrl?: string;
  uploadUrl: string;
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
    nickname: user.nickname?.trim() || undefined,
    profileImageUrl: user.profileImageUrl ?? undefined,
    provider,
    realName: user.name,
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

export async function loginWithEmailAddress(request: EmailLoginRequest) {
  const member = await findMemberByEmail(request.email);

  if (!member) {
    throw new ApiError("가입된 이메일을 찾을 수 없어요.", 404);
  }

  return loginWithEmail({
    password: request.password,
    userId: member.userId,
  });
}

export async function signupWithEmail(request: SignupRequest) {
  return apiPost<string>("/api/members", request);
}

export async function uploadProfileImage(file: File) {
  const contentType = file.type || "image/jpeg";
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
  const upload = await apiPost<ProfileImagePresignedUploadResponse>(
    "/api/members/me/profile-image/presigned-upload",
    { contentType, fileExtension: extension },
  );

  const uploadResponse = await fetch(upload.uploadUrl, {
    body: file,
    headers: { "Content-Type": contentType },
    method: "PUT",
  });

  if (!uploadResponse.ok) {
    throw new Error("프로필 이미지를 업로드하지 못했어요.");
  }

  await apiPut<void>("/api/members/me/profile-image", {
    contentType,
    objectKey: upload.objectKey,
  });
}

export async function updateNickname(nickname: string) {
  await apiPut<void>("/api/members/me", { nickname });
}

export async function getMembers() {
  const response = await apiGet<UsersResponse>("/api/members");
  return response.users;
}

export async function findMemberByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await getMembers();

  return (
    users.find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

export async function checkEmailAvailability(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const response = await apiGet<EmailCheckResponse>(
    `/api/members/check-email?email=${encodeURIComponent(normalizedEmail)}`,
  );

  if (typeof response === "boolean") return { available: response };
  if (typeof response.available === "boolean") return { available: response.available };
  if (typeof response.isAvailable === "boolean") {
    return { available: response.isAvailable };
  }

  const duplicated =
    response.duplicated ?? response.duplicate ?? response.isDuplicate ?? response.exists;

  return { available: duplicated === undefined ? false : !duplicated };
}

export function createSignupUserId(email: string) {
  const [localPart = "user"] = email.trim().toLowerCase().split("@");
  const base =
    localPart
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 12) || "user";
  const paddedBase = base.length >= 4 ? base : `${base}${"user".slice(base.length)}`;
  let hash = 0;

  for (const char of email.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return `${paddedBase.slice(0, 13)}_${hash.toString(36).slice(0, 6)}`.slice(
    0,
    20,
  );
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
