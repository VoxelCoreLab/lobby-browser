import express, { Request, Response } from 'express';
import { configService } from './config';

const app = express();
app.use(express.json());
app.set('trust proxy', true);

// Define an interface for a lobby
interface Lobby {
  ip: string;
  port: number;
  name: string;
  createdAt: number;
}

// Store active lobbies
let lobbies: Lobby[] = [];

app.get('/', (req: Request, res: Response) => {
  res.send('Lobby Browser Server Running');
});

app.post("/lobbies", (req: Request, res: Response) => {
    let ip = req.body.ip || req.ip;

    if (!ip) {
      res.status(400).send({ success: false, error: "No IP provided" });
      return;
    }

    if (ip.startsWith("::ffff:")) {
        ip = ip.replace("::ffff:", "");
    }
    const { port, name } = req.body;
    lobbies.push({ ip, port, name, createdAt: Date.now() });
    res.send({ success: true });
});

app.get("/lobbies", (req: Request, res: Response) => {
    res.send({ results: lobbies});
});

const port = configService.get('PORT', 3000)

app.listen(port, () => console.log(`Lobby-Server läuft auf Port ${port}`));

// Alle 5 Minuten ablaufende Lobbies entfernen
setInterval(() => {
  const expirationTime = 300000; // 5 Minuten in Millisekunden
  const now = Date.now();
  lobbies = lobbies.filter(lobby => (now - lobby.createdAt) < expirationTime);
}, 300000);