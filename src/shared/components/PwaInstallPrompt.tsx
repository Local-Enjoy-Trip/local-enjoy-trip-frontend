import { Download, Share, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_AT_KEY = "spot:pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY));

  return Number.isFinite(dismissedAt)
    ? Date.now() - dismissedAt < DISMISS_DURATION_MS
    : false;
}

function isIosSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  return isIos && isSafari;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const showsIosGuide = useMemo(
    () => typeof window !== "undefined" && isIosSafari(),
    []
  );

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    if (isRecentlyDismissed()) {
      return;
    }

    if (showsIosGuide) {
      setIsVisible(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setIsVisible(true);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [showsIosGuide]);

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "dismissed") {
      window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setIsVisible(false);
  }

  if (isInstalled || !isVisible || (!deferredPrompt && !showsIosGuide)) {
    return null;
  }

  return (
    <aside className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[398px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-black shadow-[0_16px_44px_rgba(17,17,17,0.18)] sm:bottom-[calc(112px+env(safe-area-inset-bottom))]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FF4300] text-white">
          {showsIosGuide ? (
            <Share size={19} strokeWidth={2.25} />
          ) : (
            <Download size={20} strokeWidth={2.35} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block text-[0.94rem] font-extrabold leading-5">
            곳곳을 앱처럼 사용해보세요
          </strong>
          <p className="mt-1 text-[0.78rem] font-medium leading-5 text-[#555]">
            {showsIosGuide
              ? "공유 버튼을 누른 뒤 홈 화면에 추가를 선택하면 바로 열 수 있어요."
              : "홈 화면에 추가하면 지도와 코스를 더 빠르게 열 수 있어요."}
          </p>
          {deferredPrompt ? (
            <button
              className="mt-3 h-9 rounded-full border-0 bg-black px-4 text-[0.82rem] font-bold text-white active:scale-[0.98]"
              onClick={handleInstallClick}
              type="button"
            >
              앱으로 설치
            </button>
          ) : null}
        </div>
        <button
          aria-label="설치 안내 닫기"
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[#555]"
          onClick={handleDismiss}
          type="button"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
      </div>
    </aside>
  );
}
