import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { FossilDeltaSerializer, serialize } from "colyseus";

export class Player extends Schema {
    @type('int16')
    seat: number; //Asiento asignado al entrar (1 o 2)

    @type('string')
    sessionId: string; //Id de sesión del jugador
}
export class RoomState extends Schema {
    @type({map: Player})
    players: MapSchema<Player> = new MapSchema<Player>(); //Lista de jugadores (la clase de arriba)
    
    @type('string')
    phase: string = 'waiting'; //Fase de la partida
    
    @type('int16')
    playerTurn: number = 1; //A que jugador le toca el turno (1 o 2)

    @type('int16')
    winningPlayer: number = -1; //Qué jugador gana la partida (1 o 2)

    @type(['string'])
    cards: ArraySchema<string> = new ArraySchema<string>(); //Qué carta hay en cada posición de la UI
    // 0-2 recruits player 1
    // 3-5 recruits player 2
    // 6-9 shop recruits
    // 10-18 toolboard player 1
    // 19-27 toolboard player 2

    @type('int16')
    playersSkipped: number = 0; //Cuántos jugadores han pasado turno

    @type(['string'])
    recruitsToDestroy: ArraySchema<string> = new ArraySchema<string>(); //Lista de personajes que hay que borrar
                                                                        //(cuando se aprende o se reinicia la tienda)

    @type('boolean')
    firstTurn: boolean = true; //Saber si es el primer turno de la fase de reclutar (para reiniciar la tienda)
}
