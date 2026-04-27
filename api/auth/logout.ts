import { clearSessionCookie, requireMethod, sendError } from '../../lib/http.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { getRedis } from '../../lib/redis.js';
import { deleteCurrentSession } from '../../lib/security.js';
import type { ApiRequest, ApiResponse } from '../../lib/types.js';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!requireMethod(request, response, ['POST'])) {
    return;
  }

  try {
    if (!(await rateLimit(request, response, 'general'))) {
      return;
    }

    const redis = getRedis();
    await deleteCurrentSession(redis, request);
    clearSessionCookie(response);
    response.status(200).json({ ok: true });
  } catch (error) {
    sendError(response, 500, error instanceof Error ? error.message : 'Logout failed');
  }
}
