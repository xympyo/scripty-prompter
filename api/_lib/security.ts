import { createHash, randomUUID } from 'node:crypto';
import { jwtVerify, SignJWT } from 'jose';
import type { Redis } from '@upstash/redis';
import type { AuthUser } from '../../src/types/scripty';
import { SESSION_COOKIE, SESSION_TTL_SECONDS, key } from './constants';
import { parseCookies, setSessionCookie } from './http';
import type { ApiRequest, ApiResponse } from './types';

export interface UserRecord extends AuthUser {
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  username: string;
  createdAt: string;
}

interface SessionClaims {
  sid: string;
  username: string;
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

export function validatePassword(password: string) {
  return password.length >= 8 && password.length <= 128;
}

export function usernameHash(username: string) {
  return createHash('sha256').update(normalizeUsername(username)).digest('hex').slice(0, 32);
}

export function publicUser(record: UserRecord): AuthUser {
  return { id: record.id, username: record.username };
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error('JWT_SECRET must be at least 24 characters');
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(redis: Redis, response: ApiResponse, user: AuthUser) {
  const sessionId = randomUUID();
  const sessionRecord: SessionRecord = {
    id: sessionId,
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString()
  };

  await redis.set(key('sessions', sessionId), sessionRecord, { ex: SESSION_TTL_SECONDS });

  const token = await new SignJWT({ sid: sessionId, username: user.username } satisfies SessionClaims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(jwtSecret());

  setSessionCookie(response, token, SESSION_TTL_SECONDS);
}

export async function getSessionUser(redis: Redis, request: ApiRequest): Promise<AuthUser | null> {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionClaims>(token, jwtSecret());
    const sessionId = verified.payload.sid;
    if (!sessionId || !verified.payload.sub) {
      return null;
    }

    const sessionRecord = await redis.get<SessionRecord>(key('sessions', sessionId));
    if (!sessionRecord || sessionRecord.userId !== verified.payload.sub) {
      return null;
    }

    return { id: sessionRecord.userId, username: sessionRecord.username };
  } catch {
    return null;
  }
}

export async function deleteCurrentSession(redis: Redis, request: ApiRequest) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return;
  }

  try {
    const verified = await jwtVerify<SessionClaims>(token, jwtSecret());
    if (verified.payload.sid) {
      await redis.del(key('sessions', verified.payload.sid));
    }
  } catch {
    return;
  }
}
