import { useEffect, useState } from "react";

export type AuthProvider = "google" | "email";

export type AuthUser = {
  id: string;
  area: string;
  avatarColor: string;
  email: string;
  name: string;
  provider: AuthProvider;
  travelStyle: string;
};

const AUTH_STORAGE_KEY = "local-enjoy-trip-auth-user";
let memoryUser: AuthUser | null = null;

const mockUsers: Record<AuthProvider, AuthUser> = {
  email: {
    id: "user-email",
    area: "망원 · 성수",
    avatarColor: "#1F3D35",
    email: "local@spot.dev",
    name: "동네핀 사용자",
    provider: "email",
    travelStyle: "로컬 산책",
  },
  google: {
    id: "user-google",
    area: "서울 동네 탐색",
    avatarColor: "#4B8DFF",
    email: "google.user@spot.dev",
    name: "구글 여행자",
    provider: "google",
    travelStyle: "카페 · 전시",
  },
};

function readStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    if (!window.localStorage) return memoryUser;

    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as AuthUser;
    if (user.provider !== "google" && user.provider !== "email") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return user;
  } catch {
    return memoryUser;
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event("local-enjoy-trip-auth-change"));
}

export function loginWithProvider(provider: AuthProvider) {
  const user = mockUsers[provider];

  memoryUser = user;

  try {
    window.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Some embedded browser contexts disable localStorage; keep this session in memory.
  }

  notifyAuthChange();
  return user;
}

export function startGoogleLogin(returnTo?: string) {
  const googleAuthUrl = import.meta.env.VITE_GOOGLE_AUTH_URL as string | undefined;

  if (!googleAuthUrl) return false;

  const authUrl = new URL(googleAuthUrl, window.location.origin);

  if (returnTo) {
    authUrl.searchParams.set("returnTo", returnTo);
  }

  window.location.assign(authUrl.toString());
  return true;
}

type EmailRegistration = {
  email: string;
  name: string;
};

export function registerWithEmail({ email, name }: EmailRegistration) {
  const user: AuthUser = {
    id: `user-${Date.now()}`,
    area: "관심 동네를 설정해주세요",
    avatarColor: "#FF4300",
    email,
    name,
    provider: "email",
    travelStyle: "취향을 설정해주세요",
  };

  memoryUser = user;

  try {
    window.localStorage?.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Some embedded browser contexts disable localStorage; keep this session in memory.
  }

  notifyAuthChange();
  return user;
}

export function logout() {
  memoryUser = null;

  try {
    window.localStorage?.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Memory fallback is already cleared.
  }

  notifyAuthChange();
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    function syncUser() {
      setUser(readStoredUser());
    }

    window.addEventListener("storage", syncUser);
    window.addEventListener("local-enjoy-trip-auth-change", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("local-enjoy-trip-auth-change", syncUser);
    };
  }, []);

  return user;
}
