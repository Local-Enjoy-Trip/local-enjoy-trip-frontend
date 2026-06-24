import type { CourseDiscoveryModel } from "@/features/course/components/CourseDiscoveryCard";
import type { LocalNote, Place } from "@/shared/types/domain";
import { ChevronRight, Heart, MapPinned, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export function CourseMenuSheet({
  isOpen,
  myCourses,
  onClose,
  savedNotes,
  savedPlaces,
}: {
  isOpen: boolean;
  myCourses: CourseDiscoveryModel[];
  onClose: () => void;
  savedNotes: LocalNote[];
  savedPlaces: Place[];
}) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[80] flex justify-end bg-black/35"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            aria-label="코스 메뉴 닫기"
            className="absolute inset-0 cursor-default border-0 bg-transparent"
            onClick={onClose}
            type="button"
          />
          <motion.aside
            aria-label="코스 메뉴"
            animate={{ x: 0 }}
            className="relative flex h-full w-[88%] max-w-[390px] flex-col bg-white shadow-[-18px_0_40px_rgba(17,17,17,0.18)]"
            exit={{ x: "100%" }}
            initial={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
          >
            <header className="flex flex-none items-center justify-between px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-4">
              <h2 className="m-0 text-xl font-bold text-[#171717]">코스 메뉴</h2>
              <button
                aria-label="코스 메뉴 닫기"
                className="grid size-10 place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#333]"
                onClick={onClose}
                type="button"
              >
                <X size={20} />
              </button>
            </header>
            <div className="grid flex-1 content-start gap-5 overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
              <MenuList
                emptyMessage="아직 만든 코스가 없어요."
                items={myCourses.map((course) => ({
                  id: course.id,
                  label: course.title,
                  meta: `${course.area} · ${course.stops.length}곳`,
                  to: `/course/${course.id}`,
                }))}
                onClose={onClose}
                title="내 코스"
              />
              <MenuList
                emptyMessage="저장한 장소가 없어요."
                items={savedPlaces.map((place) => ({
                  id: place.id,
                  label: place.name,
                  meta: place.area,
                  to: `/map?filter=saved&target=${place.id}`,
                }))}
                onClose={onClose}
                title="저장한 장소"
              />
              <MenuList
                emptyMessage="저장한 쪽지가 없어요."
                items={savedNotes.map((note) => ({
                  id: note.id,
                  label: note.placeName,
                  meta: note.authorName,
                  to: `/map?filter=saved&target=${note.id}`,
                }))}
                onClose={onClose}
                title="저장한 쪽지"
              />
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MenuList({
  emptyMessage,
  items,
  onClose,
  title,
}: {
  emptyMessage: string;
  items: Array<{ id: string; label: string; meta: string; to: string }>;
  onClose: () => void;
  title: string;
}) {
  const navigate = useNavigate();

  return (
    <section>
      <h3 className="m-0 text-sm font-black text-[#171717]">{title}</h3>
      <div className="mt-2 grid gap-2">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <button
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#EEE8DF] bg-white px-3 text-left"
              key={item.id}
              onClick={() => {
                onClose();
                navigate(item.to);
              }}
              type="button"
            >
              <span className="grid size-9 flex-none place-items-center rounded-xl bg-[#F4F3EF] text-[#FD4003]">
                {title === "내 코스" ? (
                  <MapPinned size={18} />
                ) : (
                  <Heart
                    size={18}
                    fill={title === "저장한 장소" ? "currentColor" : "none"}
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm font-black text-[#24211E]">
                  {item.label}
                </strong>
                <span className="mt-0.5 block truncate text-xs font-bold text-[#817A71]">
                  {item.meta}
                </span>
              </span>
              <ChevronRight size={17} className="text-[#AAA49B]" />
            </button>
          ))
        ) : (
          <p className="m-0 rounded-2xl bg-[#F7F6F3] px-4 py-4 text-center text-xs font-bold text-[#817A71]">
            {emptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}
