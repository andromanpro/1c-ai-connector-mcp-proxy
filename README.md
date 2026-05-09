# iikona-mcp-proxy

stdio MCP-посредник для runtime-MCP сервиса в ядре ИИконы.

Переводит MCP-протокол через stdio (как ожидают Claude Desktop, Cursor и `1c-refgen` extractor) в HTTP-вызовы к `/iikona-mcp/rpc` опубликованного в 1С HTTPService.

## Установка

Требуется Node.js 18+.

```bash
git clone http://nas.local:3000/androman/iikona-mcp-proxy
cd iikona-mcp-proxy
npm install
```

Или через `npx` без установки (после публикации в npm):

```bash
npx iikona-mcp-proxy
```

## Конфигурация

Через переменные окружения:

| Переменная | Назначение | Пример |
|---|---|---|
| `IIKONA_MCP_URL` | базовый URL HTTPService в 1С | `http://localhost/iikona-dev/hs/iikona-mcp` |
| `IIKONA_MCP_USER` | имя пользователя HTTP Basic | `mcp-client` |
| `IIKONA_MCP_PASS` | пароль HTTP Basic | `<...>` |

## Использование с Claude Desktop

В `claude_desktop_config.json` добавить:

```json
{
  "mcpServers": {
    "iikona": {
      "command": "node",
      "args": ["F:/WorkAI/iikona-mcp-proxy/src/index.js"],
      "env": {
        "IIKONA_MCP_URL": "http://localhost/iikona-dev/hs/iikona-mcp",
        "IIKONA_MCP_USER": "mcp-client",
        "IIKONA_MCP_PASS": "..."
      }
    }
  }
}
```

После рестарта Claude Desktop в чате будут доступны 5 tools: `ping`, `get_configuration_info`, `get_metadata_tree`, `get_object_structure`, `execute_query`.

## Архитектура

```
Claude Desktop / Cursor / 1c-refgen
    ↕ stdio (MCP standard)
[iikona-mcp-proxy] ← этот пакет, ~50 LOC
    ↕ HTTP + Basic auth
1С HTTPService /iikona-mcp/rpc (КИИ_СерверMCP)
    ↕ in-process
container-pattern dispatcher → 5 MCP-tools
```

## Лицензия

MIT — см. [LICENSE](./LICENSE).

## Связанные проекты

- [`androman/.iikona`](http://nas.local:3000/androman/.iikona) — расширение 1С с runtime-MCP сервисом
- [`androman/iikona-tests`](http://nas.local:3000/androman/iikona-tests) — YAxUnit-тесты
- [`1c-technical-reference-generator`](https://github.com/1c-technical-reference-generator) — основной потребитель runtime-evidence
