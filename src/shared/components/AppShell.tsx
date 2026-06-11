import { Home, Map, Plus, Route, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "홈", icon: Home },
  { to: "/map", label: "지도", icon: Map },
  { to: "/note/new", label: "추가", icon: Plus, featured: true },
  { to: "/library", label: "코스", icon: Route },
  { to: "/my", label: "마이", icon: UserRound }
];

export function AppShell() {
  const location = useLocation();
  const isMapPage = location.pathname === "/map";

  return (
    <div
      className={`mx-auto w-full max-w-[430px] bg-[var(--spot-app-bg)] shadow-[0_0_0_1px_rgba(17,17,17,0.06)] transition-colors sm:my-6 sm:rounded-3xl ${
        isMapPage
          ? "h-[100dvh] overflow-hidden sm:h-[calc(100dvh-48px)]"
          : "min-h-screen sm:min-h-[calc(100vh-48px)] sm:overflow-hidden"
      }`}
    >
      <main
        className={
          isMapPage
            ? "h-full overflow-hidden"
            : "min-h-screen pb-[calc(84px+env(safe-area-inset-bottom))]"
        }
      >
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-[430px] grid-cols-5 border-t border-[var(--spot-app-border)] bg-[var(--spot-app-nav)] px-3 pt-2 pb-[calc(9px+env(safe-area-inset-bottom))] backdrop-blur-md transition-colors sm:border-x"
        aria-label="주요 메뉴"
      >
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              className={({ isActive }) =>
                `grid min-h-[58px] place-items-center gap-1 text-[0.72rem] font-bold ${
                  isActive ? "text-[#FF4300]" : "text-[var(--spot-app-muted)]"
                } ${
                  item.featured ? "[&>span:first-child]:h-[54px] [&>span:first-child]:w-[54px] [&>span:first-child]:rounded-full [&>span:first-child]:bg-[#FF4300] [&>span:first-child]:text-white [&>span:first-child]:shadow-[0_10px_22px_rgba(255,67,0,0.28)]" : ""
                }`
              }
              key={item.to}
              to={item.to}
            >
              <span className="grid h-[30px] w-[34px] place-items-center">
                <Icon size={item.featured ? 26 : 21} strokeWidth={2.2} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
