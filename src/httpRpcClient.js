export class RpcHttpError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "RpcHttpError";
    this.kind = options.kind ?? "server";
    this.status = options.status;
    this.retryAfter = options.retryAfter;
    this.rpcError = options.rpcError;
    this.data = options.data;
  }
}

let nextRequestId = 1;

function buildHeaders(config) {
  const token = Buffer.from(`${config.user}:${config.pass}`).toString("base64");
  return {
    "content-type": "application/json",
    accept: "application/json",
    authorization: `Basic ${token}`,
  };
}

function createJsonRpcBody(method, params) {
  return JSON.stringify({
    jsonrpc: "2.0",
    id: nextRequestId++,
    method,
    params: params ?? {},
  });
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function trimText(text) {
  return text ? text.trim() : "";
}

function httpErrorMessage(status, text) {
  const suffix = trimText(text);
  return suffix ? `HTTP ${status}: ${suffix}` : `HTTP ${status}`;
}

export async function postJsonRpc(config, method, params = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  let response;
  try {
    response = await fetch(config.url, {
      method: "POST",
      headers: buildHeaders(config),
      body: createJsonRpcBody(method, params),
      signal: controller.signal,
    });
  } catch (error) {
    const message =
      error?.name === "AbortError"
        ? `Request timed out after ${config.timeoutMs} ms`
        : error instanceof Error
          ? error.message
          : String(error);
    throw new RpcHttpError(message, { kind: "network" });
  } finally {
    clearTimeout(timeout);
  }

  const text = await readResponseText(response);

  if (!response.ok) {
    throw new RpcHttpError(httpErrorMessage(response.status, text), {
      kind: "http",
      status: response.status,
      retryAfter: response.headers.get("retry-after") ?? undefined,
    });
  }

  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new RpcHttpError(`Invalid JSON response: ${message}`, {
      kind: "server",
    });
  }

  if (payload?.error) {
    const rpcError = payload.error;
    throw new RpcHttpError(rpcError.message ?? "JSON-RPC error", {
      kind: "rpc",
      rpcError,
      data: rpcError.data,
    });
  }

  return payload?.result ?? {};
}

