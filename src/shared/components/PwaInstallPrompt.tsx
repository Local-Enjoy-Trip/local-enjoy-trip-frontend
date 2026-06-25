import { Download, Home, Share } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OPEN_PWA_INSTALL_PROMPT_EVENT } from "@/shared/lib/pwaInstallEvents";
import { BottomSheet } from "@/shared/ui/BottomSheet";

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [wasManuallyRequested, setWasManuallyRequested] = useState(false);
  const showsIosGuide = useMemo(
    () => typeof window !== "undefined" && isIosSafari(),
    []
  );

  useEffect(() => {
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    if (showsIosGuide && !isRecentlyDismissed()) {
      setIsDrawerOpen(true);
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (!isRecentlyDismissed()) {
        setIsDrawerOpen(true);
      }
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setIsDrawerOpen(false);
      setDeferredPrompt(null);
    }

    function handleManualOpen() {
      setWasManuallyRequested(true);
      setIsDrawerOpen(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener(OPEN_PWA_INSTALL_PROMPT_EVENT, handleManualOpen);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener(OPEN_PWA_INSTALL_PROMPT_EVENT, handleManualOpen);
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
    setIsDrawerOpen(false);
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setIsDrawerOpen(false);
  }

  if (
    isInstalled ||
    (!deferredPrompt && !showsIosGuide && !wasManuallyRequested)
  ) {
    return null;
  }

  return (
    <BottomSheet
      isOpen={isDrawerOpen}
      onClose={handleDismiss}
      title="곳곳 설치하기"
    >
      <div className="text-[#111]">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FF4300] text-white">
            {showsIosGuide ? (
              <Share size={23} strokeWidth={2.25} />
            ) : (
              <Download size={24} strokeWidth={2.35} />
            )}
          </span>
          <div className="min-w-0">
            <strong className="block text-lg font-extrabold leading-6">
              앱처럼 빠르게 열어보세요
            </strong>
            <p className="mt-1 text-sm font-bold leading-5 text-[#777]">
              홈 화면에 추가하면 주소 입력 없이 바로 시작할 수 있어요.
            </p>
          </div>
        </div>

        {showsIosGuide ? (
          <ol className="mt-6 grid gap-3 p-0">
            <li className="flex items-center gap-3 rounded-2xl bg-[#F7F6F2] px-4 py-3 text-sm font-bold text-[#333]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#FF4300]">
                <Share size={17} strokeWidth={2.25} />
              </span>
              Safari 하단의 공유 버튼을 눌러주세요.
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-[#F7F6F2] px-4 py-3 text-sm font-bold text-[#333]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#FF4300]">
                <Home size={17} strokeWidth={2.25} />
              </span>
              홈 화면에 추가를 선택하면 설치가 끝나요.
            </li>
          </ol>
        ) : deferredPrompt ? (
          <button
            className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-0 bg-black px-5 text-base font-black text-white active:scale-[0.98]"
            onClick={handleInstallClick}
            type="button"
          >
            <Download size={20} strokeWidth={2.35} />
            앱으로 설치
          </button>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#F7F6F2] px-4 py-4">
            <div className="flex items-center gap-3 text-sm font-bold text-[#333]">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#FF4300]">
                <Download size={18} strokeWidth={2.35} />
              </span>
              브라우저 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해주세요.
            </div>
          </div>
        )}

        <button
          className="mt-3 h-12 w-full rounded-2xl border border-[#E8E4DD] bg-white text-sm font-black text-[#777]"
          onClick={handleDismiss}
          type="button"
        >
          나중에 할게요
        </button>
      </div>
    </BottomSheet>
  );
}
