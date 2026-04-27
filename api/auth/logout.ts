import { clearSessionCookie, requireMethod, sendError } from '../../lib/http';
import { rateLimit } from '../../lib/rateLimit';
import { getRedis } from '../../lib/redis';
import { deleteCurrentSession } from '../../lib/security';
import type { ApiRequest, ApiResponse } from '../../lib/types';

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
