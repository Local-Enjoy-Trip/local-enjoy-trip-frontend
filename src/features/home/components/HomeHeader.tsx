import { Bell } from "lucide-react";
import { IconButton } from "@/shared/ui/IconButton";
import { SpotLogo } from "@/shared/ui/SpotLogo";
import { LocationSelector } from "@/features/home/components/LocationSelector";

type HomeHeaderProps = {
  nickname: string;
  selectedLocation: string;
  onChangeLocation: () => void;
};

export function HomeHeader({
  nickname,
  selectedLocation,
  onChangeLocation,
}: HomeHeaderProps) {
  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <SpotLogo />
        <IconButton label="알림">
          <Bell size={22} strokeWidth={2.4} />
        </IconButton>
      </header>

      <div className="mt-12">
        <h1 className="text-3xl leading-10 font-normal text-neutral-800">
          <span className="font-extrabold">{nickname}</span>님,
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
