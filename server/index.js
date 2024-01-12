var DB = {};
const Config = require("./Config.js");
//CONST VARIABLES
var ws = require("ws");
var Room = require("./Room");
const http = require("http");
const readline = require('readline');
const fs = require("fs").promises;
const { FindGrid, GetGridCoords } = require("./Room");
var wss = new ws.Server({ port: 8888 });
let favicon;
fs.readFile(__dirname + "/../client/assets/img/favicon.ico").then(contents => {
    favicon = contents;
})
.catch(err => {
    console.error(`Cannot read favicon.`);
    process.exit(1);
});

const httpServer = http.createServer(function(req, res){
    if(req.url == '/'){
        res.setHeader("Content-Type", "text/html");
        res.writeHead(200);
        fs.readFile(__dirname + "/../client/index.html")
            .then(contents => {
                res.end(contents);
            })
            .catch(err => {
                console.error(`Could not read index.html file: ${err}`);
                process.exit(1);
            });
        //res.end(page);
    }else if(req.url == '/favicon.ico'){
        res.end(favicon);
    }else if(req.url.startsWith('/assets')){
        fs.readFile(__dirname + "/../client"+req.url)
            .then(contents => {
                res.end(contents);
            })
            .catch(err => {
                console.error(`Could not read index.html file: ${err}`);
                process.exit(1);
            });
    }else{
        res.end("Please do not change url")
        console.log('Couldn\'t answer request.', `"${req.url}"`);
    }
})
httpServer.listen(8000);
let gridWidth = Config.gridWidth;
let collisionSize = Config.collisionSize;
let bombTimer = 3000;
let playerWidth = gridWidth;
let playerHeight = gridWidth*1.5;
let collisionOffsetBottom = gridWidth/16;
let collisionOffsetX = (gridWidth-collisionSize)/2;
let collisionOffsetY = playerHeight+collisionOffsetBottom-collisionSize;

DB.Rooms = {};
DB.Users = {};
DB.Config = {};




//#WSHANDLE
wss.on("connection", (client, request) => {
    client.Send = function(action, data){
        this.send(JSON.stringify({action:action, data:data}))
    }

    let userToken = request.rawHeaders.find(header => header.startsWith('userToken'));
    if(typeof userToken != 'undefined') userToken = userToken.substr(11, 8);
    if(typeof DB.Users[userToken] != 'undefined'){
        DB.Users[userToken].client = client;
    }else{
        userToken = createUserToken();
        DB.Users[userToken] = {
            client: client,
            Send: function(action, data){
                this.client.send(JSON.stringify({action:action, data:data}))
            },
            close: function(){
                if(this.player){
                    this.player.Room.RemovePlayer(this);
                }
            }
        }
        client.userToken = userToken;
        client.Send("USER_TOKEN", {userToken: userToken});
    }
    client.on('close', () => {
        if(DB.Users[client.userToken]){
            DB.Users[client.userToken].close();
        }
    })
    client.on('message', (event) => {
        let user = DB.Users[client.userToken];
        if(typeof user == 'undefined'){
            client.close(4001, 'User data compromised, please refresh the page.')
        }else{
            event = JSON.parse(event);
            switch(event.action){
                case "CREATE_ROOM":
                    user.nickname = event.data.nickname;
                    let newroom = new Room();
                    newroom.AddPlayer(user);
                    Room.Rooms[newroom.InviteCode] = newroom;
                break;

                case "JOIN_ROOM":
                    user.nickname = event.data.nickname;
                    let room = Room.Rooms[event.data.inviteCode]
                    if(typeof room != 'undefined'){
                        room.AddPlayer(user);
                    }else{
                        user.Send("NOTIFY", {ntype: 'error', message: 'There is no room with this invite code.', hideLoader: true});
                    }
                break;

                case "SELECT_MAP":
                    if(user.player && user.player.Room.Founder == user.player.ID){
                        let map = Room.Maps[event.data.id];
                        if(map){
                            user.player.Room.Broadcast("SELECT_MAP", {id: event.data.id});
                            user.player.Room.MapID = event.data.id;
                        }
                    }
                break;

                case "LEAVE_ROOM":
                    if(user.player)
                        user.player.Room.RemovePlayer(user);
                break;

                case "CHAT_MESSAGE":
                    if(event.data.message.startsWith('/')){
                        //COMMAND HANDLING
                    }else{
                        if(user.player)
                            user.player.Room.AddChatMessage(event.data.message, user.player.Nickname);
                    }
                break;

                case "PLANT_BOMB":
                    if(user.player && user.player.BombCount > 0) user.player.PlantBomb();
                break;

                case "START_GAME":
                    if(user.player && user.player.Room.Founder == user.player.ID)
                        if(user.player.Room.MapID > -1)
                            user.player.Room.StartRound();
                        else
                            user.client.Send("NOTIFY", {ntype: "error", message: "No map selected.", hideLoader: true})
                break;

                case "MOVEMENT":
                    if(user.player && user.player.Room.Started){
                        let direction = {
                            x: 0,
                            y: 0
                        };
                        if(event.data.direction.x != 0){
                            direction.x = event.data.direction.x > 0? 1:-1;
                        }
                        if(event.data.direction.y != 0){
                            direction.y = event.data.direction.y > 0? 1:-1;
                        }
                        user.player.Direction = direction;
                    }
                break;
            }
        }
    });

});

