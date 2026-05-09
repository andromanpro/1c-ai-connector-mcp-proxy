#!/usr/bin/env node
import { ConfigError, parseConfig } from "../src/config.js";
import { postJsonRpc, RpcHttpError } from "../src/httpRpcClient.js";

function usage() {
  return [
    "Usage:",
    "  node tools/test-call.js tools/list",
    "  node tools/test-call.js ping",
    "  node tools/test-call.js tools/call get_configuration_info",
    "  node tools/test-call.js tools/call execute_query '{\"query\":\"select 1\"}'",
  ].join("\n");
}

function parseJsonArguments(raw) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Tool arguments must be valid JSON: ${message}`);
  }
}

function parseCommand(argv) {
  const [first, second, third] = argv;

  if (!first) {
    throw new Error(usage());
  }

  if (first === "tools/list") {
    return {
      method: "tools/list",
      params: {},
    };
  }

  if (first === "tools/call") {
    if (!second) {
      throw new Error(usage());
    }
    return {
      method: "tools/call",
      params: {
        name: second,
        arguments: parseJsonArguments(third),
      },
    };
  }

  return {
    method: "tools/call",
    params: {
      name: first,
      arguments: parseJsonArguments(second),
    },
  };
}

async function main() {
  const config = parseConfig();
  const { method, params } = parseCommand(process.argv.slice(2));
  const result = await postJsonRpc(config, method, params);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  if (error instanceof ConfigError) {
    console.error(`[iikona-mcp-proxy:test-call] ${error.message}`);
  } else if (error instanceof RpcHttpError) {
    console.error(`[iikona-mcp-proxy:test-call] ${error.message}`);
    if (error.retryAfter) {
      console.error(`[iikona-mcp-proxy:test-call] retry-after: ${error.retryAfter}`);
    }
  } else {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[iikona-mcp-proxy:test-call] ${message}`);
  }
  process.exit(1);
});

