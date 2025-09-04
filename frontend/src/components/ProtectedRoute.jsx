import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;