//#GAMEMANAGER
function newCollision(player){
    plyV = {
        x: DeltaTime*player.speed*player.Direction.x,
        y: DeltaTime*player.speed*player.Direction.y
    }
    if(player.Direction.x == 1){
        let l1 = {
            x: player.x+gridWidth,
            y: player.y
        }
        let l2 = {
            x: player.x+gridWidth,
            y: player.y+gridWidth
        }

        while(plyV.x > gridWidth){
            l1.x += gridWidth;
            let grid = FindGrid(l1.x, l1.y);
            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                l1.x -= l1.x%gridWidth;
                player.x = l1.x-gridWidth;
                break;
            }
        }
    }
}

let lastTick = Date.now();
let DeltaTime = 0;
function GameManager(){
    let cur = Date.now();
    DeltaTime = cur-lastTick;
    lastTick = cur;
    for(let room of Object.values(Room.Rooms)){
        if(room.Started){
            for (let player of Object.values(room.Players)) {
                if(player.IsAlive && (player.Direction.x != 0 || player.Direction.y != 0)){
                    /*plyV = {
                        x: DeltaTime*player.Speed*player.Direction.x,
                        y: DeltaTime*player.Speed*player.Direction.y
                    }
                    if(player.Direction.x == 1){
                        let l1 = {
                            x: player.x+collisionSize,
                            y: player.y
                        }
                        let l2 = {
                            x: player.x+collisionSize,
                            y: player.y+collisionSize
                        }
                        while(plyV.x > gridWidth){
                            l1.x += gridWidth;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.x -= l1.x%gridWidth;
                                player.x = l1.x-collisionSize;
                                break;
                            }
                        }
                        if(plyV.x != 0){
                            l1.x += plyV.x;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.x = GetGridCoords(grid.row, grid.col).x;
                                player.x = l1.x-collisionSize;
                                break;
                            }else{
                                player.x = l1.x-collisionSize;
                            }
                        }
                    }else{
                        let l1 = {
                            x: player.x,
                            y: player.y
                        }
                        let l2 = {
                            x: player.x,
                            y: player.y+collisionSize
                        }
                        while(plyV.x < -gridWidth){
                            l1.x -= gridWidth;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.x += gridWidth-(l1.x%gridWidth);
                                player.x = l1.x;
                                break;
                            }
                        }
                        if(plyV.x != 0){
                            l1.x += plyV.x;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.x = GetGridCoords(grid.row, grid.col).x;
                                player.x = l1.x+gridWidth;
                                break;
                            }else{
                                player.x = l1.x;
                            }
                        }
                    }
                    if(player.Direction.y == 1){
                        let l1 = {
                            x: player.x,
                            y: player.y+collisionSize
                        }
                        let l2 = {
                            x: player.x+collisionSize,
                            y: player.y+collisionSize
                        }
                        while(plyV.y > gridWidth){
                            l1.y += gridWidth;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.y -= l1.y%gridWidth;
                                player.y = l1.y-collisionSize;
                                break;
                            }
                        }
                        if(plyV.y != 0){
                            l1.y += plyV.y;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.y = GetGridCoords(grid.row, grid.col).y;
                                player.y = l1.y-collisionSize;
                                break;
                            }else{
                                player.y = l1.y-collisionSize;
                            }
                        }
                    }else{
                        let l1 = {
                            x: player.x,
                            y: player.y
                        }
                        let l2 = {
                            x: player.x,
                            y: player.y+collisionSize
                        }
                        while(plyV.y < -gridWidth){
                            l1.y -= gridWidth;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.y += gridWidth-(l1.y%gridWidth);
                                player.y = l1.y;
                                break;
                            }
                        }
                        if(plyV.y != 0){
                            l1.y += plyV.y;
                            let grid = FindGrid(l1.x, l1.y);
                            if(room.Map.Map[grid.row][grid.col] == 2){//collision
                                l1.y = GetGridCoords(grid.row, grid.col).y;
                                player.y = l1.y+gridWidth;
                                break;
                            }else{
                                player.y = l1.y;
                            }
                        }
                    }*/
                    
                    let possibleCollisions = [];
                    let collisionObject = {width: collisionSize, height: collisionSize, x: player.x, y: player.y, velocity:{x: DeltaTime*player.Speed*player.Direction.x, y: DeltaTime*player.Speed*player.Direction.y}};
                    let playerGrid = FindGrid(collisionObject.x, collisionObject.y);
                    for(let i=playerGrid.row-1; i<=playerGrid.row+1; i++){
                        for(let j=playerGrid.col-1; j<=playerGrid.col+1; j++){
                            if(typeof room.Map.Map[i] != 'undefined' && typeof room.Map.Map[i][j] != 'undefined' && room.Map.Map[i][j] != 1 && room.Map.Map[i][j] != 3)
                                possibleCollisions.push([i, j]);
                        }
                    }
                    let collisions = CalculateCollisions(collisionObject, possibleCollisions)
                    player.x += DeltaTime*player.Speed*player.Direction.x;
                    player.y += DeltaTime*player.Speed*player.Direction.y;
                    if(collisions.Horizontal.Left.length != 0){
                        player.x = collisions.Horizontal.Left[0].x+gridWidth;
                    }
                    if(collisions.Horizontal.Right.length != 0){
                        player.x = collisions.Horizontal.Right[0].x-collisionSize;
                    }
                    if(collisions.Vertical.Up.length != 0){
                        player.y = collisions.Vertical.Up[0].y+gridWidth;
                    }
                    if(collisions.Vertical.Down.length != 0){
                        player.y = collisions.Vertical.Down[0].y-collisionSize;
                    }
                }
            };
            room.BroadcastGameState();
        }
    };
}
setInterval(GameManager, 16);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//#FUNCTIONS
function createUserToken(){
    let usertoken = "";
    let letterList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(let i=0; i<8; i++){
        usertoken+=letterList.charAt(Math.floor(Math.random() * letterList.length));
        if(usertoken.length == 8 && typeof DB.Users[usertoken] != 'undefined'){
            i=0;
            usertoken = "";
        }
    }
    return usertoken;
}

