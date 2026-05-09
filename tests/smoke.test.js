import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { ConfigError, parseConfig } from "../src/config.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function runIndexWithoutEnv() {
  return new Promise((resolvePromise, rejectPromise) => {
    let child;
    try {
      child = spawn(process.execPath, ["src/index.js"], {
        cwd: repoRoot,
        env: {
          PATH: process.env.PATH,
          SystemRoot: process.env.SystemRoot,
          ComSpec: process.env.ComSpec,
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      if (error?.code === "EPERM") {
        resolvePromise({ spawnError: error, stdout: "", stderr: "" });
        return;
      }
      rejectPromise(error);
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      if (error?.code === "EPERM") {
        resolvePromise({ spawnError: error, stdout, stderr });
        return;
      }
      rejectPromise(error);
    });
    child.on("close", (code) => {
      resolvePromise({ code, stdout, stderr });
    });
  });
}

test("exits with code 1 when required env is missing", async (t) => {
  const result = await runIndexWithoutEnv();

  if (result.spawnError) {
    t.skip("child_process.spawn is blocked by this environment with EPERM");
    return;
  }

  assert.equal(result.code, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Missing required environment variable: IIKONA_MCP_URL/);
});

test("parseConfig reads required env and default timeout", () => {
  const config = parseConfig({
    IIKONA_MCP_URL: "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
    IIKONA_MCP_USER: "mcp-client",
    IIKONA_MCP_PASS: "secret",
  });

  assert.deepEqual(config, {
    url: "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
    user: "mcp-client",
    pass: "secret",
    timeoutMs: 30000,
  });
});

test("parseConfig rejects missing required env", () => {
  assert.throws(
    () =>
      parseConfig({
        IIKONA_MCP_URL: "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
        IIKONA_MCP_USER: "mcp-client",
      }),
    (error) =>
      error instanceof ConfigError &&
      error.message === "Missing required environment variable: IIKONA_MCP_PASS",
  );
});

test("parseConfig validates timeout", () => {
  assert.throws(
    () =>
      parseConfig({
        IIKONA_MCP_URL: "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
        IIKONA_MCP_USER: "mcp-client",
        IIKONA_MCP_PASS: "secret",
        IIKONA_MCP_TIMEOUT_MS: "0",
      }),
    /IIKONA_MCP_TIMEOUT_MS must be a positive integer/,
  );

  assert.equal(
    parseConfig({
      IIKONA_MCP_URL: "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
      IIKONA_MCP_USER: "mcp-client",
      IIKONA_MCP_PASS: "secret",
      IIKONA_MCP_TIMEOUT_MS: "5000",
    }).timeoutMs,
    5000,
  );
});
