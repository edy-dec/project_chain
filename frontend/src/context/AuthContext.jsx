import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, isLoading, user: auth0User, getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const fetchMe = useCallback(async (tokenArg) => {
    const token = tokenArg || await getAccessTokenSilently();
    const { data } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const me = data?.data?.user || null;
    setCurrentUser(me);
    return me;
  }, [getAccessTokenSilently]);

  /**
   * Request interceptor: attaches a fresh Auth0 token to every axios request.
   * This runs before every call so tokens are always up-to-date.
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    const id = api.interceptors.request.use(async (config) => {
      try {
        const token = await getAccessTokenSilently();
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        delete api.defaults.headers.common['Authorization'];
        return Promise.reject(e);
      }
      return config;
    });
    return () => api.interceptors.request.eject(id);
  }, [isAuthenticated, getAccessTokenSilently]);

  /** After Auth0 login, sync the user into our DB. */
  const syncUser = useCallback(async () => {
    if (!isAuthenticated) { setUserLoading(false); return; }
    try {
      const token = await getAccessTokenSilently();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // auth0User comes from the ID token and always contains email/name.
      // The access token does NOT have these by default, so we send them in the body.
      const { data } = await api.post('/auth/sync', {
        email: auth0User?.email,
        name:  auth0User?.name || '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(data.data.user);
      await fetchMe(token);
    } catch (err) {
      delete api.defaults.headers.common['Authorization'];
      console.error('User sync failed:', err);
    } finally {
      setUserLoading(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, auth0User, fetchMe]);

  useEffect(() => {
    if (!isLoading) syncUser();
  }, [isLoading, syncUser]);

  /** Refresh the token (the interceptor handles this automatically now). */
  const refreshToken = useCallback(async () => {
    await getAccessTokenSilently({ ignoreCache: true });
  }, [getAccessTokenSilently]);

  const refreshCurrentUser = useCallback(async () => {
    if (!isAuthenticated) return null;
    try {
      return await fetchMe();
    } catch (err) {
      console.error('Refresh current user failed:', err);
      return null;
    }
  }, [isAuthenticated, fetchMe]);

  const handleLogout = () => {
    setCurrentUser(null);
    delete api.defaults.headers.common['Authorization'];
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const isAdmin   = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isAdminOrManager = isAdmin || isManager;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      loading: isLoading || userLoading,
      currentUser,
      setCurrentUser,
      auth0User,
      isAdmin,
      isManager,
      isAdminOrManager,
      login: loginWithRedirect,
      logout: handleLogout,
      refreshToken,
      refreshCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
