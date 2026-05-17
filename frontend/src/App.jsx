import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/context.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import ProtectedRoute from "./router/ProtectedRoute.jsx";
import { LoginRoute, RegisterRoute } from "./router/AuthRoutes.jsx";
import NotesPage from "./pages/NotesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/register" element={<RegisterRoute />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
