export const KEY_PREFIX = 'scripty';
export const ACCOUNT_TTL_SECONDS = 45 * 24 * 60 * 60;
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_COOKIE = 'scripty_session';

export function key(...parts: Array<string | number>) {
  return [KEY_PREFIX, ...parts].join(':');
}
