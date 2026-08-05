// Toggle in one place. Flip to false once real accounts are required —
// the login/register pages and JWT flow are fully built and tested;
// this just auto-provisions a dev session so you can use the app
// without manually signing in every time.
export const BYPASS_AUTH = true;

const DEV_EMAIL = 'dev@local.test';
const DEV_PASSWORD = 'dev-local-bypass-password';
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
    const res = await axios.post(`${API_URL}/auth/login`, { email: DEV_EMAIL, password: DEV_PASSWORD });
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
  };

  try {
    await login();
  } catch {
    try {
      await axios.post(`${API_URL}/auth/register`, { email: DEV_EMAIL, password: DEV_PASSWORD, fullName: DEV_NAME });
      await login();
    } catch (err) {
      console.error('Dev auto-session failed — API may not be reachable yet.', err);
    }
  }
}
