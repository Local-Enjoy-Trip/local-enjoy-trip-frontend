import type { ReactNode } from "react";

type IconButtonProps = {
  label: string;
  children: ReactNode;
  hasNotification?: boolean;
};

export function IconButton({ label, children, hasNotification = false }: IconButtonProps) {
  return (
    <button
      className="relative grid h-11 w-11 place-items-center rounded-full bg-[var(--spot-app-surface)] text-[var(--spot-app-text)] shadow-[0_8px_22px_var(--spot-app-shadow)] transition-colors"
      type="button"
      aria-label={label}
    >
      {children}
      {hasNotification ? (
        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-[#FF4300]" />
      ) : null}
    </button>
  );
}
