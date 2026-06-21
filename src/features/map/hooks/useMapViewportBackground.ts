import { useEffect } from "react";

const mapBackgroundColor = "#e6efe9";

export function useMapViewportBackground() {
  useEffect(() => {
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    const previousThemeColor = themeColor?.content;
    const previousBodyBackground = document.body.style.backgroundColor;
    const previousHtmlBackground = document.documentElement.style.backgroundColor;

    document.body.style.backgroundColor = mapBackgroundColor;
    document.documentElement.style.backgroundColor = mapBackgroundColor;

    if (themeColor) {
      themeColor.content = "transparent";
    }

    return () => {
      document.body.style.backgroundColor = previousBodyBackground;
      document.documentElement.style.backgroundColor = previousHtmlBackground;

      if (themeColor) {
        themeColor.content = previousThemeColor ?? "#ffffff";
      }
    };
  }, []);
}
