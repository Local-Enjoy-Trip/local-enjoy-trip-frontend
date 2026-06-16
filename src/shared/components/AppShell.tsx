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

function HomeNavIcon({ isActive }: { isActive: boolean }) {
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <svg
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-200 ease-out ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 10.5L12 3L20 10.5V20.5H14.75V14H9.25V20.5H4V10.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-200 ease-out ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 10.05C3 9.77 3.12 9.5 3.33 9.31L11.33 2.31C11.71 1.98 12.29 1.98 12.67 2.31L20.67 9.31C20.88 9.5 21 9.77 21 10.05V20C21 20.55 20.55 21 20 21H14V14H10V21H4C3.45 21 3 20.55 3 20V10.05Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function MapNavIcon({ isActive }: { isActive: boolean }) {
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <svg
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-200 ease-out ${
          isActive ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.29004 7.77998V17.51C2.29004 19.41 3.64004 20.19 5.28004 19.25L7.63004 17.91C8.14004 17.62 8.99004 17.59 9.52004 17.86L14.77 20.49C15.3 20.75 16.15 20.73 16.66 20.44L20.99 17.96C21.54 17.64 22 16.86 22 16.22V6.48998C22 4.58998 20.65 3.80998 19.01 4.74998L16.66 6.08998C16.15 6.37998 15.3 6.40998 14.77 6.13998L9.52004 3.51998C8.99004 3.25998 8.14004 3.27998 7.63004 3.56998L3.30004 6.04998C2.74004 6.36998 2.29004 7.14998 2.29004 7.77998Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.56006 4V17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.73 6.61914V19.9991"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-200 ease-out ${
          isActive ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.63004 3.56967C7.80942 3.47182 8.00004 3.62235 8.00004 3.82668V17.3825C8.00004 17.6058 7.84762 17.7946 7.65024 17.8988C7.64347 17.9024 7.63673 17.906 7.63004 17.9097L5.28004 19.2497C3.64004 20.1897 2.29004 19.4097 2.29004 17.5097V7.77967C2.29004 7.14967 2.74004 6.36967 3.30004 6.04967L7.63004 3.56967Z"
          fill="currentColor"
        />
        <path
          d="M14.7219 6.10265C14.8922 6.187 15 6.36064 15 6.55071V19.7038C15 20.0723 14.615 20.3143 14.283 20.1544L10.033 18.1067C9.85998 18.0233 9.75 17.8482 9.75 17.6562V4.44595C9.75 4.07509 10.1396 3.8333 10.4719 3.99789L14.7219 6.10265Z"
          fill="currentColor"
        />
        <path
          d="M22 6.49006V16.2201C22 16.8501 21.55 17.6301 20.99 17.9501L17.4986 19.951C17.1653 20.1421 16.75 19.9014 16.75 19.5172V6.33038C16.75 6.15087 16.8462 5.98513 17.0021 5.89615L19.01 4.75006C20.65 3.81006 22 4.59006 22 6.49006Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function CourseNavIcon({ isActive }: { isActive: boolean }) {
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <svg
        className={`absolute inset-0 h-full w-full transition-opacity duration-200 ease-out ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.5 10.5C9.43 10.5 11 8.93 11 7C11 5.07 9.43 3.5 7.5 3.5C5.57 3.5 4 5.07 4 7C4 9.75 7.5 13 7.5 13C7.5 13 11 9.75 11 7Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 7H7.51"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 19H16.5C18.43 19 20 17.43 20 15.5C20 13.57 18.43 12 16.5 12H14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 16L7 19L10 22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className={`absolute inset-0 h-full w-full transition-opacity duration-200 ease-out ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.5 2.5C4.74 2.5 2.5 4.74 2.5 7.5C2.5 11.35 7.5 15.5 7.5 15.5C7.5 15.5 12.5 11.35 12.5 7.5C12.5 4.74 10.26 2.5 7.5 2.5ZM7.5 9.25C8.47 9.25 9.25 8.47 9.25 7.5C9.25 6.53 8.47 5.75 7.5 5.75C6.53 5.75 5.75 6.53 5.75 7.5C5.75 8.47 6.53 9.25 7.5 9.25Z"
          fill="currentColor"
        />
        <path
          d="M13.5 11H16.5C18.99 11 21 13.01 21 15.5C21 17.99 18.99 20 16.5 20H10.83L11.71 20.88C12.1 21.27 12.1 21.9 11.71 22.29C11.32 22.68 10.68 22.68 10.29 22.29L7.71 19.71C7.32 19.32 7.32 18.68 7.71 18.29L10.29 15.71C10.68 15.32 11.32 15.32 11.71 15.71C12.1 16.1 12.1 16.73 11.71 17.12L10.83 18H16.5C17.88 18 19 16.88 19 15.5C19 14.12 17.88 13 16.5 13H13.5V11Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

function MyNavIcon({ isActive }: { isActive: boolean }) {
  return (
    <span className="relative block h-6 w-6" aria-hidden="true">
      <svg
        className={`absolute inset-0 h-full w-full transition-opacity duration-200 ease-out ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="7"
          r="3.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 20C5.45 16.34 8.21 14 12 14C15.79 14 18.55 16.34 19 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className={`absolute inset-0 h-full w-full transition-opacity duration-200 ease-out ${
          isActive ? "opacity-100" : "opacity-0"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="7" r="4" fill="currentColor" />
        <path
          d="M4 20.25C4 16.27 7.58 13 12 13C16.42 13 20 16.27 20 20.25C20 20.66 19.66 21 19.25 21H4.75C4.34 21 4 20.66 4 20.25Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

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
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-5 border-t border-black/10 bg-white/90 px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(17,17,17,0.04)] backdrop-blur-xl sm:border-x"
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
                  <span className="relative grid h-8 w-9 place-items-center text-black">
                    {item.to === "/" ? (
                      <HomeNavIcon isActive={isActive} />
                    ) : item.to === "/map" ? (
                      <MapNavIcon isActive={isActive} />
                    ) : (
                      <>
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
                      </>
                    )}
                  </span>
                  <span
                    className={`text-black transition-[font-weight] duration-200 ${
                      isActive ? "font-semibold" : "font-medium"
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
            className={`absolute bottom-[calc(100%+20px)] left-1/2 w-[214px] -translate-x-1/2 origin-bottom overflow-hidden rounded-xl border border-black/5 bg-[#f7f7f7]/95 p-1.5 text-black shadow-[0_14px_36px_rgba(17,17,17,0.18)] backdrop-blur-xl transition-all duration-200 ${
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
            className={`grid h-12 w-12 place-items-center rounded-full border-0 text-white outline-none transition-[background-color,box-shadow,transform] duration-200 active:scale-95 ${
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
              size={27}
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
                  <span className="relative grid h-8 w-9 place-items-center text-black">
                    {item.to === "/library" ? (
                      <CourseNavIcon isActive={isActive} />
                    ) : item.to === "/my" ? (
                      <MyNavIcon isActive={isActive} />
                    ) : (
                      <>
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
                      </>
                    )}
                  </span>
                  <span
                    className={`text-black transition-[font-weight] duration-200 ${
                      isActive ? "font-extrabold" : "font-medium"
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
