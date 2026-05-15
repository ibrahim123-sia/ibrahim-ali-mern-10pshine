import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/context.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default ProtectedRoute;
