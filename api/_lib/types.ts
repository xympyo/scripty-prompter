import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  headers: IncomingHttpHeaders;
  method?: string;
}

export interface ApiResponse extends ServerResponse {
  status(statusCode: number): ApiResponse;
  json(body: unknown): void;
}