const DEFAULT_TIMEOUT_MS = 30000;

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

function requiredEnv(env, name) {
  const value = env[name];
  if (value === undefined || value === "") {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function parseConfig(env = process.env) {
  const urlValue = requiredEnv(env, "IIKONA_MCP_URL").trim();
  const user = requiredEnv(env, "IIKONA_MCP_USER");
  const pass = requiredEnv(env, "IIKONA_MCP_PASS");
  const timeoutValue = env.IIKONA_MCP_TIMEOUT_MS;

  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw new ConfigError("IIKONA_MCP_URL must be a valid absolute URL");
  }

  let timeoutMs = DEFAULT_TIMEOUT_MS;
  if (timeoutValue !== undefined && timeoutValue !== "") {
    timeoutMs = Number(timeoutValue);
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new ConfigError("IIKONA_MCP_TIMEOUT_MS must be a positive integer");
    }
  }

  return {
    url: url.toString(),
    user,
    pass,
    timeoutMs,
  };
}

