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
| `ttlSeconds` | no | Seconds without heartbeat before expiry; clamped to 60–1800. Default from `LOBBY_TTL_MS` (600s) |

**Response:** `{ success, id, token }`

### `GET /lobbies`

List fresh lobbies (no tokens). Stale entries (`now - lastSeen >= lobby ttl`) are omitted.

**Response:** `{ results: PublicLobby[] }`

Public fields: `id`, `name`, `host`, `port`, `playerCount`, `maxPlayers`, `version`, `status`, `createdAt`, `lastSeen`.

### `PATCH /lobbies/:id`

Update an owned lobby. Auth: `Authorization: Bearer <token>` or body `token`.

Updatable: `name`, `host`/`ip`, `port`, `playerCount`, `maxPlayers`, `status` (`online`\|`offline`), `version`, `ttlSeconds`.

Refreshes `lastSeen` (acts as heartbeat).

### `DELETE /lobbies/:id`

Remove an owned lobby (same token auth).

## TTL

Each lobby has its own TTL (`ttlMs`), set at create (or updated via PATCH `ttlSeconds`).

- Default: **10 minutes** (`LOBBY_TTL_MS=600000` on the API, overridable).
- Clamp: **60s–30min**.
- A lobby stays listed while heartbeats (any successful PATCH) keep `lastSeen` fresh.
- Sweep runs every **30 seconds**; `GET /lobbies` also filters stale rows.

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP listen port |
| `LOBBY_TTL_MS` | `600000` | Default TTL when create omits `ttlSeconds` |

## Scripts

```bash
npm run dev
npm run build && npm start
npm run test:api
```
