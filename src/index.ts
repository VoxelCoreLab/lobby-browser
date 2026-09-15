import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { configService } from './config';

const app = express();
app.use(express.json());
app.set('trust proxy', true);

type LobbyStatus = 'online' | 'offline';

interface Lobby {
  id: string;
  name: string;
  host: string;
  port: number;
  playerCount: number;
  maxPlayers: number;
  version: string;
  status: LobbyStatus;
  createdAt: number;
  lastSeen: number;
  ownerToken: string;
}

interface PublicLobby {
  id: string;
  name: string;
  host: string;
  port: number;
  playerCount: number;
  maxPlayers: number;
  version: string;
  status: LobbyStatus;
  createdAt: number;
  lastSeen: number;
}

let lobbies: Lobby[] = [];

const EXPIRATION_MS = 300_000;
const DEFAULT_MAX_PLAYERS = 8;

function normalizeHost(raw: string): string {
  return raw.startsWith('::ffff:') ? raw.replace('::ffff:', '') : raw;
}

function toPublic(lobby: Lobby): PublicLobby {
  const { ownerToken: _token, ...publicLobby } = lobby;
  return publicLobby;
}

function extractToken(req: Request): string | undefined {
  const auth = req.header('Authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    const bearer = auth.slice(7).trim();
    if (bearer) return bearer;
  }

  const bodyToken = req.body?.token;
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }

  return undefined;
}

function findLobby(id: string): Lobby | undefined {
  return lobbies.find((lobby) => lobby.id === id);
}

function requireOwnedLobby(req: Request, res: Response): Lobby | null {
  const lobby = findLobby(req.params.id);
  if (!lobby) {
    res.status(404).send({ success: false, error: 'Lobby not found' });
    return null;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).send({ success: false, error: 'Missing owner token' });
    return null;
  }

  if (token !== lobby.ownerToken) {
    res.status(403).send({ success: false, error: 'Invalid owner token' });
    return null;
  }

  return lobby;
}

app.get('/', (_req: Request, res: Response) => {
  res.send('Lobby Browser Server Running');
});

app.post('/lobbies', (req: Request, res: Response) => {
  const { name, port, version, maxPlayers } = req.body ?? {};
  const rawHost = req.body?.host || req.body?.ip || req.ip;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).send({ success: false, error: 'name is required' });
    return;
  }

  const parsedPort = Number(port);
  if (!Number.isFinite(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    res.status(400).send({ success: false, error: 'port must be between 1 and 65535' });
    return;
  }

  if (!version || typeof version !== 'string' || !version.trim()) {
    res.status(400).send({ success: false, error: 'version is required' });
    return;
  }

  if (!rawHost || typeof rawHost !== 'string') {
    res.status(400).send({ success: false, error: 'No IP/host provided' });
    return;
  }

  let parsedMaxPlayers = DEFAULT_MAX_PLAYERS;
  if (maxPlayers !== undefined && maxPlayers !== null && maxPlayers !== '') {
    parsedMaxPlayers = Number(maxPlayers);
    if (!Number.isFinite(parsedMaxPlayers) || parsedMaxPlayers < 1) {
      res.status(400).send({ success: false, error: 'maxPlayers must be a positive number' });
      return;
    }
  }

  const now = Date.now();
  const id = crypto.randomUUID();
  const ownerToken = crypto.randomBytes(32).toString('hex');

  const lobby: Lobby = {
    id,
    name: name.trim(),
    host: normalizeHost(rawHost.trim()),
    port: parsedPort,
    playerCount: 0,
    maxPlayers: parsedMaxPlayers,
    version: version.trim(),
    status: 'online',
    createdAt: now,
    lastSeen: now,
    ownerToken,
  };

  lobbies.push(lobby);
  res.send({ success: true, id, token: ownerToken });
});

app.get('/lobbies', (_req: Request, res: Response) => {
  res.send({ results: lobbies.map(toPublic) });
});

app.patch('/lobbies/:id', (req: Request, res: Response) => {
  const lobby = requireOwnedLobby(req, res);
  if (!lobby) return;

  const body = req.body ?? {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      res.status(400).send({ success: false, error: 'name must be a non-empty string' });
      return;
    }
    lobby.name = body.name.trim();
  }

  const nextHost = body.host ?? body.ip;
  if (nextHost !== undefined) {
    if (typeof nextHost !== 'string' || !nextHost.trim()) {
      res.status(400).send({ success: false, error: 'host must be a non-empty string' });
      return;
    }
    lobby.host = normalizeHost(nextHost.trim());
  }

  if (body.port !== undefined) {
    const parsedPort = Number(body.port);
    if (!Number.isFinite(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      res.status(400).send({ success: false, error: 'port must be between 1 and 65535' });
      return;
    }
    lobby.port = parsedPort;
  }

  if (body.playerCount !== undefined) {
    const parsedCount = Number(body.playerCount);
    if (!Number.isFinite(parsedCount) || parsedCount < 0) {
      res.status(400).send({ success: false, error: 'playerCount must be a non-negative number' });
      return;
    }
    lobby.playerCount = parsedCount;
  }

  if (body.maxPlayers !== undefined) {
    const parsedMax = Number(body.maxPlayers);
    if (!Number.isFinite(parsedMax) || parsedMax < 1) {
      res.status(400).send({ success: false, error: 'maxPlayers must be a positive number' });
      return;
    }
    lobby.maxPlayers = parsedMax;
  }

  if (body.version !== undefined) {
    if (typeof body.version !== 'string' || !body.version.trim()) {
      res.status(400).send({ success: false, error: 'version must be a non-empty string' });
      return;
    }
    lobby.version = body.version.trim();
  }

  if (body.status !== undefined) {
    if (body.status !== 'online' && body.status !== 'offline') {
      res.status(400).send({ success: false, error: "status must be 'online' or 'offline'" });
      return;
    }
    lobby.status = body.status;
  }

  lobby.lastSeen = Date.now();
  res.send({ success: true, lobby: toPublic(lobby) });
});

app.delete('/lobbies/:id', (req: Request, res: Response) => {
  const lobby = requireOwnedLobby(req, res);
  if (!lobby) return;

  lobbies = lobbies.filter((entry) => entry.id !== lobby.id);
  res.send({ success: true });
});

const port = configService.get('PORT', 3000);

app.listen(port, () => console.log(`Lobby-Server läuft auf Port ${port}`));

setInterval(() => {
  const now = Date.now();
  lobbies = lobbies.filter((lobby) => now - lobby.lastSeen < EXPIRATION_MS);
}, EXPIRATION_MS);
