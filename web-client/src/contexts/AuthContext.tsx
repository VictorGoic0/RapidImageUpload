import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '@/services/auth';
import type { User } from '@/services/auth';

/**
 * Auth context type definition.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * Auth context instance.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that manages authentication state.
 * Loads user from localStorage on mount and provides auth functions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = authService.getCurrentUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  /**
   * Login function that authenticates user and saves to state/localStorage.
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const authenticatedUser = await authService.login(username, password);
      authService.saveUser(authenticatedUser);
      setUser(authenticatedUser);
      navigate('/gallery');
    } catch (error) {
      // Re-throw error so components can handle it
      throw error;
    }
  };

  /**
   * Register function that creates new user and saves to state/localStorage.
   */
  const register = async (username: string, password: string): Promise<void> => {
    try {
      const newUser = await authService.register(username, password);
      authService.saveUser(newUser);
      setUser(newUser);
      navigate('/gallery');
    } catch (error) {
      // Re-throw error so components can handle it
      throw error;
    }
  };

  /**
   * Logout function that clears state and localStorage.
   */
  const logout = (): void => {
    authService.logout();
    setUser(null);
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: user !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 * 
 * @returns AuthContextType
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

