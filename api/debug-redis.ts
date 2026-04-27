import { Redis } from '@upstash/redis';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default function handler(_req: IncomingMessage, res: Res) {
  try {
    const r = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL ?? 'x', token: process.env.UPSTASH_REDIS_REST_TOKEN ?? 'x' });
    res.status(200).json({ ok: true, type: typeof r });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
