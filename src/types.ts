export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type Endpoint = {
  id: string;
  group: string;
  name: string;
  method: HttpMethod;
  path: string;
  summary: string;
  request_type?: string;
  response_type?: string;
  body: unknown;
  response_example?: unknown;
};

export type ApiResult = {
  ok: boolean;
  status: number;
  statusText: string;
  elapsedMs: number;
  headers: Record<string, string>;
  body: string;
  bodyType: "json" | "text" | "empty";
};

export type ParsedBody = {
  value: unknown;
  error: string;
};
