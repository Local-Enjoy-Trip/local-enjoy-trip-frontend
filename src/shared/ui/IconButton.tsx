import type { ReactNode } from "react";

type IconButtonProps = {
  label: string;
  children: ReactNode;
};

export function IconButton({ label, children }: IconButtonProps) {
  return (
    <button
      className="grid h-11 w-11 place-items-center border-0 bg-transparent p-0 text-[var(--spot-app-text)]"
      type="button"
      aria-label={label}
    >
      {children}
    </button>
  );
}
