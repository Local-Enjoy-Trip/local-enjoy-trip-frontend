import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type BottomSheetProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function BottomSheet({
  children,
  isOpen,
  onClose,
  title,
}: BottomSheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          aria-hidden={!isOpen}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            aria-labelledby={titleId}
            aria-modal="true"
            className="max-h-[86dvh] w-full max-w-[430px] overflow-hidden rounded-t-[26px] bg-white shadow-[0_-22px_52px_rgba(0,0,0,0.22)]"
            drag="y"
            dragConstraints={{ bottom: 0, top: 0 }}
            dragElastic={{ bottom: 0.28, top: 0 }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            onClick={(event) => event.stopPropagation()}
            onDragEnd={(_, info) => {
              if (info.offset.y > 88 || info.velocity.y > 520) onClose();
            }}
            role="dialog"
          >
            <div className="sticky top-0 z-10 bg-white px-5 pt-3">
              <button
                aria-label="드로어 손잡이"
                className="mx-auto mb-4 block h-1.5 w-11 rounded-full border-0 bg-[#D8D5CE] p-0"
                onClick={onClose}
                type="button"
              />
              <div className="flex items-center justify-between gap-3 border-b border-[#F0ECE6] pb-4">
                <h2
                  className="m-0 min-w-0 text-xl leading-tight font-black text-[#171717]"
                  id={titleId}
                >
                  {title}
                </h2>
                <button
                  aria-label="닫기"
                  className="grid size-9 flex-none place-items-center rounded-full border-0 bg-[#F4F3EF] text-[#333]"
                  onClick={onClose}
                  type="button"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="max-h-[calc(86dvh-86px)] overflow-y-auto px-5 pt-5 pb-[calc(24px+env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
