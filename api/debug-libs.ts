import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default async function handler(_req: IncomingMessage, res: Res) {
  try {
    const { key } = await import('../lib/constants.js');
    const { parseCookies } = await import('../lib/http.js');
    const k = key('test', '1');
    const c = parseCookies('a=1; b=2');
    res.status(200).json({ ok: true, key: k, cookies: c, note: 'dynamic import v3' });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e), stack: e instanceof Error ? e.stack : undefined });
  }
}
