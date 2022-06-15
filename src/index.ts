import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameRoom } from './rooms/game-room';

const port = Number(process.env.PORT || 2567);
const app = express();

const server = createServer(app);
const gameServer = new Server({
  server,
});

gameServer.register('game', GameRoom);


gameServer.listen(port);

console.log(`Listening on http://localhost:${ port }`);