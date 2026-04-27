import type { AppSnapshot, ScriptProject } from '../src/types/scripty';
import { ACCOUNT_TTL_SECONDS, key } from '../lib/constants.js';
import { parseJsonBody, requireMethod, sendError } from '../lib/http.js';
import { rateLimit } from '../lib/rateLimit.js';
import { getRedis } from '../lib/redis.js';
import { getSessionUser, usernameHash } from '../lib/security.js';
import type { ApiRequest, ApiResponse } from '../lib/types.js';

interface SaveBody {
  project?: ScriptProject;
}

function isValidProject(project: unknown): project is ScriptProject {
  if (!project || typeof project !== 'object') {
    return false;
  }

  const candidate = project as ScriptProject;
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && Array.isArray(candidate.blocks)
    && Array.isArray(candidate.rehearsalSamples)
    && typeof candidate.settings?.wordsPerMinute === 'number';
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (!requireMethod(request, response, ['GET', 'POST'])) {
    return;
  }

  try {
    if (!(await rateLimit(request, response, 'scripts'))) {
      return;
    }

    const redis = getRedis();
    const user = await getSessionUser(redis, request);

    if (!user) {
      sendError(response, 401, 'Sign in to use cloud sync.');
      return;
    }

    const scriptKey = key('scripts', user.id);
    const userKey = key('users', usernameHash(user.username));

    if (request.method === 'GET') {
      const snapshot = await redis.get<AppSnapshot | null>(scriptKey);
      await redis.expire(scriptKey, ACCOUNT_TTL_SECONDS);
      await redis.expire(userKey, ACCOUNT_TTL_SECONDS);
      response.status(200).json({ snapshot });
      return;
    }

    const body = parseJsonBody<SaveBody>(request);
    if (!isValidProject(body.project)) {
      sendError(response, 400, 'Invalid project payload.');
      return;
    }

    const snapshot: AppSnapshot = {
      project: body.project,
      updatedAt: new Date().toISOString()
    };

    await redis.set(scriptKey, snapshot, { ex: ACCOUNT_TTL_SECONDS });
    await redis.expire(userKey, ACCOUNT_TTL_SECONDS);
    response.status(200).json({ snapshot });
  } catch (error) {
    sendError(response, 500, error instanceof Error ? error.message : 'Script sync failed');
  }
}
