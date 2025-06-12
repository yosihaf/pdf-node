// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // טעינה ראשונית של נתוני האימות מה-localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('user_data');

        if (savedToken && savedUser) {
          const userData = JSON.parse(savedUser);
          
          // בדיקה שהטוקן עדיין תקף
          const isValid = await validateToken(savedToken);
          
          if (isValid) {
            setToken(savedToken);
            setUser(userData);
            

          } else {
            // טוקן לא תקף - נקה את הנתונים
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('שגיאה בטעינת נתוני האימות:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // פונקציה לבדיקת תקפות הטוקן
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';
      
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('שגיאה בבדיקת תקפות הטוקן:', error);
      return false;
    }
  };

  // פונקציה להתחברות
  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בהתחברות');
      }

      const data: AuthResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'שגיאה בהתחברות');
      }

      // שמירת נתוני האימות
      setToken(data.token);
      setUser(data.user);
      
      // שמירה ב-localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      


    } catch (error) {
      console.error('שגיאה בהתחברות:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה להרשמה
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://pdf.test.hamichlol.org.il/api';

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בהרשמה');
      }

      const data: AuthResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'שגיאה בהרשמה');
      }

      // שמירת נתוני האימות (התחברות אוטומטית לאחר הרשמה)
      setToken(data.token);
      setUser(data.user);
      
      // שמירה ב-localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      


    } catch (error) {
      console.error('שגיאה בהרשמה:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // פונקציה להתנתקות
  const logout = (): void => {
    clearAuthData();

  };

  // פונקציה לעדכון נתוני המשתמש
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  // פונקציות עזר
  const clearAuthData = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  };



  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;