var Player = require("./Player.js");

class Room{
    constructor(){
        this.InviteCode = Room.CreateInviteCode();
        this.LastID = 1;
        this.Founder = this.LastID;
        this.Players = {};
        this.Started = false;
        this.Chat = "[GAME] Start of the Room chat\n";
    }

    StartRound(){
        this.Map = new GridMap(Room.Maps[this.MapID].data)
        this.Bombs = {};
        if(Object.keys(this.Players).length > this.Map.Spawnpoints.length){
            this.Players[this.Founder].User.client.Send("NOTIFY", {ntype: 'error', message: 'There are not enough spawnpoints, this map has '+this.Map.Spawnpoints.length, hideLoader: true});
        }else{
            for(let player of Object.values(this.Players)){
                let id = Math.floor(Math.random()*this.Map.Spawnpoints.length);
                let sp = this.Map.Spawnpoints[id];
                let spc = Room.GetGridCoords(sp.row, sp.col);
                player.x = spc.x;
                player.y = spc.y;
                player.IsAlive = true;
                this.Map.Spawnpoints.splice(id, 1);
            }
            this.Started = true;
            this.Broadcast("START_GAME", this.NetworkData);
        }
    }

    Broadcast(action, data){
        let jsondata = JSON.stringify({action: action, data: data});
        for(let player of Object.values(this.Players)){
            player.User.client.send(jsondata);
        }
    }

    AddPlayer(user){
        let player = new Player(this.LastID, user.nickname, user, this);
        this.Broadcast("PLAYER_JOINED", {player: player.NetworkData});
        this.Players[player.ID] = player;
        user.client.Send("JOIN_ROOM", {selfid: player.ID, roomdata: this.RoomData});
        this.AddChatMessage(`${player.Nickname} has joined!`);
        user.player = this.Players[player.ID];
    }

    RemovePlayer(user){
        let id = user.player.ID;
        this.AddChatMessage(`${user.player.Nickname} has left!`);
        delete this.Players[id];
        delete user.player;
        user.client.Send("LEAVE_ROOM");
        if(Object.keys(this.Players).length == 0) delete Room.Rooms[this.InviteCode];
        else if(id == this.Founder){
            var keys = Object.keys(this.Players);
            this.Founder = keys[keys.length * Math.random() << 0];
            this.Broadcast("PLAYER_LEFT", {id: id, founder: this.Founder});
        }else{
            this.Broadcast("PLAYER_LEFT", {id: id});
        }
    }

    AddChatMessage(message, sender){
        let msg = '';
        if(typeof sender != 'undefined'){
            msg = `${sender}: ${message}`;
        }else{
            msg = `[GAME] ${message}`;
        }
        this.Chat += msg+"\n";
        this.Broadcast("CHAT_PRINT", {message: msg});
    }

    BroadcastGameState(){
        this.Broadcast("GAME_STATE", this.GameState);
    }

    get PlayersGameState(){
        let players = {};
        for(let player of Object.values(this.Players))
        {
            if(player.IsAlive) players[player.ID] = player.GameState;
        }
        return players;
    }

    get PlayersNetworkData(){
        let players = {};
        for(let player of Object.values(this.Players)){
            players[player.ID] = player.NetworkData;
        };
        return players;
    }

    get GameState(){
        let data = {
            players: this.PlayersGameState,
            tick: Date.now()
        };
        if(JSON.stringify(this.Map.Map) != JSON.stringify(this.LastMapState)){
            this.LastMapState = JSON.parse(JSON.stringify(this.Map.Map));
            data.map = this.Map.Map;
        }
        return data;
    }

    get NetworkData(){
        return {
            players: this.PlayersNetworkData,
            map: this.Map.Map
        };
    }

    get RoomData(){
        return{
            invitecode: this.InviteCode,
            founder: this.Founder,
            players: this.PlayersNetworkData,
            map: this.RawMap,
            chat: this.Chat
        }
    }

    static FindGrid(x, y) {
        return { row: (y/gridWidth) >> 0, col: (x/gridWidth)>>0}
    }

    static GetGridCoords(row, col){
        return {x: col*gridWidth, y:row*gridWidth};
    }

