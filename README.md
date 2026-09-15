# lobby-browser

In-memory lobby list API for Shadow Infection.

Default deploy: `https://lobby-browser.pibern.ch`

## API

### `POST /lobbies`

Create a lobby. Returns an ownership `token` required for later updates/deletes.

**Body**

| Field | Required | Notes |
|-------|----------|--------|
| `name` | yes | Display name |
| `port` | yes | 1–65535 |
| `version` | yes | Game version string |
| `host` or `ip` | no | Connect address; falls back to request IP |
| `maxPlayers` | no | Defaults to 8 |

**Response:** `{ success, id, token }`

### `GET /lobbies`

List lobbies (no tokens).

**Response:** `{ results: PublicLobby[] }`

Public fields: `id`, `name`, `host`, `port`, `playerCount`, `maxPlayers`, `version`, `status`, `createdAt`, `lastSeen`.

### `PATCH /lobbies/:id`

Update an owned lobby. Auth: `Authorization: Bearer <token>` or body `token`.

Updatable: `name`, `host`/`ip`, `port`, `playerCount`, `maxPlayers`, `status` (`online`\|`offline`), `version`.

Refreshes `lastSeen`.

### `DELETE /lobbies/:id`

Remove an owned lobby (same token auth).

## TTL

Lobbies expire 5 minutes after their last `lastSeen` update (create or PATCH).

## Scripts

```bash
npm run dev
npm run build && npm start
npm run test:api
```
