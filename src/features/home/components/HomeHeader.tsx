import { Bell } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hasAuthSession } from "@/features/auth/authStore";
import {
  getReceivedFriendRequests,
  receivedFriendRequestsQueryKey,
} from "@/features/friends/friendApi";
import { NotificationDrawer } from "@/features/home/components/NotificationDrawer";
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const receivedRequestsQuery = useQuery({
    enabled: hasAuthSession(),
    queryFn: getReceivedFriendRequests,
    queryKey: receivedFriendRequestsQueryKey,
    refetchInterval: 30000,
    retry: false,
  });
  const hasUnread = (receivedRequestsQuery.data?.length ?? 0) > 0;

  return (
    <div className="px-5 pt-[calc(18px+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <SpotLogo />
        <button
          aria-label="알림"
          className="relative grid size-10 place-items-center rounded-full border-0 bg-transparent text-[#222]"
          onClick={() => setIsNotificationOpen(true)}
          type="button"
        >
          <Bell size={22} strokeWidth={2.35} />
          {hasUnread ? (
            <span className="absolute right-2 top-2 size-2.5 rounded-full bg-[#F04438] ring-2 ring-white" />
          ) : null}
        </button>
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
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  );
}
