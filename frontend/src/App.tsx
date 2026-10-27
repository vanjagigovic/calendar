import { Calendar } from "./components/Calendar";
import { formatDateKey } from "./utils/calendar-utils";
import { Route, Routes, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import ProfilePage from './pages/ProfilePage';

function CalendarRedirect() {
  return (
    <Navigate to={`/calendar/month/${formatDateKey(new Date())}`} replace />
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<CalendarRedirect />} />
        <Route path="/calendar/:view/:date" element={<Calendar />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<CalendarRedirect />} />
      </Route>
    </Routes>
  );
}
