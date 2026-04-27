import { SignJWT } from 'jose';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default async function handler(_req: IncomingMessage, res: Res) {
  try {
    const secret = new TextEncoder().encode('test-secret-at-least-24-chars-ok');
    const token = await new SignJWT({ test: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
    res.status(200).json({ ok: true, tokenLength: token.length });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
