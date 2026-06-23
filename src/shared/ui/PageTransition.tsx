import type { ReactNode } from "react";
import { motion } from "motion/react";

type PageTransitionProps = {
  children: ReactNode;
  fixed?: boolean;
  quiet?: boolean;
};

export function PageTransition({
  children,
  fixed = false,
  quiet = false,
}: PageTransitionProps) {
  return (
    <motion.div
      animate={{ y: 0 }}
      className={fixed ? "h-full min-h-0" : "min-h-full"}
      initial={{ y: quiet ? 0 : 6 }}
      transition={{ duration: quiet ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
