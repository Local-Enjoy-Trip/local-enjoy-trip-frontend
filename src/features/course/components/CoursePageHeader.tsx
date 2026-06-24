import courseLogoUrl from "@/assets/courseLogo.svg";
import { CalendarDays, Menu, Plus } from "lucide-react";

export function CoursePageHeader({
  onCreate,
  onOpenMenu,
}: {
  onCreate: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-white/95 px-5 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 backdrop-blur">
      <img alt="곳곳 코스" className="h-6 w-auto" src={courseLogoUrl} />
      <div className="flex items-center gap-1">
        <button
          aria-label="일정 추가"
          className="relative grid size-8 place-items-center rounded-full border-0 bg-white text-[#2D2A26]"
          onClick={onCreate}
          type="button"
        >
          <CalendarDays size={20} strokeWidth={2.2} />
          <Plus className="absolute mt-5 ml-5" size={12} strokeWidth={3} />
        </button>
        <button
          aria-label="코스 메뉴"
          className="grid size-8 place-items-center rounded-full border-0 bg-white text-[#2D2A26]"
          onClick={onOpenMenu}
          type="button"
        >
          <Menu size={23} strokeWidth={2.2} />
        </button>
      </div>
    </header>
  );
}