    static Maps = [
        {id:0, name:"Basic", data: [[2,2,2,2,2,2,2,2,2,2,2],[2,3,1,4,4,4,4,4,1,3,2],[2,1,1,4,4,2,4,4,1,1,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,2,2,2,2,2,2,2,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,1,1,4,4,2,4,4,1,1,2],[2,3,1,4,4,4,4,4,1,3,2],[2,2,2,2,2,2,2,2,2,2,2]]},
        {id:1, name:"Nazi", data: [[2,2,2,2,2,2,2,2,2,2,2,2,2],[2,1,1,1,3,1,1,1,1,1,1,1,2],[2,1,2,4,4,4,2,2,2,2,2,1,2],[2,1,2,4,4,4,2,4,4,4,4,1,2],[2,1,2,4,4,4,2,4,4,4,4,3,2],[2,1,2,4,4,4,2,4,4,4,4,1,2],[2,1,2,2,2,2,2,2,2,2,2,1,2],[2,1,4,4,4,4,2,4,4,4,2,1,2],[2,3,4,4,4,4,2,4,4,4,2,1,2],[2,1,4,4,4,4,2,4,4,4,2,1,2],[2,1,2,2,2,2,2,4,4,4,2,1,2],[2,1,1,1,1,1,1,1,3,1,1,1,2],[2,2,2,2,2,2,2,2,2,2,2,2,2]]},
        {id:2, name:"seindleR ÖZEL", data: [[2,2,2,2,2,2,2,2,2,2,2],[2,3,1,4,2,4,2,4,1,3,2],[2,1,4,4,4,4,4,4,4,1,2],[2,4,4,4,2,4,2,4,4,4,2],[2,2,4,2,2,4,2,2,4,2,2],[2,4,4,4,4,4,4,4,4,4,2],[2,2,4,2,2,4,2,2,4,2,2],[2,4,4,4,2,4,2,4,4,4,2],[2,1,4,4,4,4,4,4,4,1,2],[2,3,1,4,2,4,2,4,1,3,2],[2,2,2,2,2,2,2,2,2,2,2]]},
        {id:3, name:"PABÇİ", data: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],[2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,2],[2,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,2,4,4,2,1,1,4,1,1,1,1,1,4,1,1,1,1,1,1,4,1,1,1,1,1,2],[2,1,1,2,4,4,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,2,4,1,2,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,2],[2,1,1,2,2,1,2,1,1,1,1,1,1,4,1,1,1,1,1,4,4,4,2,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,4,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,4,2,2,1,2,2,1,1,2,2,2,1,2,2,2,1,1,4,1,1,4,1,1,1,1,2],[2,1,1,1,2,4,1,4,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,1,4,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,2,2,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,2,4,4,1,4,4,2,1,2,2,2,2,2,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,2,2,2,1,2,2,2,1,2,4,4,1,2,4,1,1,1,2],[2,1,1,1,1,4,1,2,4,2,1,1,1,1,1,1,1,1,1,2,2,2,1,2,1,1,1,1,2],[2,1,1,2,1,2,1,2,4,4,2,1,1,1,2,1,1,1,1,2,4,4,1,2,1,1,1,1,2],[2,1,2,4,2,4,2,2,1,2,1,1,1,2,4,2,1,1,1,2,2,2,1,2,1,1,1,1,2],[2,1,2,1,1,1,1,1,1,4,2,1,1,2,1,2,1,1,1,2,4,4,1,2,1,1,1,1,2],[2,1,2,1,2,2,4,2,4,2,1,1,1,2,1,1,1,1,4,2,2,2,1,2,1,1,1,1,2],[2,1,2,4,2,1,2,1,2,1,4,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,2,4,2,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,2,4,2,1,1,1,1,1,1,4,1,1,1,1,1,2],[2,1,1,1,1,1,1,4,1,1,1,1,2,4,4,4,2,1,1,1,1,1,1,1,1,1,1,1,2],[2,3,1,1,1,1,1,1,1,1,1,2,4,4,2,4,4,2,1,1,1,1,1,1,1,1,1,3,2],[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]]},
    ]

    static Rooms = {}

    static CreateInviteCode(){
        let invitecode = "";
        let letterList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(let i=0; i<6; i++){
            invitecode+=letterList.charAt(Math.floor(Math.random() * letterList.length));
            if(invitecode.length == 6 && Room.Rooms[invitecode]){
                i=0;
                invitecode = "";
            }
        }
        return invitecode;
    }
}

class GridMap{
    constructor(map){
        this.Map = JSON.parse(JSON.stringify(map));;
        this.rows = map.length;
        this.cols = map[0].length;
        this.Spawnpoints = [];
        for(let i=0; i<this.rows; i++){
            for(let j=0; j<this.cols; j++){
                let grid = this.Map[i][j];
                if(grid == 3) this.Spawnpoints.push({row: i, col: j});
            }
        }
    }
}

let gridWidth = 75;
let bombTimer = 3000;
let playerWidth = gridWidth;
let playerHeight = gridWidth*1.5;
let collisionSize = gridWidth*0.4;
let collisionOffsetBottom = gridWidth/16;
let collisionOffsetX = (gridWidth-collisionSize)/2;
let collisionOffsetY = playerHeight+collisionOffsetBottom-collisionSize;


module.exports = Room;