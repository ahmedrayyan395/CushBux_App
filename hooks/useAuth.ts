// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { verifyAdminAuth, getAdminToken, getAdminUser, clearAdminAuth, AuthResponse, adminLogout } from '../services/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = getAdminToken();
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      setAuthChecked(true);
      return false;
    }

    try {
      const result: AuthResponse = await verifyAdminAuth();
      
      if (result.success && result.user) {
        setIsAuthenticated(true);
        setUser(result.user);
        setAuthChecked(true);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setAuthChecked(true);
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecked(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await adminLogout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const hasPermission = useCallback((requiredPermission: string): boolean => {
    if (!user) return false;
    const permissions = user.permissions || [];
    return permissions.includes('all') || permissions.includes(requiredPermission);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin' || user?.role === 'super_admin';
  }, [user]);

  const isSuperAdmin = useCallback((): boolean => {
    return user?.role === 'super_admin';
  }, [user]);

  return { 
    isAuthenticated, 
    user, 
    loading, 
    authChecked,
    logout, 
    checkAuth,
    hasPermission,
    isAdmin,
    isSuperAdmin
  };
};