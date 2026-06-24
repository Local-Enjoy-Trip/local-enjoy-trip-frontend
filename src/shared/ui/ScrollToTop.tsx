import type { RefObject } from "react";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

type ScrollToTopProps = {
  rootRef?: RefObject<HTMLElement>;
};

export function ScrollToTop({ rootRef }: ScrollToTopProps) {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const root = rootRef?.current;

    if (!root) {
      return;
    }

    root.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, rootRef]);

  return null;
}
