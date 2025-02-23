import express, { Request, Response } from 'express';
import { configService } from './config';

const app = express();
app.use(express.json());

// Define an interface for a lobby
interface Lobby {
  ip: string;
  port: number;
  name: string;
}

// Store active lobbies
let lobbies: Lobby[] = [];

app.get('/', (req: Request, res: Response) => {
  res.send('Lobby Browser Server Running');
});

app.post("/createLobby", (req: Request, res: Response) => {
    const { ip, port, name } = req.body;
    lobbies.push({ ip, port, name });
    res.send({ success: true });
});

app.get("/getLobbies", (req: Request, res: Response) => {
    res.send({ results: lobbies});
});

const port = configService.get('PORT', 3000)

app.listen(port, () => console.log(`Lobby-Server läuft auf Port ${port}`));