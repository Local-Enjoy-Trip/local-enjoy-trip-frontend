import { Mic, Search } from "lucide-react";

export function MapSearchBar({
  onQueryChange,
  query
}: {
  onQueryChange: (query: string) => void;
  query: string;
}) {
  return (
    <form
      className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
      onSubmit={(event) => event.preventDefault()}
    >
      <Search className="text-[#24231f]" size={21} strokeWidth={2.4} />
      <input
        className="min-w-0 flex-1 border-0 bg-transparent text-[0.95rem] font-bold text-[#24231f] outline-none placeholder:text-[#918a80]"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="동대문구 휘경동"
        type="search"
        value={query}
      />
      <Mic className="text-[#24231f]" size={21} strokeWidth={2.2} />
    </form>
  );
}
