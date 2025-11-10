import axios from 'axios';

/**
 * User data stored in localStorage and returned from auth endpoints.
 */
export interface User {
  userId: string;
  username: string;
}

/**
 * Auth service for handling user authentication.
 * Manages localStorage for user persistence across page refreshes.
 */
const AUTH_STORAGE_KEY = 'rapidphoto_user';

/**
 * Creates and configures an axios instance for auth requests.
 */
const createAuthClient = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  return axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const authClient = createAuthClient();

/**
 * Register a new user.
 * 
 * @param username The username for the new account
 * @param password The password for the new account
 * @returns User object with userId and username
 * @throws Error if registration fails (e.g., duplicate username)
 */
export async function register(username: string, password: string): Promise<User> {
  try {
    const response = await authClient.post<{ userId: string; username: string }>(
      '/api/auth/register',
      { username, password }
    );
    
    const user: User = {
      userId: response.data.userId,
      username: response.data.username,
    };
    
    return user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as { error?: string } | undefined;
      
      if (status === 409) {
        throw new Error(errorData?.error || 'Username already exists');
      }
      
      throw new Error(errorData?.error || 'Registration failed');
    }
    
    throw new Error('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Login with username and password.
 * 
 * @param username The username
 * @param password The password
 * @returns User object with userId and username
 * @throws Error if login fails (e.g., invalid credentials)
 */
export async function login(username: string, password: string): Promise<User> {
  try {
    const response = await authClient.post<{ userId: string; username: string }>(
      '/api/auth/login',
      { username, password }
    );
    
    const user: User = {
      userId: response.data.userId,
      username: response.data.username,
    };
    
    return user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data as { error?: string } | undefined;
      
      if (status === 401) {
        throw new Error(errorData?.error || 'Invalid username or password');
      }
      
      throw new Error(errorData?.error || 'Login failed');
    }
    
    throw new Error('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Logout the current user by clearing localStorage.
 */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Get the current user from localStorage.
 * 
 * @returns User object if found, null otherwise
 */
export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    
    const user = JSON.parse(stored) as User;
    
    // Validate that user has required fields
    if (!user.userId || !user.username) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
    return null;
  }
}

/**
 * Check if a user is currently authenticated.
 * 
 * @returns true if user exists in localStorage, false otherwise
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Save user to localStorage.
 * 
 * @param user The user object to save
 */
export function saveUser(user: User): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

