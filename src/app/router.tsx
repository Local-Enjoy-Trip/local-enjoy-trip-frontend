import { createBrowserRouter } from "react-router-dom";
import { AuthTransitionShell } from "./AuthTransitionShell";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AppShell } from "../shared/components/AppShell";
import { CreateNotePage } from "../pages/CreateNotePage";
import { CreateCoursePage } from "../pages/CreateCoursePage";
import { CourseDetailPage } from "../pages/CourseDetailPage";
import { CoursePage } from "../pages/CoursePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { EmailLoginPage } from "../pages/EmailLoginPage";
import { FriendPage } from "../pages/FriendPage";
import { MapPage } from "../pages/MapPage";
import { MyCoursesPage } from "../pages/MyCoursesPage";
import { MyPage } from "../pages/MyPage";
import { MyNotesPage } from "../pages/MyNotesPage";
import { MySavedPage } from "../pages/MySavedPage";
import { NoteLocationPage } from "../pages/NoteLocationPage";
import { OAuthCallbackPage } from "../pages/OAuthCallbackPage";
import { SignupPage } from "../pages/SignupPage";

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/note/new", element: <CreateNotePage /> },
      { path: "/note/:noteId/edit", element: <CreateNotePage /> },
      { path: "/note/location", element: <NoteLocationPage /> },
      { path: "/course", element: <CoursePage /> },
      { path: "/course/new", element: <CreateCoursePage /> },
      { path: "/course/:courseId", element: <CourseDetailPage /> },
      { path: "/friends", element: <FriendPage /> },
      { path: "/my", element: <MyPage /> },
      { path: "/my/courses", element: <MyCoursesPage /> },
      { path: "/my/notes", element: <MyNotesPage /> },
      { path: "/my/saved", element: <MySavedPage /> }
    ]
  },
  {
    element: <AuthTransitionShell />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/login/email", element: <EmailLoginPage /> },
      { path: "/oauth/callback", element: <OAuthCallbackPage /> },
      { path: "/signup", element: <SignupPage /> }
    ]
  }
]);
