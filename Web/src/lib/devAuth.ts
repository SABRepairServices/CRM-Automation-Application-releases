// The app now has a real PIN gate (see app/login/page.tsx) that the owner
// actually uses, so the auto-provisioned dev session must stay off — this
// only exists for local development convenience when explicitly needed.
export const BYPASS_AUTH = false;

const DEV_EMAIL = 'dev-pin@local.test';
const DEV_PIN = '135790';
const DEV_NAME = 'Dev User';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Ensures a real JWT exists in localStorage by silently registering/logging
 * in a fixed dev account. This keeps every backend call (which requires a
 * real token + real client ownership check) working while the login page
 * is bypassed in the UI.
 */
export async function ensureDevSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('token')) return;

  const axios = (await import('axios')).default;

  const login = async () => {
    const res = await axios.post(`${API_URL}/auth/login`, { email: DEV_EMAIL, pin: DEV_PIN });
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
  };

  try {
    await login();
  } catch {
    try {
      await axios.post(`${API_URL}/auth/register`, { email: DEV_EMAIL, pin: DEV_PIN, fullName: DEV_NAME });
      await login();
    } catch (err) {
      console.error('Dev auto-session failed — API may not be reachable yet.', err);
    }
  }
}
