import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

const USER_STORAGE_KEY = '@upsc_user';
const GUEST_USER_KEY = '@upsc_guest_user';

// Generate a unique guest ID
const generateGuestId = () => {
  return 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Check for existing user session on app launch
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      console.log('Checking user session...');
      
      const hasLaunched = await AsyncStorage.getItem('@has_launched');
      if (hasLaunched) {
        setIsFirstLaunch(false);
      }
      
      // Check for stored user (regular or guest)
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const guestUser = await AsyncStorage.getItem(GUEST_USER_KEY);
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsGuestMode(userData.isGuest || false);
          console.log('User restored from storage:', userData.email || userData.name);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      } else if (guestUser) {
        try {
          const userData = JSON.parse(guestUser);
          setUser(userData);
          setIsGuestMode(true);
          console.log('Guest user restored:', userData.name);
        } catch (e) {
          console.error('Error parsing guest user:', e);
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (userData) => {
    try {
      console.log('Signing in user:', userData.email || userData.name);
      const userToStore = {
        ...userData,
        signedInAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
      await AsyncStorage.setItem('@has_launched', 'true');
      setUser(userToStore);
      setIsGuestMode(userData.isGuest || false);
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign in as guest - no backend required
  const signInAsGuest = async (name = 'Guest User') => {
    try {
      console.log('Signing in as guest:', name);
      const guestUser = {
        id: generateGuestId(),
        name: name,
        email: null,
        picture: null,
        provider: 'guest',
        isGuest: true,
        signedInAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(guestUser));
      await AsyncStorage.setItem(GUEST_USER_KEY, JSON.stringify(guestUser));
      await AsyncStorage.setItem('@has_launched', 'true');
      setUser(guestUser);
      setIsGuestMode(true);
      setIsFirstLaunch(false);
      return guestUser;
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_USER_KEY);
      setUser(null);
      setIsGuestMode(false);
    } catch (error) {
      console.error('Error signing out:', error);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_USER_KEY);
      setUser(null);
      setIsGuestMode(false);
    }
  };

  // Simple local sign in - stores user data locally without backend
  const signInWithEmail = async (email, password) => {
    try {
      console.log('Signing in locally with email:', email);
      
      // For local-only mode, just create a user object and store it
      // No backend validation - this is purely for local data organization
      const userId = 'local_' + email.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString(36);
      
      const userData = {
        id: userId,
        email: email,
        name: email.split('@')[0] || 'User',
        picture: null,
        provider: 'local',
        isLocal: true,
      };
      
      await signIn(userData);
      return userData;
    } catch (error) {
      console.error('Error in signInWithEmail:', error);
      throw error;
    }
  };

  // Simple local sign up - stores user data locally without backend
  const signUpWithEmail = async (email, password, name) => {
    try {
      console.log('Signing up locally with email:', email);
      
      // For local-only mode, just create a user object and store it
      const userId = 'local_' + email.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Date.now().toString(36);
      
      const userData = {
        id: userId,
        email: email,
        name: name || email.split('@')[0] || 'User',
        picture: null,
        provider: 'local',
        isLocal: true,
      };
      
      await signIn(userData);
      return userData;
    } catch (error) {
      console.error('Error in signUpWithEmail:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      // Clear all user data
      const keysToRemove = [
        USER_STORAGE_KEY,
        '@upsc_stats',
        '@upsc_streak',
        '@upsc_test_history',
        '@upsc_settings',
        '@question_bank',
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      setUser(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isFirstLaunch,
        isGuestMode,
        signIn,
        signOut,
        signInAsGuest,
        signInWithEmail,
        signUpWithEmail,
        deleteAccount,
        updateUser,
        completeOnboarding,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

