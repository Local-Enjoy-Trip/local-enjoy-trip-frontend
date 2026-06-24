import { Outlet, useLocation } from "react-router-dom";
import { PageTransition } from "@/shared/ui/PageTransition";
import { ScrollToTop } from "@/shared/ui/ScrollToTop";

export function AuthTransitionShell() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <PageTransition key={location.pathname}>
        <Outlet />
      </PageTransition>
    </>
  );
}
