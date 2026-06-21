import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../shared/components/AppShell";
import { CreateNotePage } from "../pages/CreateNotePage";
import { CreateCoursePage } from "../pages/CreateCoursePage";
import { CourseDetailPage } from "../pages/CourseDetailPage";
import { CoursePage } from "../pages/CoursePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { EmailLoginPage } from "../pages/EmailLoginPage";
import { MapPage } from "../pages/MapPage";
import { MyPage } from "../pages/MyPage";
import { NoteLocationPage } from "../pages/NoteLocationPage";
import { SignupPage } from "../pages/SignupPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/login/email", element: <EmailLoginPage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/note/new", element: <CreateNotePage /> },
      { path: "/note/location", element: <NoteLocationPage /> },
      { path: "/course", element: <CoursePage /> },
      { path: "/course/new", element: <CreateCoursePage /> },
      { path: "/course/:courseId", element: <CourseDetailPage /> },
      { path: "/my", element: <MyPage /> }
    ]
  },
  { path: "/signup", element: <SignupPage /> }
]);
