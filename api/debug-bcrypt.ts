import bcrypt from 'bcryptjs';
import type { IncomingMessage, ServerResponse } from 'node:http';

interface Res extends ServerResponse {
  status(c: number): Res;
  json(b: unknown): void;
}

export default async function handler(_req: IncomingMessage, res: Res) {
  try {
    const hash = await bcrypt.hash('testpassword', 10);
    res.status(200).json({ ok: true, hashLength: hash.length });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
}
