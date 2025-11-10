import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * User data stored in AsyncStorage and returned from auth endpoints.
 */
export interface User {
  userId: string;
  username: string;
}

/**
 * Auth service for handling user authentication.
 * Manages AsyncStorage for user persistence across app restarts.
 */
const AUTH_STORAGE_KEY = 'rapidphoto_user';

/**
 * Creates and configures an axios instance for auth requests.
 */
const createAuthClient = () => {
  const baseURL = process.env.EXPO_PUBLIC_API_URL;
  
  if (!baseURL) {
    throw new Error('EXPO_PUBLIC_API_URL environment variable is required but not set');
  }
  
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
 * Logout the current user by clearing AsyncStorage.
 */
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user from AsyncStorage:', error);
  }
}

/**
 * Get the current user from AsyncStorage.
 * 
 * @returns User object if found, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
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
    console.error('Error reading user from AsyncStorage:', error);
    return null;
  }
}

/**
 * Check if a user is currently authenticated.
 * 
 * @returns true if user exists in AsyncStorage, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Save user to AsyncStorage.
 * 
 * @param user The user object to save
 */
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to AsyncStorage:', error);
  }
}

