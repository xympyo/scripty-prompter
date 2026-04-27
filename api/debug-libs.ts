import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';
import { getRedis } from './_lib/redis';
import { rateLimit } from './_lib/rateLimit';
import { key } from './_lib/constants';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default async function handler(req: IncomingMessage, res: Res) {
  try {
    const redis = getRedis();
    res.status(200).json({ ok: true, redisType: typeof redis, keyTest: key('test', '1') });
  } catch (e) {
    res.status(200).json({ ok: false, phase: 'redis-init', error: e instanceof Error ? e.message : String(e) });
  }
}
