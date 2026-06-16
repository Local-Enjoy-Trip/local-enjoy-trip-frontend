import {
  Bookmark,
  ChevronDown,
  Footprints,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import type { LocalNote } from "@/shared/types/domain";
import type { MapFilter } from "../mapStore";

const filters: Array<{
  value: MapFilter;
  label: string;
  icon?: typeof Sparkles;
}> = [
  { value: "all", label: "전체", icon: Sparkles },
  { value: "place", label: "장소", icon: Star },
  { value: "spot", label: "SPOT", icon: Footprints },
  { value: "friend", label: "친구", icon: UsersRound },
  { value: "saved", label: "저장됨", icon: Bookmark },
];

export function MapFilterChips({
  filter,
  friends,
  onFilterChange,
  onSelectedFriendChange,
  selectedFriend,
}: {
  filter: MapFilter;
  friends: LocalNote[];
  onFilterChange: (filter: MapFilter) => void;
  onSelectedFriendChange: (friendName: string | null) => void;
  selectedFriend: string | null;
}) {
  const friendChipClassName =
    "inline-flex h-9 flex-none touch-manipulation select-none items-center gap-1.5 rounded-full border px-3 text-[14px] font-extrabold tracking-normal shadow-[0_4px_11px_rgba(36,48,65,0.16)] transition hover:-translate-y-0.5";
  const activeFriendChipClassName =
    "border-[#1677ff] bg-white text-[#202124]";
  const inactiveFriendChipClassName =
    "border-[#e6e8eb] bg-white text-[#33383f]";

  const handleFilterClick = (nextFilter: MapFilter) => {
    if (nextFilter === "friend" && filter === "friend") {
      onFilterChange("all");
      return;
    }

    onFilterChange(nextFilter);
  };

  return (
    <>
      <div
        className="mt-2.5 flex touch-pan-x select-none gap-2 overflow-x-auto px-4 py-2 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="지도 필터"
      >
        {filters.map((item) => {
          const active = filter === item.value;
          const Icon = item.icon;

          return (
            <button
              className={`inline-flex h-9 flex-none items-center gap-1.5 rounded-full border px-3.5 text-[15px] font-extrabold tracking-normal transition ${
                active
                  ? "border-[#1677ff] bg-white text-[#202124] shadow-[0_4px_11px_rgba(36,48,65,0.2)]"
                  : "border-[#e6e8eb] bg-white text-[#33383f] shadow-[0_3px_9px_rgba(36,48,65,0.14)]"
              }`}
              key={item.value}
              onClick={() => handleFilterClick(item.value)}
              role="tab"
              aria-selected={active}
              type="button"
            >
              {Icon ? (
                <Icon
                  className="text-[#0878e6]"
                  size={18}
                  strokeWidth={active ? 3 : 2.8}
                />
              ) : null}
              {item.label}
              {item.value === "friend" ? (
                <ChevronDown
                  className={`text-[#0878e6] transition-transform ${active ? "rotate-180" : ""}`}
                  size={15}
                  strokeWidth={3}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {filter === "friend" ? (
        <div className="mt-0.5 flex justify-center">
          <div className="flex max-w-full touch-pan-x select-none gap-2 overflow-x-auto px-4 py-2 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              className={`${friendChipClassName} ${
                selectedFriend === null
                  ? activeFriendChipClassName
                  : inactiveFriendChipClassName
              }`}
              onClick={() => onSelectedFriendChange(null)}
              type="button"
            >
              모두
            </button>
            {friends.map((friend) => (
              <button
                className={`${friendChipClassName} ${
                  selectedFriend === friend.authorName
                    ? activeFriendChipClassName
                    : inactiveFriendChipClassName
                }`}
                key={friend.authorName}
                onClick={() => onSelectedFriendChange(friend.authorName)}
                type="button"
              >
                {friend.authorAvatarUrl ? (
                  <img
                    className="h-5 w-5 rounded-full object-cover ring-1 ring-[#0878e6]/25"
                    alt=""
                    src={friend.authorAvatarUrl}
                  />
                ) : null}
                {friend.authorName}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
