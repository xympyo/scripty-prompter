import { ACCOUNT_TTL_SECONDS, key } from '../lib/constants.js';
import { requireMethod, sendError } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getRedis } from '../lib/redis.js';
import { getSessionUser, usernameHash } from '../lib/security.js';
import type { ApiRequest, ApiResponse } from '../lib/types.js';

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
