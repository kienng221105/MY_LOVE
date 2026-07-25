import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export function useAuth() {
  const { isAuthenticated, user, login, logout, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    isAuthenticated,
    user,
    login,
    logout,
  };
}
