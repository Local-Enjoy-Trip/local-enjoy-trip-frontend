import { Outlet, useLocation } from "react-router-dom";
import { PageTransition } from "@/shared/ui/PageTransition";

export function AuthTransitionShell() {
  const location = useLocation();

  return (
    <PageTransition key={location.pathname}>
      <Outlet />
    </PageTransition>
  );
}
