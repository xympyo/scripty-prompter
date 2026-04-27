import { ACCOUNT_TTL_SECONDS, key } from './_lib/constants';
import { requireMethod, sendError } from './_lib/http';
import { rateLimit } from './_lib/rateLimit';
import { getRedis } from './_lib/redis';
import { getSessionUser, usernameHash } from './_lib/security';
import type { ApiRequest, ApiResponse } from './_lib/types';

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
