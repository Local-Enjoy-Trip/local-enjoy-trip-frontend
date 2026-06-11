import {
  Home,
  Map,
  MapPinned,
  NotebookPen,
  Plus,
  Route,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/map", label: "지도", icon: Map },
  { to: "/library", label: "코스", icon: Route },
  { to: "/my", label: "마이", icon: UserRound },
];

const createItems = [
  {
    to: "/note/new",
    label: "쪽지 남기기",
    icon: NotebookPen,
  },
  {
    to: "/library",
    label: "코스 만들기",
    icon: MapPinned,
  },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const isMapPage = location.pathname === "/map";

  useEffect(() => {
    setIsCreateMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isCreateMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateMenuOpen]);

  return (
    <div
      className={`mx-auto w-full max-w-[430px] bg-white shadow-[0_0_0_1px_rgba(17,17,17,0.06)] transition-colors sm:my-6 sm:rounded-3xl ${
        isMapPage
          ? "h-[calc(100dvh-48px)] overflow-hidden sm:h-[calc(100dvh-48px)]"
          : "min-h-screen sm:min-h-[calc(100vh-48px)] sm:overflow-hidden"
      }`}
    >
      <main
        className={
          isMapPage
            ? "h-full overflow-hidden"
            : "min-h-screen pb-[calc(72px+env(safe-area-inset-bottom))]"
        }
      >
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-5 border-t border-black/10 bg-white/90 px-5 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(17,17,17,0.04)] backdrop-blur-xl sm:border-x"
        aria-label="주요 메뉴"
      >
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className="grid min-h-[54px] place-items-center content-center gap-0.5 rounded-xl text-[0.67rem] text-black"
              aria-label={item.label}
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="relative grid h-8 w-9 place-items-center text-black"
                  >
                    <Icon
                      className="transition-[fill,stroke-width] duration-200"
                      fill={isActive ? "currentColor" : "none"}
                      size={23}
                      strokeWidth={isActive ? 4 : 1.9}
                    />
                    <Icon
                      className={`absolute text-white transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      fill="none"
                      size={23}
                      strokeWidth={1.35}
                    />
                  </span>
                  <span
                    className={`text-black transition-[font-weight] duration-200 ${
                      isActive
                        ? "font-extrabold"
                        : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        <div
          className="relative grid min-h-[54px] place-items-center"
          ref={createMenuRef}
        >
          <div
            className={`absolute bottom-[calc(100%+10px)] left-1/2 w-[214px] -translate-x-1/2 origin-bottom overflow-hidden rounded-xl border border-black/5 bg-[#f7f7f7]/95 p-1.5 text-black shadow-[0_14px_36px_rgba(17,17,17,0.18)] backdrop-blur-xl transition-all duration-200 ${
              isCreateMenuOpen
                ? "visible translate-y-0 scale-100 opacity-100"
                : "invisible translate-y-3 scale-95 opacity-0"
            }`}
            id="create-menu"
            role="menu"
          >
            {createItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  className={`flex min-h-[54px] w-full items-center justify-between rounded-lg border-0 bg-transparent px-3.5 text-left text-black transition-colors hover:bg-black/5 focus-visible:bg-black/5 focus-visible:outline-none ${
                    index > 0 ? "border-t border-solid border-black/10" : ""
                  }`}
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  role="menuitem"
                  type="button"
                >
                  <strong className="text-[0.98rem] font-bold">
                    {item.label}
                  </strong>
                  <Icon size={25} strokeWidth={2.15} />
                </button>
              );
            })}
          </div>

          <button
            aria-controls="create-menu"
            aria-expanded={isCreateMenuOpen}
            aria-label={
              isCreateMenuOpen ? "만들기 메뉴 닫기" : "만들기 메뉴 열기"
            }
            className={`grid h-10 w-10 place-items-center rounded-xl border-0 text-white outline-none transition-[background-color,box-shadow,transform] duration-200 active:scale-95 ${
              isCreateMenuOpen
                ? "bg-black shadow-[0_8px_18px_rgba(17,17,17,0.2)]"
                : "bg-[#FF4300] shadow-[0_8px_18px_rgba(255,67,0,0.24)]"
            }`}
            onClick={() => setIsCreateMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <Plus
              className={`transition-transform duration-300 ease-out ${
                isCreateMenuOpen ? "rotate-45" : "rotate-0"
              }`}
              size={23}
              strokeWidth={2.4}
            />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className="grid min-h-[54px] place-items-center content-center gap-0.5 rounded-xl text-[0.67rem] text-black"
              aria-label={item.label}
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="relative grid h-8 w-9 place-items-center text-black"
                  >
                    <Icon
                      className="transition-[fill,stroke-width] duration-200"
                      fill={isActive ? "currentColor" : "none"}
                      size={23}
                      strokeWidth={isActive ? 4 : 1.9}
                    />
                    <Icon
                      className={`absolute text-white transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                      fill="none"
                      size={23}
                      strokeWidth={1.35}
                    />
                  </span>
                  <span
                    className={`text-black transition-[font-weight] duration-200 ${
                      isActive
                        ? "font-extrabold"
                        : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
