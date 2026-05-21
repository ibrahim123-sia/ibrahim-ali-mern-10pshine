import { Navigate, useNavigate } from "react-router-dom";
import Login from "../auth/login.jsx";
import Register from "../auth/register.jsx";
import { useAppContext } from "../context/context.jsx";

export const LoginRoute = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <Login
      onSwitchToRegister={() => navigate("/register")}
      onLoginSuccess={() => navigate("/", { replace: true })}
    />
  );
};

export const RegisterRoute = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return (
    <Register
      onSwitchToLogin={() => navigate("/login")}
      onRegisterSuccess={() => navigate("/", { replace: true })}
    />
  );
};
