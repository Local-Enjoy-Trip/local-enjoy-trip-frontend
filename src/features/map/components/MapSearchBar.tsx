import { Search } from "lucide-react";

export function MapSearchBar({
  onQueryChange,
  onSubmit,
  placeholder = "장소를 입력해주세요",
  query
}: {
  onQueryChange: (query: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  query: string;
}) {
  return (
    <form
      className="flex h-11 items-center gap-1.5 rounded-full bg-white px-3 shadow-[0_8px_20px_rgba(17,17,17,0.13)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <button
        className="grid h-8 w-8 flex-none place-items-center rounded-full text-[#24231f]"
        type="submit"
        aria-label="검색"
      >
        <Search size={19} strokeWidth={2.4} />
      </button>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent text-sm font-bold text-[#24231f] outline-none placeholder:text-[#918a80]"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
    </form>
  );
}
