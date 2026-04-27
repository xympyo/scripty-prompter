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

interface LoginBody {
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

    const body = parseJsonBody<LoginBody>(request);
    const username = normalizeUsername(body.username ?? '');
    const password = body.password ?? '';

    if (!validateUsername(username) || !validatePassword(password)) {
      sendError(response, 401, 'Invalid username or password.');
      return;
    }

    const redis = getRedis();
    const userKey = key('users', usernameHash(username));
    const userRecord = await redis.get<UserRecord>(userKey);

    if (!userRecord || !(await bcrypt.compare(password, userRecord.passwordHash))) {
      sendError(response, 401, 'Invalid username or password.');
      return;
    }

    const nextRecord: UserRecord = {
      ...userRecord,
      lastSeenAt: new Date().toISOString()
    };

    await redis.set(userKey, nextRecord, { ex: ACCOUNT_TTL_SECONDS });
    await redis.expire(key('scripts', userRecord.id), ACCOUNT_TTL_SECONDS);
    await createSession(redis, response, publicUser(nextRecord));

    response.status(200).json({ user: publicUser(nextRecord) });
  } catch (error) {
    sendError(response, 500, error instanceof Error ? error.message : 'Login failed');
  }
}
