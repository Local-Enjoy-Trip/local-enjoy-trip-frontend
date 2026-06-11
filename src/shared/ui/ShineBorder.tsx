import type { ReactNode } from "react";

type ShineBorderProps = {
  children: ReactNode;
  className?: string;
};

export function ShineBorder({ children, className = "" }: ShineBorderProps) {
  return (
    <div className={`shine-border ${className}`}>
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
