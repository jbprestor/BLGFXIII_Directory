import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  return user ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;