import { Client, Room } from "colyseus";
import { State, Player } from "./Schema/state";


export class GameRoom extends Room<State>{
    maxClients = 2;
    
    listRecruits: Array<string> = new Array<string>();
    lastIndexRecruits: number = 0;
    listToolboard: Array<string> = new Array<string>();

    playerCount: number = 0;
    playerHand: Array<string>;

    async onInit(options: any)  {
        console.log('room created', this.roomId);
        console.log(this.roomName);
       
        this.setState(new State());
    }
    
    onJoin(client: Client) {
        console.log('player joined', client.sessionId);

        let player: Player = new Player();
        player.sessionId = client.sessionId;
        player.seat = this.playerCount + 1;

        this.state.players[client.sessionId] = player;
        this.playerCount++;
        console.log(this.playerCount);
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
                case 'initialState':
                    for(let i = 0; i<33; i++){
                        this.listRecruits[i] = "r"+(i+1);
                    }
                    this.shuffle(this.listRecruits);
                    for(let i = 0; i<9; i++){
                        this.listToolboard[i] = "T"+(i+1);
                    }
                    break;

                case 'refreshShop':
                    for(let i = 6;i<=9;i++){
                        this.state.cards[i] = this.listRecruits[this.lastIndexRecruits];
                        this.lastIndexRecruits++;
                    }
                    break;
                
                case 'destroyRecruits':
                    let idCardsDestroy: Array<Array<string>> = message['idCardsDestroy']
                    for(let i = 0;i<idCardsDestroy.length;i++){
                        if(idCardsDestroy[i][0]!=null && idCardsDestroy[i][0]!=""){
                            this.state.recruitsToDestroy[i] = idCardsDestroy[i][0];
                            let pos = idCardsDestroy[i][1];
                        }
                    }
                    console.log(this.state.cards);
                    break;

                case 'nullRecruit':
                    let idToNull: string = message['idToNull']
                    this.state.cards[idToNull] = "";
                    console.log(this.state.cards);
                    break;

                case 'skip':
                    console.log('player ' + player.seat + ' skipped');
                    this.state.playersSkipped++;
                    if(this.state.playersSkipped == 2){
                        if(this.state.phase == 'Recruit'){
                            this.state.phase = 'Learn';
                            this.state.playersSkipped = 0;
                        }
                        else {
                            this.state.firstTurn = true;
                            this.state.phase = 'Recruit';
                            this.state.playersSkipped = 0;
                        }
                    }
                    this.state.playerTurn =  this.state.playerTurn == 1 ? 2 : 1;
                    break;
                case 'recruited':
                    let cardId: string = message['cardId']
                    let oldPos: number = message['oldPos']
                    let newPos: number = message['newPos']
                    console.log('player ' + player.seat + ' recruited an entrepeneur');
                    if(this.state.playerTurn != player.seat) return;
                    this.state.cards[oldPos] = null;
                    this.state.cards[newPos] = cardId;
                    console.log(this.state.cards);

                    // if(player.seat == 1){
                    //     for(let i = 0; i<=2; i++){
                    //         if(this.state.cards[i] == null){
                    //             this.state.cards[i] = cardId;
                    //             break;
                    //         }
                    //     }
                    // }
                    // else{
                    //     for(let i = 3; i<=5; i++){
                    //         if(this.state.cards[i] == null){
                    //             this.state.cards[i] = cardId;
                    //             console.log(this.state.cards);
                    //             console.log(this.state.cards[i]);
                    //             break;
                    //         }
                    //     }
                    // }
                    this.state.playerTurn =  this.state.playerTurn == 1 ? 2 : 1;
                    break;
                case 'learn':
                    let cardLearnId: string = message['cardId'];
                    let posCard: number = message['posCard'];
                    let tools: [string] = message['tools'];
                    let indexTools: number = 0;
                    console.log('player ' + player.seat + ' has learnt from an entrepeneur');
                    if(this.state.playerTurn != player.seat) return;
                    this.state.cards[posCard] = null;
                    if(player.seat == 1){
                        for(let i = 0; i<tools.length; i++){
                            if(tools[i]!=null){
                                for(let j = 10; j<=18; j++){
                                    if(tools[i]==this.listToolboard[indexTools]){
                                        console.log(j);
                                        this.state.cards[j] = tools[i];
                                        break;
                                    }
                                    indexTools++;
                                }
                            }
                        }
                    }
                    else{
                        for(let i = 0; i<tools.length; i++){
                            for(let j = 19; j<=27; j++){
                                if(tools[i]==this.listToolboard[j]){
                                    this.state.cards[j] = tools[i];
                                    break;
                                }
                            }
                        }
                    }                    
                    this.state.playerTurn =  this.state.playerTurn == 1 ? 2 : 1;
                    break;
            }
    }

    async onLeave(client: Client) {
        console.log('player left', client.sessionId);
        delete this.state.players[client.sessionId];
        this.playerCount--;        
        this.state.phase = 'waiting';
    }

    onDispose() {
        console.log('room disposed');
    }

    //Fisher-Yates (aka Knuth) Shuffle algorithm
    shuffle(array) {
        let currentIndex = array.length,  randomIndex;
        
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