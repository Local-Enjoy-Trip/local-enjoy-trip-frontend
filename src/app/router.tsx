import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AuthTransitionShell } from "./AuthTransitionShell";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AppShell } from "../shared/components/AppShell";

function lazyPage<TModule extends Record<TExport, ComponentType>, TExport extends string>(
  importer: () => Promise<TModule>,
  exportName: TExport,
) {
  return lazy(() =>
    importer().then((module) => ({ default: module[exportName] })),
  );
}

function routeElement(Page: ComponentType) {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

const CreateNotePage = lazyPage(
  () => import("../pages/CreateNotePage"),
  "CreateNotePage",
);
const CreateCoursePage = lazyPage(
  () => import("../pages/CreateCoursePage"),
  "CreateCoursePage",
);
const CourseDetailPage = lazyPage(
  () => import("../pages/CourseDetailPage"),
  "CourseDetailPage",
);
const CoursePage = lazyPage(() => import("../pages/CoursePage"), "CoursePage");
const HomePage = lazyPage(() => import("../pages/HomePage"), "HomePage");
const LoginPage = lazyPage(() => import("../pages/LoginPage"), "LoginPage");
const EmailLoginPage = lazyPage(
  () => import("../pages/EmailLoginPage"),
  "EmailLoginPage",
);
const FriendPage = lazyPage(() => import("../pages/FriendPage"), "FriendPage");
const MapPage = lazyPage(() => import("../pages/MapPage"), "MapPage");
const MyCoursesPage = lazyPage(
  () => import("../pages/MyCoursesPage"),
  "MyCoursesPage",
);
const MyPage = lazyPage(() => import("../pages/MyPage"), "MyPage");
const MyNotesPage = lazyPage(
  () => import("../pages/MyNotesPage"),
  "MyNotesPage",
);
const MySavedPage = lazyPage(
  () => import("../pages/MySavedPage"),
  "MySavedPage",
);
const NoteLocationPage = lazyPage(
  () => import("../pages/NoteLocationPage"),
  "NoteLocationPage",
);
const OAuthCallbackPage = lazyPage(
  () => import("../pages/OAuthCallbackPage"),
  "OAuthCallbackPage",
);
const SignupPage = lazyPage(() => import("../pages/SignupPage"), "SignupPage");

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "/", element: routeElement(HomePage) },
      { path: "/map", element: routeElement(MapPage) },
      { path: "/note/new", element: routeElement(CreateNotePage) },
      { path: "/note/:noteId/edit", element: routeElement(CreateNotePage) },
      { path: "/note/location", element: routeElement(NoteLocationPage) },
      { path: "/course", element: routeElement(CoursePage) },
      { path: "/course/new", element: routeElement(CreateCoursePage) },
      { path: "/course/:courseId", element: routeElement(CourseDetailPage) },
      { path: "/friends", element: routeElement(FriendPage) },
      { path: "/my", element: routeElement(MyPage) },
      { path: "/my/courses", element: routeElement(MyCoursesPage) },
      { path: "/my/notes", element: routeElement(MyNotesPage) },
      { path: "/my/saved", element: routeElement(MySavedPage) }
    ]
  },
  {
    element: <AuthTransitionShell />,
    children: [
      { path: "/login", element: routeElement(LoginPage) },
      { path: "/login/email", element: routeElement(EmailLoginPage) },
      { path: "/oauth/callback", element: routeElement(OAuthCallbackPage) },
      { path: "/signup", element: routeElement(SignupPage) }
    ]
  }
]);
