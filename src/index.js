#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { ConfigError, parseConfig } from "./config.js";

async function readPackageVersion() {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packagePath = resolve(currentDir, "..", "package.json");
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  return packageJson.version ?? "0.0.0";
}

export { parseConfig } from "./config.js";

export async function main() {
  let config;
  try {
    config = parseConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`[iikona-mcp-proxy] ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  const [{ createServer, connectStdio }, version] = await Promise.all([
    import("./server.js"),
    readPackageVersion(),
  ]);

  const server = createServer(config, version);
  await connectStdio(server);
  console.error(`[iikona-mcp-proxy] connected to ${config.url}`);
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  main().catch((error) => {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[iikona-mcp-proxy] fatal: ${message}`);
    process.exit(1);
  });
}

