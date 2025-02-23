import express, { Request, Response } from 'express';

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

app.post("/createLobby", (req: Request, res: Response) => {
    const { ip, port, name } = req.body;
    lobbies.push({ ip, port, name });
    res.send({ success: true });
});

app.get("/getLobbies", (req: Request, res: Response) => {
    res.send(lobbies);
});

app.listen(3000, () => console.log("Lobby-Server läuft auf Port 3000"));