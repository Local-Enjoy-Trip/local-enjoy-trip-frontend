import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../shared/components/AppShell";
import { CreateNotePage } from "../pages/CreateNotePage";
import { CreateCoursePage } from "../pages/CreateCoursePage";
import { CourseDetailPage } from "../pages/CourseDetailPage";
import { CoursePage } from "../pages/CoursePage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { MapPage } from "../pages/MapPage";
import { MyPage } from "../pages/MyPage";
import { NoteLocationPage } from "../pages/NoteLocationPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/note/new", element: <CreateNotePage /> },
      { path: "/note/location", element: <NoteLocationPage /> },
      { path: "/course", element: <CoursePage /> },
      { path: "/course/new", element: <CreateCoursePage /> },
      { path: "/course/:courseId", element: <CourseDetailPage /> },
      { path: "/my", element: <MyPage /> }
    ]
  }
]);
