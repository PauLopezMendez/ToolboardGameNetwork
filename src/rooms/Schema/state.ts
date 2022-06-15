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

    @type(['string'])
    cards: ArraySchema<string> = new ArraySchema<string>();
    // 0-2 recruits1
    // 3-5 recruits2
    // 6-9 shop
    // 10-18 toolboard 1
    // 19-27 toolboard 2

    @type('int16')
    playersSkipped: number = 0;

    @type(['string'])
    recruitsToDestroy: ArraySchema<string> = new ArraySchema<string>();

    @type('boolean')
    firstTurn: boolean = true;
}
