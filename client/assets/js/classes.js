class Room{
    constructor(){
        this.InRoom = false;
        this.Started = false;
    }

    get Founder(){
        return this.founder;
    }

    set Founder(id){
        this.founder = id;
        this.MakeFounder(id);
    }

    Join(roomdata, selfid){
        if(this.InRoom) this.Leave();
        this.InRoom = true;
        this.Bombs = {};
        this.Players = {};
        this.Fires = [];

        //VARIABLES
        this.SelfID = selfid;
        this.Started = roomdata.started || false;
        this.InviteCode = roomdata.invitecode;
        this.RawMap = roomdata.map;
        this.Chat = roomdata.chat;

        //SET PLAYERS
        for(let player of Object.values(roomdata.players)){
            player.element = PB.Elements.Game.PlayerList.Add(player);
            if(!player.IsAlive) player.element.classList.add("player-dead");
            this.Players[player.ID] = player;
        }
        this.Founder = roomdata.founder;
        this.MakeSelf(this.SelfID);
        document.getElementById("gui-mapname").value = 'none';
        PB.Elements.Game.InviteCode.value = this.InviteCode;
        PB.Chat.chatOutput.value = this.Chat;
        PB.Elements.MainMenu.Hide();
		PB.Elements.Game.Show();
		PB.Loader.Hide();
		PB.Notifier.Notify('inform', `You have joined to the room.`);
    }

    Leave(){
        if(this.Started) this.Stop();
        PB.Elements.Game.Hide();
		PB.Elements.MainMenu.Show();
		PB.Elements.Game.PlayerList.Reset();
		PB.Loader.Hide();
		PB.Notifier.Notify('inform', `You have left the room.`);
    }

    StartRound(data){
        for(let player of Object.values(data.players)){
            if(player.IsAlive){
                this.Players[player.ID].element.classList.remove("player-dead");
                this.Players[player.ID].IsAlive = true;
            }
        }
		PB.Elements.Game.Buttons.Start.disabled = true;
        PB.Elements.Game.Buttons.Selector.disabled = true;
		PB.Loader.Hide();
        this.Started = true;
    }

    Stop(){
    }

    AddPlayer(player){
        player.element = PB.Elements.Game.PlayerList.Add(player);
        if(!player.IsAlive) player.element.classList.add("player-dead");
        this.Players[player.ID] = player;
    }

    RemovePlayer(id){
        this.Players[id].element.remove();
        delete this.Players[id];
    }

    MakeSelf(id){
        this.Players[id].element.classList.add("player-self");
    }

    MakeFounder(id){
        this.Players[id].element.classList.add("player-founder");
        if(this.SelfID == id){
            PB.Elements.Game.Buttons.Start.disabled = false;
            PB.Elements.Game.Buttons.Selector.disabled = false;
            PB.Elements.Game.Buttons.Start.style.display = 'block';
            document.getElementById("gui-mapname").style.display = 'block';
            PB.Notifier.Notify('inform', 'You are the founder now.')
        }
    }

    KillPlayer(player){
        let ply = this.Players[player.id];
        ply.IsAlive = false;
        ply.element.classList.add("player-dead");
        ply.x = player.x;
        ply.y = player.y;
    }
}

class GridMap {
    constructor(map) {
		this.Engine = PB.Engine;
        this.Map = map;
        this.cols = map[0].length;
        this.rows = map.length || 0;
		this.FixCamera();
    }

	FixCamera() {
        camera.x = -this.cols * gridWidth / 2 + this.Engine.resolution.width / 2;
        camera.y = -this.rows * gridWidth / 2 + this.Engine.resolution.height / 2;
    }

    Draw() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.Engine.DrawImage(camera.x + j * gridWidth, camera.y + i * gridWidth, gridWidth, gridWidth, Grids[this.Map[i][j]].image, false);
            }
        }
    }

    Reset() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.Map[i][j] = 0;
            }
        }
    }

    FindGrid(x, y) {
        let i = 0, j = 0;
        while (x > gridWidth) {
            j++;
            x -= gridWidth;
        }
        while (y > gridWidth) {
            i++;
            y -= gridWidth;
        }
        return { row: i, col: j };
    }
}

let gridWidth = 75;
let playerWidth = gridWidth;
let playerHeight = gridWidth*1.5;
let collisionSize = gridWidth*0.4;
let collisionOffsetBottom = gridWidth/16;
let collisionOffsetX = (gridWidth-collisionSize)/2;
let collisionOffsetY = playerHeight+collisionOffsetBottom-collisionSize;


let camera = { x: 0, y: 0};
const Grids = {
    [0]: {
        type: 'empty',
        image: new Image(gridWidth, gridWidth)
    },
    [1]: {
        type: 'terrain',
        image: new Image(gridWidth, gridWidth)
    },
    [2]: {
        type: 'wall',
        image: new Image(gridWidth, gridWidth)
    },
	[3]: {
        type: 'spawnpoint',
        image: new Image(gridWidth, gridWidth)
    },
	[4]: {
        type: 'box',
        image: new Image(gridWidth, gridWidth)
    },
    [5]: {
        image: new Image(gridWidth, 1.5*gridWidth)
    },
	[6]: {
        image: new Image(gridWidth, 1.5*gridWidth)
    },
    [7]: {
        image: new Image(gridWidth, gridWidth)
    },
}

Grids[0].image.src = 'assets/texture/empty.png';
Grids[1].image.src = 'assets/texture/terrain.jpg';
Grids[2].image.src = 'assets/texture/wall.jpg';
Grids[3].image.src = 'assets/texture/terrain.jpg';
Grids[4].image.src = 'assets/texture/box.jpg';
Grids[5].image.src = 'assets/texture/man0.png';
Grids[6].image.src = 'assets/texture/man1.png';
Grids[7].image.src = 'assets/texture/bomb.png';
