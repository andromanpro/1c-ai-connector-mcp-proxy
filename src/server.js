import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { postJsonRpc, RpcHttpError } from "./httpRpcClient.js";

function toMcpError(error) {
  if (error instanceof RpcHttpError) {
    if (error.kind === "rpc") {
      const rpcError = error.rpcError ?? {};
      return new McpError(
        Number.isInteger(rpcError.code) ? rpcError.code : ErrorCode.InternalError,
        rpcError.message ?? error.message,
        rpcError.data,
      );
    }

    if (error.status === 401) {
      return new McpError(
        ErrorCode.InternalError,
        "Unauthorized: проверь IIKONA_MCP_USER/PASS",
      );
    }

    if (error.status === 429) {
      return new McpError(ErrorCode.InternalError, "Rate limit exceeded", {
        retryAfter: error.retryAfter ?? null,
      });
    }

    return new McpError(ErrorCode.InternalError, `Server error: ${error.message}`);
  }

  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, `Server error: ${message}`);
}

export function createServer(config, version) {
  const server = new Server(
    {
      name: "iikona-mcp-proxy",
      version,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.onerror = (error) => {
    console.error("[iikona-mcp-proxy] MCP transport error:", error);
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      return await postJsonRpc(config, "tools/list");
    } catch (error) {
      throw toMcpError(error);
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await postJsonRpc(config, "tools/call", request.params);
    } catch (error) {
      throw toMcpError(error);
    }
  });

  return server;
}

export async function connectStdio(server) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

