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
  { value: "all", label: "전체" },
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
    "inline-flex h-[35px] flex-none touch-manipulation select-none items-center gap-1.5 rounded-full border px-[11px] text-[13px] font-black shadow-[0_8px_18px_rgba(17,17,17,0.1)] transition hover:-translate-y-0.5";
  const activeFriendChipClassName =
    "border-[#185b3d] bg-[#185b3d] text-white";
  const inactiveFriendChipClassName =
    "border-[rgba(17,17,17,0.08)] bg-white/90 text-[#41584d]";

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
        className="mt-3 flex touch-pan-x select-none gap-2 overflow-x-auto px-4 py-2 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="지도 필터"
      >
        {filters.map((item) => {
          const active = filter === item.value;
          const Icon = item.icon;

          return (
            <button
              className={`inline-flex h-8 flex-none items-center gap-1.5 rounded-full px-3.5 text-sm font-black transition ${
                active
                  ? "bg-[#185B3D] text-white"
                  : "bg-white text-[#3f5a4d] shadow-[0_2px_7px_rgba(17,17,17,0.08)]"
              }`}
              key={item.value}
              onClick={() => handleFilterClick(item.value)}
              role="tab"
              aria-selected={active}
              type="button"
            >
              {Icon ? <Icon size={15} strokeWidth={2.7} /> : null}
              {item.label}
              {item.value === "friend" ? (
                <ChevronDown
                  className={`transition-transform ${active ? "rotate-180" : ""}`}
                  size={14}
                  strokeWidth={2.8}
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {filter === "friend" ? (
        <div className="mt-1 flex justify-center">
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
                    className="h-[23px] w-[23px] rounded-full object-cover"
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
