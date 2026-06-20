import { Search } from "lucide-react";

export function MapSearchBar({
  onQueryChange,
  onSubmit,
  placeholder = "동대문구 휘경동",
  query
}: {
  onQueryChange: (query: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  query: string;
}) {
  return (
    <form
      className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
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
        <Search size={21} strokeWidth={2.4} />
      </button>
      <input
        className="min-w-0 flex-1 border-0 bg-transparent text-[0.95rem] font-bold text-[#24231f] outline-none placeholder:text-[#918a80]"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={query}
      />
    </form>
  );
}
