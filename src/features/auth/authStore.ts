import { useEffect, useState } from "react";

export type AuthProvider = "kakao" | "google" | "email";

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
  kakao: {
    id: "user-kakao",
    area: "망원 · 한강",
    avatarColor: "#FFB800",
    email: "kakao.user@spot.dev",
    name: "카카오 여행자",
    provider: "kakao",
    travelStyle: "맛집 중심",
  },
};

function readStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    if (!window.localStorage) return memoryUser;

    const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
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
