import type { IncomingMessage } from 'node:http';
import type { ServerResponse } from 'node:http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

// Test: inline code, NO relative imports from _lib
export default function handler(_req: IncomingMessage, res: Res) {
  try {
    // replicate key() inline
    const k = ['scripty', 'test', '1'].join(':');
    // replicate parseCookies inline
    const cookies = Object.fromEntries(
      'a=1; b=2'.split(';').map(c => c.trim()).filter(Boolean).map(c => {
        const [n, ...v] = c.split('=');
        return [n, v.join('=')];
      })
    );
    res.status(200).json({ ok: true, key: k, cookies, note: 'no _lib imports' });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
