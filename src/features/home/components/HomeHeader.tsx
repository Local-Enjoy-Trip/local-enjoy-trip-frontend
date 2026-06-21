import { Bell, MessageCircle } from "lucide-react";
import { IconButton } from "@/shared/ui/IconButton";
import { SpotLogo } from "@/shared/ui/SpotLogo";
import { LocationSelector } from "@/features/home/components/LocationSelector";

type HomeHeaderProps = {
  selectedLocation: string;
  onChangeLocation: () => void;
};

export function HomeHeader({
  selectedLocation,
  onChangeLocation,
}: HomeHeaderProps) {
  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <SpotLogo />
        <div className="flex gap-2">
          <IconButton label="알림" hasNotification>
            <Bell size={20} strokeWidth={2.4} />
          </IconButton>
          <IconButton label="쪽지 알림">
            <MessageCircle size={20} strokeWidth={2.4} />
          </IconButton>
        </div>
      </header>

      <div className="mt-8">
        <h1 className="m-0 text-[2.15rem] leading-[1.08] font-bold tracking-tight text-[var(--spot-app-text)]">
          박기현님,
          <br />
          오늘은 어디로 떠나볼까요?
        </h1>
      </div>

      <LocationSelector
        selectedLocation={selectedLocation}
        onChange={onChangeLocation}
      />
    </div>
  );
}
