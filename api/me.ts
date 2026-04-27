import { ACCOUNT_TTL_SECONDS, key } from './lib/constants';
import { requireMethod, sendError } from './lib/http';
import { rateLimit } from './lib/rateLimit';
import { getRedis } from './lib/redis';
import { getSessionUser, usernameHash } from './lib/security';
import type { ApiRequest, ApiResponse } from './lib/types';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!requireMethod(request, response, ['GET'])) {
    return;
  }

  try {
    if (!(await rateLimit(request, response, 'general'))) {
      return;
    }

    const redis = getRedis();
    const user = await getSessionUser(redis, request);

    if (user) {
      await redis.expire(key('users', usernameHash(user.username)), ACCOUNT_TTL_SECONDS);
      await redis.expire(key('scripts', user.id), ACCOUNT_TTL_SECONDS);
    }

    response.status(200).json({ user });
  } catch (error) {
    sendError(response, 500, error instanceof Error ? error.message : 'Session lookup failed');
  }
}
