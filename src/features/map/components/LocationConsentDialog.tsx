import { LocateFixed } from "lucide-react";

type LocationConsentDialogProps = {
  onAllow: () => void;
  onSkip: () => void;
};

export function LocationConsentDialog({
  onAllow,
  onSkip,
}: LocationConsentDialogProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-black/30 p-4 pb-[calc(20px+env(safe-area-inset-bottom))] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-consent-title"
    >
      <div className="mx-auto w-full max-w-[398px] rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(17,17,17,0.26)]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0eb] text-[#FF4300]">
          <LocateFixed size={24} strokeWidth={2.4} />
        </div>
        <h2
          className="mt-4 mb-0 text-xl font-black text-[#191919]"
          id="location-consent-title"
        >
          내 주변에서 시작할까요?
        </h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed font-semibold text-[#777]">
          현재 위치를 사용하면 지도와 마커를 내 주변으로 바로 옮겨드려요.
          위치는 주변 장소를 찾고 쪽지를 남길 때만 사용합니다.
        </p>
        <button
          className="mt-5 min-h-13 w-full rounded-2xl bg-[#FF4300] font-black text-white shadow-[0_12px_24px_rgba(255,67,0,0.2)]"
          type="button"
          onClick={onAllow}
        >
          현재 위치 사용
        </button>
        <button
          className="mt-2 min-h-11 w-full rounded-2xl bg-[#f5f5f5] text-sm font-black text-[#777]"
          type="button"
          onClick={onSkip}
        >
          직접 찾을게요
        </button>
      </div>
    </div>
  );
}
