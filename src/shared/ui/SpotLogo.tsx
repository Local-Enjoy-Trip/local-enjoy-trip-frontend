import spotLogo from "@/assets/spot-logo.png";
import { useThemeMode } from "../hooks/useThemeMode";

export function SpotLogo() {
  const { isDark, toggleTheme } = useThemeMode();

  return (
    <button
      className="relative inline-flex w-24 items-center border-0 bg-transparent p-0"
      type="button"
      aria-label={isDark ? "라이트 모드로 변경" : "다크 모드로 변경"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      <img className="h-auto w-full" src={spotLogo} alt="" aria-hidden="true" />
    </button>
  );
}
