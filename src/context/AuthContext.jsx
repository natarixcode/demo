// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Clear error function
  const clearError = () => setError(null);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        // Clear invalid stored data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    };
    
    checkAuth();
  }, []);

  // Enhanced login function
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        setUser(data.user);
        setIsAuthenticated(true);
        
        toast.success(`Welcome back, ${data.user.username}!`);
        return { success: true, user: data.user };
      } else {
        // Handle API errors
        const errorMessage = data.details || data.error || 'Login failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'Network error during login';
      setError(errorMessage);
      toast.error('Unable to connect to server. Please try again.');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced register function
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        setUser(data.user);
        setIsAuthenticated(true);
        
        toast.success(`Welcome to Natarix, ${data.user.username}! Account created successfully.`);
        return { success: true, user: data.user };
      } else {
        // Handle API errors
        const errorMessage = data.details || data.error || 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = err.message || 'Network error during registration';
      setError(errorMessage);
      toast.error('Unable to connect to server. Please try again.');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/check-username/${username}`);
      const data = await response.json();
      
      if (response.ok) {
        return { success: true, available: data.available };
      } else {
        return { success: false, available: false, error: data.error };
      }
    } catch (err) {
      console.error('Error checking username:', err);
      return { success: false, available: false, error: 'Network error' };
    }
  };

  // Create demo users function
  const createDemoUsers = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/create-demo-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Demo users created: ${data.total} users`);
        return { success: true, users: data.created };
      } else {
        const errorMessage = data.error || 'Failed to create demo users';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'Failed to create demo users';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login with demo user
  const loginAsDemoUser = async (userType = 'demo') => {
    const demoCredentials = {
      demo: { email: 'demo@notorix.com', password: 'demo123' },
      test: { email: 'test@notorix.com', password: 'test123' },
      admin: { email: 'admin@notorix.com', password: 'admin123' }
    };

    const credentials = demoCredentials[userType];
    if (!credentials) {
      toast.error('Invalid demo user type');
      return { success: false };
    }

    toast.info(`Logging in as ${userType} user...`);
    return await login(credentials);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    // Clear stored data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    toast.success('Logged out successfully');
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = { ...user, ...data.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully');
        return { success: true, user: updatedUser };
      } else {
        const errorMessage = data.error || 'Failed to update profile';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage = 'Network error during profile update';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Get authentication header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    updateProfile,
    checkUsernameAvailability,
    createDemoUsers,
    loginAsDemoUser,
    getAuthHeader
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 