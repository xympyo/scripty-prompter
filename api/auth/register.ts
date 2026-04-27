import bcrypt from 'bcryptjs';
import { ACCOUNT_TTL_SECONDS, key } from '../../lib/constants';
import { parseJsonBody, requireMethod, sendError } from '../../lib/http';
import { rateLimit } from '../../lib/rateLimit';
import { getRedis } from '../../lib/redis';
import {
  createSession,
  normalizeUsername,
  publicUser,
  usernameHash,
  validatePassword,
  validateUsername,
  type UserRecord
} from '../../lib/security';
import type { ApiRequest, ApiResponse } from '../../lib/types';

interface RegisterBody {
  username?: string;
  password?: string;
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!requireMethod(request, response, ['POST'])) {
    return;
  }

  try {
    if (!(await rateLimit(request, response, 'auth'))) {
      return;
    }

    const body = parseJsonBody<RegisterBody>(request);
    const username = normalizeUsername(body.username ?? '');
    const password = body.password ?? '';

    if (!validateUsername(username)) {
      sendError(response, 400, 'Use 3-24 lowercase letters, numbers, or underscores.');
      return;
    }

    if (!validatePassword(password)) {
      sendError(response, 400, 'Password must be 8-128 characters.');
      return;
    }

    const redis = getRedis();
    const userKey = key('users', usernameHash(username));
    const existingUser = await redis.get<UserRecord>(userKey);

    if (existingUser) {
      sendError(response, 409, 'Username is already taken.');
      return;
    }

    const timestamp = new Date().toISOString();
    const userRecord: UserRecord = {
      id: crypto.randomUUID(),
      username,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSeenAt: timestamp
    };

    await redis.set(userKey, userRecord, { ex: ACCOUNT_TTL_SECONDS });
    await createSession(redis, response, publicUser(userRecord));

    response.status(201).json({ user: publicUser(userRecord) });
  } catch (error) {
    sendError(response, 500, error instanceof Error ? error.message : 'Registration failed');
  }
}
