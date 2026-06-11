import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../shared/components/AppShell";
import { CreateNotePage } from "../pages/CreateNotePage";
import { HomePage } from "../pages/HomePage";
import { LibraryPage } from "../pages/LibraryPage";
import { MapPage } from "../pages/MapPage";
import { MyPage } from "../pages/MyPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/map", element: <MapPage /> },
      { path: "/note/new", element: <CreateNotePage /> },
      { path: "/library", element: <LibraryPage /> },
      { path: "/my", element: <MyPage /> }
    ]
  }
]);
