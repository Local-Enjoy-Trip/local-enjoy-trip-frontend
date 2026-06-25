import courseLogoUrl from "@/assets/courseLogo.svg";

export function CoursePageHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-center bg-white/95 px-5 pt-[calc(25px+env(safe-area-inset-top))] pb-2.5 backdrop-blur">
      <img alt="곳곳 코스" className="h-7 w-auto" src={courseLogoUrl} />
    </header>
  );
}
