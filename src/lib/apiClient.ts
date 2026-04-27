import type { AppSnapshot, AuthUser, ScriptProject } from '../types/scripty';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'Request failed');
  }

  return body as T;
}

export function getCurrentUser() {
  return request<{ user: AuthUser | null }>('/api/me');
}

export function register(username: string, password: string) {
  return request<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export function login(username: string, password: string) {
  return request<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export function logout() {
  return request<{ ok: true }>('/api/auth/logout', {
    method: 'POST'
  });
}

export function loadCloudProject() {
  return request<{ snapshot: AppSnapshot | null }>('/api/scripts');
}

export function saveCloudProject(project: ScriptProject) {
  return request<{ snapshot: AppSnapshot }>('/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ project })
  });
}
