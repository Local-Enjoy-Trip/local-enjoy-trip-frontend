import type { UpcomingTrip } from "@/features/course/lib/coursePageModels";
import { CalendarDays } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const tripPanelTransition = {
  duration: 0.34,
  ease: [0.4, 0, 0.2, 1],
} as const;

const tripPanelVariants = {
  closed: {
    x: "calc(100% - 68px)",
  },
  open: {
    x: 0,
  },
} as const;

const tripPanelContentVariants = {
  closed: {
    opacity: 0,
  },
  open: {
    opacity: 1,
  },
} as const;

export function UpcomingTripPanel({
  onToggle,
  open,
  trip,
}: {
  onToggle: () => void;
  open: boolean;
  trip: UpcomingTrip;
}) {
  return (
    <aside className="pointer-events-none fixed right-5 bottom-[calc(92px+env(safe-area-inset-bottom))] z-30 h-[76px] w-[calc(100vw-40px)] max-w-[390px]">
      <motion.div
        animate={open ? "open" : "closed"}
        className="absolute inset-0 transform-gpu will-change-transform"
        initial={false}
        transition={tripPanelTransition}
        variants={tripPanelVariants}
      >
        <Link
          aria-label="다가오는 여행"
          className={`flex h-full w-full items-center gap-3 rounded-[25px] border-0 pr-3 pl-[76px] text-white ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          to={`/course/${trip.id}`}
        >
          <motion.span
            className="absolute inset-0 rounded-[20px] bg-linear-to-r from-[#FF9A75] via-[#F98258] to-[#EF7047] shadow-[0_14px_30px_rgba(239,112,71,0.18)]"
            transition={tripPanelTransition}
            variants={tripPanelContentVariants}
          />
          <motion.span
            className="relative flex min-w-0 flex-1 items-center gap-3 text-white"
            transition={tripPanelTransition}
            variants={tripPanelContentVariants}
          >
            <span className="min-w-0 flex-1 text-left text-white">
              <strong className="block truncate text-base font-bold text-white">
                {trip.title}
              </strong>
              <span className="mt-1 block text-xs font-bold text-white">
                D-{trip.daysUntil} | {trip.dateLabel}
              </span>
            </span>
            <span className="h-10 w-px flex-none bg-white/25" />
            <span className="grid min-w-12 gap-1 flex-none place-items-center text-white">
              <CalendarDays size={21} strokeWidth={1.5} />
              <span className="mt-0.5 text-[10px] font-medium text-white">
                내 일정
              </span>
            </span>
          </motion.span>
        </Link>
        <motion.button
          aria-label="다가오는 여행 열기"
          className={`absolute top-1/2 left-3 grid size-14 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-white p-0 shadow-[0_12px_28px_rgba(17,17,17,0.18)] ${
            open ? "pointer-events-none" : "pointer-events-auto"
          }`}
          initial={false}
          onClick={onToggle}
          tabIndex={open ? -1 : 0}
          type="button"
        >
          <img
            alt=""
            className="size-full rounded-full object-cover"
            src={trip.coverImageUrl}
          />
        </motion.button>
      </motion.div>
    </aside>
  );
}
