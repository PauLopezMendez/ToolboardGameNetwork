import { Client, Room } from "colyseus";
import { State, Player } from "./state";

export class GameRoom extends Room<State>{
    maxClients = 2;
    
    playerCount: number = 0
    playerHand: Array<string>;

    onInit(option) {
        console.log('room created', this.roomId);
        console.log(this.roomName);
        this.reset();
    }

    onJoin(client: Client) {
        console.log('player joined', client.sessionId);

        let player: Player = new Player();
        player.sessionId = client.sessionId;
        player.seat = this.playerCount + 1;

        this.state.players[client.sessionId] = player;
        this.playerCount++;

        if (this.playerCount == 2){
            this.state.phase = 'Recruit';
            this.lock();
        }
    }

    onMessage(client: Client, message: any) {
        console.log('message', message);
            if (!message) return;
            
            let player: Player = this.state.players[client.sessionId];
            if(!player) return;
            
            let command: string = message ['command'];
            
            switch(command){
                case 'skip':
                    console.log('player ' + player.seat + ' skipped');
                    this.state.playersSkipped++;
                    if(this.state.playersSkipped == 2){
                        if(this.state.phase == 'Recruit'){
                            this.state.phase = 'Learn';
                        }
                    }
                    break;
                case 'recruited':
                    console.log('player ' + player.seat + ' recruited an entrepeneur');
                    if(this.state.playerTurn != player.seat) return;
                    let shopIndex: number = message['recruitsLeftShop'];
                    this.state.shop[shopIndex] = false;
                    break;
            }
    }

    onLeave(client: Client) {
        console.log('player left', client.sessionId);

        delete this.state.players[client.sessionId];
        this.playerCount--;
        this.state.phase = 'waiting';
    }

    onDispose() {
        console.log('room disposed');
    }

    reset(){
        this.playerHand = new Array<string>();
        
        let state = new State();

        state.phase = 'waiting';
        state.playerTurn = 1;
        state.winningPlayer = -1;
        state.playersSkipped = 0;

        this.setState(state);
    }
    
}