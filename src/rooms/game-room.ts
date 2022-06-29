import { Schema } from "@colyseus/schema";
import { Client, FossilDeltaSerializer, Room, serialize } from "colyseus";
import { RoomState, Player } from "./Schema/state";

export class GameRoom extends Room<RoomState>{
    maxClients = 2; //Máximo de jugadores por partida (propiedad de Colyseus)
    playerCount: number = 0; //Número de jugadores actuales

    listRecruits: Array<string> = this.generateListRecruits(); //Mazo de personajes
    lastIndexRecruits: number = 0; //Último índice del mazo de personajes sacado
    listToolboard: Array<string> = this.generateListToolboard(); //Lista de las 9 tools (para comparaciones)
    constructor(a: any) {
        super(a);
    }

    //Se llama al crear la sala y establece el estado de sesión inicial
    async onInit(options: any) {
        console.log('room created', this.roomId);
        this.setState(new RoomState());
    }

    //Se llama cuando un jugador entra en la sesión
    onJoin(client: Client) {
        console.log('player joined', client.sessionId);

        //Se crea y se establece la id (generada por Colyseus) y se le asigna el asiento
        let player: Player = new Player();
        player.sessionId = client.sessionId;
        player.seat = this.playerCount + 1;

        //El jugador se mete en la pool de jugadores del estado y se comprueba si hay 2 jugadores,
        //de ser así se cambia la fase a Recruit, lo que provocará que cambie a la escena de juego
        this.state.players[client.sessionId] = player;
        this.playerCount++;
        if (this.playerCount == 2) {
            this.state.phase = 'Recruit';
            this.lock(); //Lockea la sala para que otros jugadores no puedan entrar. Si alguien sale
            //de la sala ya no puede entrar nadie más, por lo que se acaba la partida.
        }
    }

    //Se llama cuando un cliente envia un mensaje al servidor
    onMessage(client: Client, message: any) {
        console.log('message', message);
        //Comprueba que el mensaje sea válido
        if (!message) return;
        let player: Player = this.state.players[client.sessionId];
        if (!player) return;

        let command: string = message['command'];

        switch (command) {
            //Coge la siguiente carta del mazo de personajes y la coloca en la tienda
            case 'refreshShop': 
                for (let i = 6; i <= 9; i++) {
                    this.state.cards[i] = this.listRecruits[this.lastIndexRecruits];
                    this.lastIndexRecruits++;
                }
                this.state.firstTurn = false;
                break;
            //El cliente envia una matriz con los personajes a destruir (ya sea de tienda que
            //no se han cogido o personajes usados para aprender). El servidor añade estos
            //personajes a una variable del estado de sesión. El cliente tiene un handler que, 
            //cuando esta variable se modifica, llama a un método para borrarlo en pantalla.
            case 'destroyRecruits':
                let idCardsDestroy: Array<Array<string>> = message['idCardsDestroy']
                for (let i = 0; i < idCardsDestroy.length; i++) {
                    if (idCardsDestroy[i][0] != null && idCardsDestroy[i][0] != "") {
                        this.state.recruitsToDestroy[i] = idCardsDestroy[i][0];
                    }
                }
                break;
            //Petición que se envía tras destruir personajes para eliminar su id del servidor.
            case 'nullRecruit':
                let idToNull: string = message['idToNull']
                this.state.cards[idToNull] = "";
                break;
            //Cuando el jugador pasa turno, se suma 1 al contador de skip. Cuando son dos,
            //se pasa de una fase a otra.
            case 'skip':
                console.log('player ' + player.seat + ' skipped');
                this.state.playersSkipped++;
                if (this.state.playersSkipped == 2) {
                    if (this.state.phase == 'Recruit') {
                        this.state.phase = 'Learn';
                        this.state.playersSkipped = 0;
                    }
                    else {
                        this.state.firstTurn = true;
                        this.state.phase = 'Recruit';
                        this.state.playersSkipped = 0;
                    }
                }
                this.state.playerTurn = this.state.playerTurn == 1 ? 2 : 1;
                break;
            //Cuando un jugador recluta un personaje, en la tabla de posiciones se borra su
            //posición antigua (la de la tienda) y se añade en la nueva (en zona de reclutas)
            case 'recruited':
                let cardId: string = message['cardId']
                let oldPos: number = message['oldPos']
                let newPos: number = message['newPos']
                if (this.state.playerTurn != player.seat) return;
                this.state.cards[oldPos] = null;
                this.state.cards[newPos] = cardId;
                this.state.playerTurn = this.state.playerTurn == 1 ? 2 : 1;
                break;
            //Cuando un jugador aprende, se mira qué jugador es para colocar las tools usadas
            //en la posición correcta de la tabla de posiciones (zona de toolboard 1 o 2)
            case 'learn':
                let cardLearnId: string = message['cardId'];
                let posCard: number = message['posCard'];
                let tools: [string] = message['tools'];
                let indexTools: number = 0;
                if (this.state.playerTurn != player.seat) return;
                this.state.cards[posCard] = null;
                if (player.seat == 1) {
                    for (let i = 0; i < tools.length; i++) {
                        if (tools[i] != null) {
                            for (let j = 10; j <= 18; j++) {
                                if (tools[i] == this.listToolboard[indexTools]) {
                                    this.state.cards[j] = tools[i];
                                    break;
                                }
                                indexTools++;
                            }
                        }
                    }
                }
                else {
                    for (let i = 0; i < tools.length; i++) {
                        for (let j = 19; j <= 27; j++) {
                            if (tools[i] == this.listToolboard[j]) {
                                this.state.cards[j] = tools[i];
                                break;
                            }
                        }
                    }
                }
                //Después de aprender, se mira si tiene 9 tools distintas
                this.checkWinner();
                this.state.playerTurn = this.state.playerTurn == 1 ? 2 : 1;
                break;
        }
    }
    //Se llama cuando un jugador sale de la sesión
    async onLeave(client: Client) {
        console.log('player left', client.sessionId);
        delete this.state.players[client.sessionId];
        this.playerCount--;
        this.state.phase = 'waiting';
    }

    //Se llama cuando la sesión de juego se elimina
    onDispose() {
        console.log('room disposed');
    }

    //Generadores de Mazos
    private generateListRecruits() {
        const rec = []
        for (let i = 0; i < 33; i++) {
            rec.push("r" + (i + 1));
        }
        return this.shuffle(rec);
    }
    private generateListToolboard() {
        const rec = []

        for (let i = 0; i < 9; i++) {
            rec[i] = "T" + (i + 1);
        }
        return rec;
    }

    //Comprovación de victoria
    checkWinner() {
        let count: number = 0;
        if (this.state.playerTurn == 1) {
            for (let i = 10; i <= 18; i++) {
                if (this.state.cards[i] != null && this.state.cards[i] != "") {
                    count++;
                }
            }
        }
        else {
            for (let i = 19; i <= 27; i++) {
                if (this.state.cards[i] != null && this.state.cards[i] != "") {
                    count++;
                }
            }
        }
        if (count == 9){
            this.state.winningPlayer = this.state.playerTurn;
            this.state.phase = "Result";
        } 
    }

    //Fisher-Yates (aka Knuth) Shuffle algorithm
    shuffle(array) {
        let currentIndex = array.length, randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }

        return array;
    }
}