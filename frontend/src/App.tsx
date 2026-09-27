import { Navigate, Route, Routes } from "react-router-dom";
import ForgotPasswordHelpPage from "./pages/ForgotPasswordHelpPage";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import MessagesPage from "./pages/community/MessagesPage";
import NotificationsPage from "./pages/community/NotificationsPage";
import GroupsPage from "./pages/community/GroupsPage";
import CalendarPage from "./pages/community/CalendarPage";
import SchoolIdentityPage from "./pages/community/SchoolIdentityPage";
import CoursesPage from "./pages/community/CoursesPage";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/palavra-passe" element={<ForgotPasswordHelpPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Navigate to="/feed" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <PrivateRoute>
            <FeedPage />
          </PrivateRoute>
        }
      />
      <Route path="/noticias" element={<Navigate to="/feed" replace />} />
      <Route
        path="/mensagens"
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/notificacoes"
        element={
          <PrivateRoute>
            <NotificationsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/grupos"
        element={
          <PrivateRoute>
            <GroupsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <PrivateRoute>
            <CalendarPage />
          </PrivateRoute>
        }
      />
      <Route path="/projetos" element={<Navigate to="/grupos#projectos" replace />} />
      <Route path="/recursos" element={<Navigate to="/escola#recursos" replace />} />
      <Route
        path="/cursos"
        element={
          <PrivateRoute>
            <CoursesPage />
          </PrivateRoute>
        }
      />
      <Route path="/escola/cursos" element={<Navigate to="/cursos" replace />} />
      <Route
        path="/escola"
        element={
          <PrivateRoute>
            <SchoolIdentityPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
