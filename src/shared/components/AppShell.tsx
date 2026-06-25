import {
  Compass,
  Home,
  Map,
  MapPinned,
  NotebookPen,
  Plus,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageTransition } from "@/shared/ui/PageTransition";
import { ScrollToTop } from "@/shared/ui/ScrollToTop";

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
          isActive ? "opacity-0" : "opacity-100"
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
          isActive ? "opacity-100" : "opacity-0"
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

function ExploreNavIcon({ isActive }: { isActive: boolean }) {
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
        <circle
          cx="12"
          cy="12"
          r="8.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M15.35 8.65L13.55 13.55L8.65 15.35L10.45 10.45L15.35 8.65Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.55"
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
        <circle cx="12" cy="12" r="8.5" fill="currentColor" />
        <path
          d="M16.05 7.95L13.85 13.85L7.95 16.05L10.15 10.15L16.05 7.95Z"
          fill="white"
        />
      </svg>
    </span>
  );
}

function MyNavIcon({ isActive }: { isActive: boolean }) {
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
        className={`absolute inset-0 h-full w-full transition-[opacity,transform] duration-200 ease-out ${
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
  { to: "/course", label: "탐색", icon: Compass },
  { to: "/my", label: "마이", icon: UserRound },
];

const createItems = [
  {
    to: "/note/location",
    label: "쪽지 남기기",
    icon: NotebookPen,
  },
  {
    to: "/course?create=1",
    label: "코스 만들기",
    icon: MapPinned,
  },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const isMapPage = location.pathname === "/map";
  const isNoteLocationPage = location.pathname === "/note/location";
  const isLoginPage = location.pathname.startsWith("/login");
  const isCourseDetailPage =
    location.pathname.startsWith("/course/") && location.pathname !== "/course/new";
  const usesFixedViewport =
    isMapPage || isNoteLocationPage || isCourseDetailPage || isLoginPage;
  const quietTransition = usesFixedViewport || ["/", "/map", "/course", "/my"].includes(location.pathname);

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
      className={`relative mx-auto w-full max-w-[430px] bg-white shadow-[0_0_0_1px_rgba(17,17,17,0.06)] transition-colors sm:my-6 sm:rounded-3xl ${
        usesFixedViewport
          ? "h-dvh overflow-hidden sm:h-[calc(100dvh-48px)]"
          : "min-h-dvh sm:min-h-[calc(100vh-48px)] sm:overflow-hidden"
      }`}
    >
      <ScrollToTop rootRef={mainRef} />
      <main
        ref={mainRef}
        className={
          usesFixedViewport
            ? "h-full overflow-hidden"
            : "min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))]"
        }
      >
        <PageTransition
          fixed={usesFixedViewport}
          key={location.pathname}
          quiet={quietTransition}
        >
          <Outlet />
        </PageTransition>
      </main>
      {isLoginPage || isNoteLocationPage ? null : (
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-5 border-t border-black/10 bg-white/90 px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(17,17,17,0.04)] backdrop-blur-xl sm:border-x"
        aria-label="주요 메뉴"
      >
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className="grid min-h-[54px] place-items-center content-center gap-0.5 rounded-xl text-[0.67rem] text-black transition-transform duration-150 active:scale-[0.94]"
              aria-label={item.label}
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative grid h-8 w-9 place-items-center text-black transition-transform duration-200 ease-out ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                  >
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
            className={`absolute bottom-[calc(100%+20px)] left-1/2 w-[214px] -translate-x-1/2 origin-bottom overflow-hidden rounded-2xl border border-[#dedede] bg-white p-1.5 text-black shadow-[0_18px_44px_rgba(17,17,17,0.28)] transition-all duration-200 ${
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
                  className={`flex min-h-[56px] w-full items-center justify-between rounded-xl border-0 bg-white px-3.5 text-left text-black transition-colors hover:bg-[#f4f4f4] focus-visible:bg-[#f4f4f4] focus-visible:outline-none ${
                    index > 0 ? "border-t border-solid border-black/10" : ""
                  }`}
                  key={item.to}
                  onClick={() => {
                    if (item.to === "/note/location") {
                      navigate(item.to, { state: { isFirstSelect: true } });
                    } else {
                      navigate(item.to);
                    }
                  }}
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
              className="grid min-h-[54px] place-items-center content-center gap-0.5 rounded-xl text-[0.67rem] text-black transition-transform duration-150 active:scale-[0.94]"
              aria-label={item.label}
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`relative grid h-8 w-9 place-items-center text-black transition-transform duration-200 ease-out ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                  >
                    {item.to === "/course" ? (
                      <ExploreNavIcon isActive={isActive} />
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
      </nav>
      )}
    </div>
  );
}
