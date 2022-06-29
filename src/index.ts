import express from 'express';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { GameRoom } from './rooms/game-room';

const port = Number(process.env.PORT || 2567); //Asignamos un puerto
const app = express(); //Configuramos un "servidor express" 
                       //(back end web application framework for Node.js)

//Creamos el servidor (Attach WebSocket Server on HTTP Server)
const server = createServer(app);
const gameServer = new Server({
  server,
});

//Registrar el tipo de sesión GameRoom con el nombre 'game' que enviará el cliente
gameServer.register('game', GameRoom);

//Establecer el puerto al servidor
gameServer.listen(port);

console.log(`Listening on http://localhost:${ port }`);