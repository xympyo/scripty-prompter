import type { ApiRequest, ApiResponse } from './types.js';

export function sendError(response: ApiResponse, status: number, error: string) {
  return response.status(status).json({ error });
}

export function requireMethod(request: ApiRequest, response: ApiResponse, methods: string[]) {
  if (!request.method || !methods.includes(request.method)) {
    response.setHeader('Allow', methods.join(', '));
    sendError(response, 405, 'Method not allowed');
    return false;
  }

  return true;
}

export function getClientIp(request: ApiRequest) {
  const forwardedFor = request.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return firstForwarded?.split(',')[0]?.trim()
    || request.headers['x-real-ip']?.toString()
    || request.socket.remoteAddress
    || 'unknown';
}

export function parseJsonBody<T>(request: ApiRequest): T {
  if (typeof request.body === 'string') {
    return JSON.parse(request.body) as T;
  }

  return request.body as T;
}

export function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const [name, ...rest] = cookie.split('=');
        return [decodeURIComponent(name), decodeURIComponent(rest.join('='))];
      })
  );
}

export function setSessionCookie(response: ApiResponse, sessionId: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `scripty_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${maxAgeSeconds}`
  );
}

export function clearSessionCookie(response: ApiResponse) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `scripty_session=; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=0`
  );
}
