import type { Coordinates } from "@/shared/types/domain";
import type { KakaoBounds } from "../types";

const kakaoScriptId = "kakao-map-sdk";
const kakaoLoadTimeoutMs = 20000;
type KakaoLoadStatus = "ready" | "error" | "missing-key";
let kakaoMapLoadPromise: Promise<KakaoLoadStatus> | null = null;

function getKakaoKey() {
  return import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined;
}

export function isInBounds(point: Coordinates, bounds: KakaoBounds | null) {
  if (!bounds || !window.kakao) return true;
  const latlng = new window.kakao.maps.LatLng(point.lat, point.lng);
  return bounds.contain(latlng);
}

export function loadKakaoMap(): Promise<KakaoLoadStatus> {
  if (kakaoMapLoadPromise) {
    return kakaoMapLoadPromise;
  }

  const appKey = getKakaoKey();

  if (!appKey) {
    return Promise.resolve<"missing-key">("missing-key");
  }

  if (window.kakao?.maps) {
    kakaoMapLoadPromise = loadKakaoMapsModule();
    return kakaoMapLoadPromise;
  }

  kakaoMapLoadPromise = new Promise<"ready" | "error">((resolve) => {
    const currentScript = document.getElementById(kakaoScriptId) as
      | HTMLScriptElement
      | null;

    if (currentScript) {
      if (window.kakao?.maps) {
        loadKakaoMapsModule().then(resolve);
        return;
      }

      if (currentScript.dataset.failed === "true") {
        resolve("error");
        return;
      }

      currentScript.addEventListener("error", () => {
        currentScript.dataset.failed = "true";
        resolve("error");
      });
      waitForKakaoGlobal().then((status) => {
        if (status !== "ready") {
          resolve(status);
          return;
        }
        loadKakaoMapsModule().then(resolve);
      });
      return;
    }

    const script = document.createElement("script");
    script.id = kakaoScriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.addEventListener("load", () => {
      loadKakaoMapsModule().then(resolve);
    });
    script.addEventListener("error", () => {
      script.dataset.failed = "true";
      resolve("error");
    });
    document.head.appendChild(script);
  });

  return kakaoMapLoadPromise;
}

function loadKakaoMapsModule(): Promise<"ready" | "error"> {
  const kakaoMaps = window.kakao?.maps;

  if (!kakaoMaps) {
    return waitForKakaoGlobal().then((status) => {
      if (status !== "ready") return status;
      return loadKakaoMapsModule();
    });
  }

  if (kakaoMaps.Map && kakaoMaps.LatLng) {
    return Promise.resolve<"ready">("ready");
  }

  if (kakaoMaps.load) {
    return new Promise<"ready" | "error">((resolve) => {
      let resolved = false;
      const finish = (status: "ready" | "error") => {
        if (resolved) return;
        resolved = true;
        window.clearTimeout(timer);
        resolve(status);
      };
      const timer = window.setTimeout(() => finish("error"), kakaoLoadTimeoutMs);

      waitForKakaoMapsReady().then(finish);
      kakaoMaps.load(() => {
        waitForKakaoMapsReady().then(finish);
      });
    });
  }

  return waitForKakaoMapsReady();
}

function waitForKakaoGlobal(): Promise<"ready" | "error"> {
  return new Promise<"ready" | "error">((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.kakao?.maps) {
        resolve("ready");
        return;
      }

      if (Date.now() - startedAt > kakaoLoadTimeoutMs) {
        resolve("error");
        return;
      }

      window.setTimeout(check, 50);
    };

    check();
  });
}

function waitForKakaoMapsReady(): Promise<"ready" | "error"> {
  return new Promise<"ready" | "error">((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.kakao?.maps?.Map && window.kakao.maps.LatLng) {
        resolve("ready");
        return;
      }

      if (Date.now() - startedAt > kakaoLoadTimeoutMs) {
        resolve("error");
        return;
      }

      window.setTimeout(check, 50);
    };

    check();
  });
}
