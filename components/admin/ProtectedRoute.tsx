// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  requiredPermissions?: string[];
  requiredRole?: string[];
  loading?: boolean;
  authChecked?: boolean;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  isAuthenticated, 
  requiredPermissions = [],
  requiredRole = [],
  loading = false,
  authChecked = true,
  children 
}) => {
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-slate-300 mt-4">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole.length > 0) {
    const userRole = localStorage.getItem('admin_role');
    const hasRequiredRole = userRole && requiredRole.includes(userRole);
    
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-slate-300">Insufficient role privileges.</p>
          </div>
        </div>
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const userPermissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');
    
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      userPermissions.includes('all') || userPermissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-slate-300">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;