// This app now has one PIN protecting it — no email is ever shown or typed
// by the user. The backend's user model still needs a unique identity
// internally, so a fixed one is used here rather than exposing it as a
// field. If a forgotten PIN ever needs resetting, it's done directly in the
// database against this email (see backend userService.changePin / the
// users table) — there's no in-app recovery flow.
export const OWNER_EMAIL = 'owner@shamsalbarakat.local';
export const OWNER_NAME = 'Owner';
