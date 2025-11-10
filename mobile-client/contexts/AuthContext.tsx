import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/auth';
import type { User } from '../services/auth';

/**
 * Auth context type definition.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
 * Loads user from AsyncStorage on mount and provides auth functions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await authService.getCurrentUser();
        setUser(storedUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  /**
   * Login function that authenticates user and saves to state/AsyncStorage.
   * Navigation is handled by RootLayoutNav based on authentication state.
   */
  const login = async (username: string, password: string): Promise<void> => {
    try {
      const authenticatedUser = await authService.login(username, password);
      await authService.saveUser(authenticatedUser);
      setUser(authenticatedUser);
      // Navigation will be handled automatically by RootLayoutNav
    } catch (error) {
      // Re-throw error so components can handle it
      throw error;
    }
  };

  /**
   * Register function that creates new user and saves to state/AsyncStorage.
   * Navigation is handled by RootLayoutNav based on authentication state.
   */
  const register = async (username: string, password: string): Promise<void> => {
    try {
      const newUser = await authService.register(username, password);
      await authService.saveUser(newUser);
      setUser(newUser);
      // Navigation will be handled automatically by RootLayoutNav
    } catch (error) {
      // Re-throw error so components can handle it
      throw error;
    }
  };

  /**
   * Logout function that clears state and AsyncStorage.
   * Navigation is handled by RootLayoutNav based on authentication state.
   */
  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    // Navigation will be handled automatically by RootLayoutNav
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

