import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';
import { key } from './_lib/constants';
import { parseCookies } from './_lib/http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default function handler(_req: IncomingMessage, res: Res) {
  try {
    const k = key('test', '1');
    const c = parseCookies('a=1; b=2');
    res.status(200).json({ ok: true, key: k, cookies: c });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
