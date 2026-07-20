# iikona-mcp-proxy

stdio MCP-посредник для runtime-MCP сервиса в ядре ИИконы.

Переводит MCP-протокол через stdio (как ожидают Claude Desktop, Cursor и другие MCP-клиенты) в HTTP-вызовы к `/iikona-mcp/rpc` опубликованного в 1С HTTPService.

## Установка

Требуется Node.js 18+.

```bash
git clone https://github.com/andromanpro/1c-ai-connector-mcp-proxy.git
cd 1c-ai-connector-mcp-proxy
npm install
npm test
```

Или через `npx` без установки (после публикации в npm):

```bash
npx iikona-mcp-proxy
```

## Конфигурация

Через переменные окружения:

| Переменная | Назначение | Пример |
|---|---|---|
| `IIKONA_MCP_URL` | URL JSON-RPC endpoint в 1С | `http://localhost/iikona-dev/hs/iikona-mcp/rpc` |
| `IIKONA_MCP_USER` | имя пользователя HTTP Basic | `mcp-client` |
| `IIKONA_MCP_PASS` | пароль HTTP Basic | `<...>` |
| `IIKONA_MCP_TIMEOUT_MS` | таймаут HTTP-запроса, мс (опционально) | `30000` |

## Использование с Claude Desktop

В `claude_desktop_config.json` добавить:

```json
{
  "mcpServers": {
    "iikona": {
      "command": "node",
      "args": ["<путь-к-клону>/src/index.js"],
      "env": {
        "IIKONA_MCP_URL": "http://localhost/iikona-dev/hs/iikona-mcp/rpc",
        "IIKONA_MCP_USER": "mcp-client",
        "IIKONA_MCP_PASS": "...",
        "IIKONA_MCP_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

После рестарта Claude Desktop в чате будут доступны 5 tools: `ping`, `get_configuration_info`, `get_metadata_tree`, `get_object_structure`, `execute_query`.

## Отладка

stdio MCP transport ожидает полноценный MCP handshake от клиента, поэтому простой `echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node src/index.js` не является надежной ручной проверкой.

Для прямого smoke-теста HTTPService без Claude Desktop/Cursor используйте внутренний CLI:

```bash
node tools/test-call.js tools/list
node tools/test-call.js ping
node tools/test-call.js tools/call get_configuration_info
```

CLI использует те же переменные окружения `IIKONA_MCP_URL`, `IIKONA_MCP_USER`, `IIKONA_MCP_PASS` и `IIKONA_MCP_TIMEOUT_MS`.

## Архитектура

```
Claude Desktop / Cursor / другие MCP-клиенты
    ↕ stdio (MCP standard)
[iikona-mcp-proxy] ← тонкий stdio↔HTTP proxy
    ↕ HTTP + Basic auth
1С HTTPService /iikona-mcp/rpc (КИИ_СерверMCP)
    ↕ in-process
container-pattern dispatcher → 5 MCP-tools
```

## Лицензия

MIT — см. [LICENSE](./LICENSE).

## Связанные проекты

- [`1c-ai-connector`](https://github.com/andromanpro/1c-ai-connector) — ИИкона: расширение 1С с runtime-MCP сервисом
- [`1c-ai-connector-tests`](https://github.com/andromanpro/1c-ai-connector-tests) — YAxUnit-тесты
- [`1c-ai-connector-guide`](https://github.com/andromanpro/1c-ai-connector-guide) — руководство пользователя (раздел про MCP-сервер)

---

🌐 [androman.pro](https://androman.pro) · ✈ [Telegram](https://t.me/andromanpro1c)
