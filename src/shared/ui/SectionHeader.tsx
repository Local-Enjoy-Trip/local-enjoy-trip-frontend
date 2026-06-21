import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

type SectionHeaderProps = {
  title: string;
  actionTo?: string;
};

export function SectionHeader({ title, actionTo }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 px-5">
      <h2 className="m-0 text-[1.25rem] leading-tight font-extrabold text-(--spot-app-text)">
        {title}
      </h2>
      {actionTo ? (
        <Link
          className="grid h-8 w-8 flex-none place-items-center text-(--spot-app-text)"
          to={actionTo}
          aria-label={`${title} 더 보기`}
        >
          <ChevronRight size={24} strokeWidth={3} />
        </Link>
      ) : null}
    </div>
  );
}
