import { clearSessionCookie, requireMethod, sendError } from '../_lib/http';
import { rateLimit } from '../_lib/rateLimit';
import { getRedis } from '../_lib/redis';
import { deleteCurrentSession } from '../_lib/security';
import type { ApiRequest, ApiResponse } from '../_lib/types';

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
