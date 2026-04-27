import { key } from './constants.js';
import { getClientIp, sendError } from './http.js';
import { getRedis } from './redis.js';
import type { ApiRequest, ApiResponse } from './types.js';

const limits = {
  auth: { requests: 12, windowSeconds: 60 },
  scripts: { requests: 90, windowSeconds: 60 },
  general: { requests: 120, windowSeconds: 60 }
};

export async function rateLimit(request: ApiRequest, response: ApiResponse, bucket: keyof typeof limits) {
  const redis = getRedis();
  const ip = getClientIp(request);
  const limit = limits[bucket];
  const windowId = Math.floor(Date.now() / (limit.windowSeconds * 1000));
  const rateKey = key('ratelimit', bucket, createIpHash(ip), windowId);
  const count = await redis.incr(rateKey);

  if (count === 1) {
    await redis.expire(rateKey, limit.windowSeconds + 5);
  }

  response.setHeader('X-RateLimit-Limit', String(limit.requests));
  response.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit.requests - count)));

  if (count > limit.requests) {
    sendError(response, 429, 'Too many requests. Try again shortly.');
    return false;
  }

  return true;
}

function createIpHash(ip: string) {
  let hash = 0;
  for (let index = 0; index < ip.length; index += 1) {
    hash = (hash << 5) - hash + ip.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
