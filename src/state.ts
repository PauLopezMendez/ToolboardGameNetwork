import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
    @type('int16')
    seat: number;

    @type('string')
    sessionId: string;
}

export class State extends Schema {
    @type({map: Player})
    players: MapSchema<Player> = new MapSchema<Player>();
    
    @type('string')
    phase: string = 'waiting';
    
    @type('int16')
    playerTurn: number = 1;

    @type('int16')
    winningPlayer: number = -1;

    @type(['boolean'])
    shop: ArraySchema<boolean> = new ArraySchema<boolean>();

    @type('int16')
    playersSkipped: number = 0;

}