function CheckCollisions(player){
    if(player.Direction.x == 1){
        let velocity = player.Speed*DeltaTime;
        let l1 = {x: player.x+collisionSize, y: player.y};
        let l2 = {x: player.x+collisionSize, y: player.y+collisionSize};
        if(FindGrid())
        while(velocity > gridWidth){
            l1.x += gridWidth;
        }
    }else{

    }
}

function CalculateCollisions(object, possibleCollisions){
	let collisions = {Vertical: {Up: [], Down:[]}, Horizontal: {Left: [], Right:[]}};
	let dx = object.x+object.width, ndx = dx+object.velocity.x, dy = object.y+object.height, ndy = dy+object.velocity.y;
	for(let i=0; i<possibleCollisions.length; i++){
        let grid = possibleCollisions[i];
        let gridc = GetGridCoords(grid[0], grid[1]);
		let obj = {
            x: gridc.x,
            y: gridc.y,
            width: gridWidth,
            height: gridWidth
        }
		if(object.x < obj.x+obj.width && object.x+object.width > obj.x){
			if(dy <= obj.y && ndy >= obj.y) collisions.Vertical.Down.push(obj);
			else if(object.y >= obj.y+obj.height && object.y+object.velocity.y <= obj.y+obj.height) collisions.Vertical.Up.push(obj);
		}
		if(object.y < obj.y+obj.height && object.y+object.height > obj.y){
			if(dx <= obj.x && ndx >= obj.x) collisions.Horizontal.Right.push(obj);
			else if(object.x >= obj.x+obj.width && object.x+object.velocity.x <= obj.x+obj.width) collisions.Horizontal.Left.push(obj);			
		}
	}
	return collisions;
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (rawcmd) => {
    let args = rawcmd.split(" ");
    switch(args[0]){
        case "rooms":{
            console.log(Object.keys(Room.Rooms));
            break;
        }      

        case "room":{
            let room = Room.Rooms[args[1]];
            if(room)
                console.log(room)
            break;
        }    

        case "kick":{
            let room = Room.Rooms[args[1]];
            if(room){
                let player = room.Players[args[2]];
                if(player){
                    room.RemovePlayer(player.User);
                    console.log("Player kicked xd");
                }
            }
            break;
        }

        case "notify":{
            let room = Room.Rooms[args[1]];
            if(room){
                let player = room.Players[args[2]];
                if(player){
                    args.splice(0, 3)
                    let message = args.join(' ');
                    player.User.client.Send("customnotification", {message: message, hideLoader: true})
                }
            }
            break;
        }
    }
});