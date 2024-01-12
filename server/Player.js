const Config = require("./Config.js");
let gridWidth = Config.gridWidth;
let collisionSize = Config.collisionSize;
var func = require("./Functions.js");
class Player{
    constructor(id, nickname, user, room){
        this.ID = id;
        this.Nickname = nickname;
        this.User = user;
        this.Room = room;
        this.Founder = false;
        this.Room.LastID++;
        this.IsAlive = false;
        this.InGame = false;

        //GAME DATA
        this.x = 0;
        this.y = 0;
        this.Speed = 0.1;
        this.BombSize = 1;
        this.MaxBombCount = 1;
        this.BombCount = this.MaxBombCount;
        this.Direction = {
            x: 0,
            y: 0
        };  
    }

    get GameState(){
        return {
            id: this.ID,
            x: this.x,
            y: this.y,
            direction: this.Direction
        }
    }

    get NetworkData(){
        return {
            ID: this.ID,
            x: this.x,
            y: this.y,
            Direction: this.Direction,
            IsAlive: this.IsAlive,
            InGame: this.InGame,
            Nickname: this.Nickname
        }
    }

    Kill(){
        this.IsAlive = false;
        this.Room.Broadcast("PLAYER_DIED", this.GameState);
    }

    PlantBomb(){
        let c = func.FindGrid(this.x+collisionSize/2, this.y+collisionSize/2);
        if(!this.Room.Bombs[c.row+"-"+c.col]){
            this.BombCount--;
            let bomb = {
                id: c.row+"-"+c.col,
                row: c.row,
                col: c.col,
                size: this.BombSize,
                player: this,
                room: this.Room
            }
            this.Room.Bombs[bomb.id] = bomb;
            this.Room.Broadcast("BOMB_PLANTED", {bomb:{id: bomb.id, row: bomb.row, col: bomb.col}});
            bomb.timer = setTimeout(function(){
                ExplodeBomb(bomb);
            }, Config.bombTimer)        
        }
    }
}

function ExplodeBomb(bomb){
    if(bomb.timer) clearTimeout(bomb.timer);
    delete bomb.room.Bombs[bomb.id];

    //SIMULATION
    let boxes = [];
    let fires = [];

    for(let i=1; i<bomb.size+1; i++){//right
        let row = bomb.row, col = bomb.col+i;
        let grid = bomb.room.Map.Map[row][col];

        if(bomb.room.Bombs[row+"-"+col]){//bomb
            ExplodeBomb(bomb.room.Bombs[row+"-"+col]);
            break;
        }else if(grid == 4){//box
            boxes.push([row, col]);
            break;
        }else if(grid == 2){//any solid block
            break;
        }
        if(grid == 1 || grid == 3) fires.push([row, col]);
    }

    for(let i=1; i<bomb.size+1; i++){//left
        let row = bomb.row, col = bomb.col-i;
        let grid = bomb.room.Map.Map[row][col];

        if(bomb.room.Bombs[row+"-"+col]){//bomb
            ExplodeBomb(bomb.room.Bombs[row+"-"+col]);
            break;
        }else if(grid == 4){//box
            boxes.push([row, col]);
            break;
        }else if(grid == 2){//any solid block
            break;
        }
        if(grid == 1 || grid == 3) fires.push([row, col]);
    }

    for(let i=1; i<bomb.size+1; i++){//up
        let row = bomb.row-i, col = bomb.col;
        if(!bomb.room.Map.Map[row]) break;
        let grid = bomb.room.Map.Map[row][col];

        if(bomb.room.Bombs[row+"-"+col]){//bomb
            ExplodeBomb(bomb.room.Bombs[row+"-"+col]);
            break;
        }else if(grid == 4){//box
            boxes.push([row, col]);
            break;
        }else if(grid == 2){//any solid block
            break;
        }
        if(grid == 1 || grid == 3) fires.push([row, col]);
    }

    for(let i=1; i<bomb.size+1; i++){//down
        let row = bomb.row+i, col = bomb.col;
        if(!bomb.room.Map.Map[row]) break;
        let grid = bomb.room.Map.Map[row][col];

        if(bomb.room.Bombs[row+"-"+col]){//bomb
            ExplodeBomb(bomb.room.Bombs[row+"-"+col]);
            break;
        }else if(grid == 4){//box
            boxes.push([row, col]);
            break;
        }else if(grid == 2){//any solid block
            break;
        }
        if(grid == 1 || grid == 3) fires.push([row, col]);
    }

    fires.push([bomb.row, bomb.col]);

    boxes.forEach(box => {
        let rndm = Math.random() * 9;
        if(rndm < 2){
            box.reward = 0;
            bomb.player.MaxBombCount++;
            bomb.player.BombCount++;
        }else if(rndm < 4){
            bomb.player.Speed+=0.05;
            box.reward = 1;
        }else if(rndm < 6){
            bomb.player.BombSize++;
            box.reward = 2;
        }
        bomb.room.Map.Map[box[0]][box[1]] = 1;
    });
    for(let player of Object.values(bomb.room.Players)){
        let grid = func.FindGrid(player.x, player.y);
        for(let fire of fires){
            if(fire[0] == grid.row && fire[1] == grid.col){
                player.Kill();
                break;
            }
        }
    }
    bomb.player.BombCount++;
    if(bomb.player.BombCount > bomb.player.MaxBombCount) bomb.player.BombCount = bomb.player.MaxBombCount;
    bomb.room.Broadcast("BOMB_EXPLODED", {bomb: bomb.id, fires: fires, boxes: boxes});
}

module.exports = Player;