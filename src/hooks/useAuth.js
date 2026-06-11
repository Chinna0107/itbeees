import { useState, useCallback } from 'react';
import { adminApi } from '../utils/api';
import { getAuthUser, setAuthUser, clearAuthUser } from '../utils/auth';

const useAuth = () => {
  const [user, setUser] = useState(getAuthUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((credentials) => run(async () => {
    const res = await adminApi.login(credentials);
    setAuthUser(res.data);
    setUser(res.data);
    return res;
  }), [run]);

  const logout = useCallback(() => run(async () => {
    const auth = getAuthUser();
    if (auth?.refreshToken) await adminApi.logout(auth.refreshToken).catch(() => {});
    clearAuthUser();
    setUser(null);
  }), [run]);

  const forgotPassword = useCallback((email) => run(() => adminApi.forgotPassword(email)), [run]);
  const verifyResetOtp = useCallback((email, otp) => run(() => adminApi.verifyResetOtp(email, otp)), [run]);
  const resetPassword = useCallback((email, otp, newPassword) => run(() => adminApi.resetPassword(email, otp, newPassword)), [run]);

  return { user, loading, error, login, logout, forgotPassword, verifyResetOtp, resetPassword, isLoggedIn: !!user };
};

export default useAuth;
