PB.Room = new Room();

function GetGridCoords(row, col){
	return {x: col*gridWidth, y:row*gridWidth};
}

function HandleButton(action){
	if(action == 'create' || action == 'join'){
		let nickname = document.getElementById('mm-nickname').value;
		if(nickname.length == 0) return PB.Notifier.Notify("error", "Nickname cannot be empty!");
		else if(nickname.includes(" ")) return PB.Notifier.Notify("error", "Nickname cannot include spaces!");
		else if(nickname.length > 16) return PB.Notifier.Notify("error", "Nickname cannot be longer than 16 characters!");
	}
	switch(action){
		case 'create':
			PB.UserData.Nickname = document.getElementById('mm-nickname').value;
			PB.WebSocket.Send("CREATE_ROOM", {nickname: PB.UserData.Nickname});
			PB.Loader.Show('CREATING ROOM...');
		break;

		case 'join':
			PB.UserData.Nickname = document.getElementById('mm-nickname').value;
			if(PB.Elements.MainMenu.InviteCode.value.length == 0) return PB.Notifier.Notify('error', 'Invite code cannot be empty!');
			PB.WebSocket.Send("JOIN_ROOM", {inviteCode: PB.Elements.MainMenu.InviteCode.value, nickname: PB.UserData.Nickname});
			PB.Loader.Show('JOINING ROOM...');
		break;

		case 'invitecode':
			let element = PB.Elements.Game.InviteCode;
			if(element.value != '*copied*'){
				element.select();
				document.execCommand("copy");
				let code = element.value;
				element.value = '*copied*';
				setTimeout(function(){element.value = code;}, 300)
			}
		break;

		case 'mapmanager':
			PB.Notifier.Notify('inform', 'Map manager is under development!')
		break;

		case 'start':
			PB.WebSocket.Send("START_GAME");
			PB.Loader.Show("STARTING GAME...");
		break;

		case 'leave':
			PB.WebSocket.Send("LEAVE_ROOM");
		break;
	}
}
function toHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
  }

PB.Game = {
	Update: function(){
		if(PB.Room && PB.Room.InRoom){
			if(PB.Room.RawMap){
				for (let i = 0; i < PB.Room.RawMap.length; i++) {
					for (let j = 0; j < PB.Room.RawMap[0].length; j++) {
						PB.Engine.DrawImage(camera.x + j * gridWidth, camera.y + i * gridWidth, gridWidth, gridWidth, Grids[PB.Room.RawMap[i][j]].image, false);
					}
				}
			}
			if(PB.Room.Started){
				
				let selfPlayer = PB.Room.Players[PB.Room.SelfID];
				PB.Engine.ctx.setTransform(1, 0, 0, 1, -selfPlayer.x+PB.Engine.Canvas.width/2, -selfPlayer.y+PB.Engine.Canvas.height/2);
				//camera.x = -selfPlayer.x+PB.Engine.Canvas.width/2;
				//camera.y = -selfPlayer.y+PB.Engine.Canvas.height/2;
				for (let bomb of Object.values(PB.Room.Bombs)) {
					PB.Engine.DrawImage(camera.x+bomb.x, camera.y+bomb.y, gridWidth, gridWidth, Grids[7].image, false);
				}
				for(let i=0; i<PB.Room.Fires.length; i++){
					let fire = PB.Room.Fires[i];
					if(Date.now() > fire.time+400){
						PB.Room.Fires.splice(i, 1);
						i--;
					}
					else{
						for(item of fire.fires){
							let c = GetGridCoords(item[0], item[1]);
							PB.Engine.DrawImage(camera.x+c.x, camera.y+c.y, gridWidth, gridWidth, Grids[0].image, false);
						}
					}
				}
				for (let player of Object.values(PB.Room.Players)) {
					let f = false;
					if(!player.IsAlive) f = true;
					PB.Engine.DrawRect(camera.x+player.x, camera.y+player.y, collisionSize, collisionSize, "#f00")
					PB.Engine.DrawImage(camera.x+player.x-collisionOffsetX, camera.y+player.y-collisionOffsetY, gridWidth, 1.5*gridWidth, Grids[5].image, f);
				}
			}
		}
		PB.Engine.ctx.textBaseline = 'top';
		PB.Engine.ctx.font = '40px serif';
		PB.Engine.ctx.fillStyle = '#'+toHex(NetDelay)+'0000';
		PB.Engine.ctx.fillText(NetDelay+" ms", 0, 0);
	}
};

let lastNetTick = 0;
let NetDelay = 0;

PB.WebSocket.Connect = () => {
	PB.WebSocket.ws = new WebSocket(PB.Config["WEBSOCKET_URL"], ["userToken", typeof PB.UserData.UserToken == 'undefined'? '0':PB.UserData.UserToken]);
	PB.WebSocket.ws.onclose = (event)=>{
		PB.WebSocket.Connected = false;
		PB.Loader.Show('Connection lost to server, reconnecting('+PB.WebSocket.RetryCount+')...');
		if(PB.WebSocket.RetryCount != 10){
			PB.WebSocket.RetryCount++;
			setTimeout(PB.WebSocket.Connect, 2000)
		}else{
			PB.Loader.Show('Couldn\'t connect to server, try again later.');
		}
	}
	PB.WebSocket.ws.onopen = (event)=>{
		PB.WebSocket.Connected = true;
		PB.Loader.Hide();
		PB.WebSocket.RetryCount = 0;
		PB.WebSocket.ws.onmessage = (event) => {
			event = JSON.parse(event.data);
			if(event.data && event.data.hideLoader) PB.Loader.Hide();
			switch(event.action){
				case "JOIN_ROOM":
					PB.Room.Join(event.data.roomdata, event.data.selfid);
				break;

				case "LEAVE_ROOM":
					if(PB.Room.InRoom) PB.Room.Leave();
				break;

				case "PLAYER_LEFT":
					PB.Room.RemovePlayer(event.data.id);
					if(event.data.founder) PB.Room.Founder = event.data.founder;
				break;

				case "PLAYER_DIED":
					PB.Room.KillPlayer(event.data);
				break;

				case "NOTIFY":
					PB.Notifier.Notify(event.data.ntype, event.data.message, event.data.timeout);
				break;

				case "CHAT_PRINT":
					PB.Chat.AddChatMessage(event.data.message);
				break;

				case "PLAYER_JOINED":
					PB.Room.AddPlayer(event.data.player);
				break;

				case "USER_TOKEN":
					PB.UserData.UserToken = event.data.userToken;
				break;

				case "START_GAME":
					PB.Room.StartRound(event.data);
				break;

				case "GAME_STATE":
					NetDelay = Date.now()-event.data.tick;
					if(event.data.map){
						PB.Room.RawMap = event.data.map;
					}
					for(let player of Object.values(event.data.players)){
						let ply = PB.Room.Players[player.id];
						ply.x = player.x;
						ply.y = player.y;
						ply.direction = player.Direction;
					}
				break;

				case 'customnotification':
					PB.Notifier.Notify('inform', event.data.message);
					break;

				case "BOMB_PLANTED":
					let bomb = event.data.bomb;
					let coords = GetGridCoords(bomb.row, bomb.col);
					bomb.x = coords.x;
					bomb.y = coords.y;
					PB.Room.Bombs[event.data.bomb.id] = bomb;
				break;

				case "BOMB_EXPLODED":
					delete PB.Room.Bombs[event.data.bomb];
					PB.Room.Fires.push({time: Date.now(), fires: event.data.fires});
				break;

				case "SELECT_MAP":
					PB.Room.RawMap = PB.Maps[event.data.id].data;
					camera.x = -PB.Room.RawMap[0].length * gridWidth / 2 + PB.Engine.Canvas.width / 2;
					camera.y = -PB.Room.RawMap.length * gridWidth / 2 + PB.Engine.Canvas.height / 2;
				break;
			}
		};
		//PB.Elements.MainMenu.Nickname.value = 'test';
			//HandleButton('create');
	}
}

function Start(){
	console.info("Please do not try to hack the game, just have fun. If you can hack, tell us how.\n%cDiscord:%cuPixelar#0233", 'color: #7289da;', null)
	document.getElementById("gui-mapname").addEventListener("change", event => {
		if(event.target.value != "none"){
			PB.WebSocket.Send("SELECT_MAP", {id: parseInt(event.target.value)});
		}
	})
	
	PB.Maps.forEach(map => {
		document.getElementById("gui-mapname").innerHTML += `<option value=${map.id}>${map.name}</option>`
	})
	window.requestAnimationFrame(Update);
	PB.Loader.Show('Connecting to server');
	PB.WebSocket.Connect();
}

function Update(currentTime){
	window.requestAnimationFrame(Update)
	PB.Engine.Update(currentTime);
	PB.Game.Update();
}



//CHAT ENTER
PB.Chat.chatInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
    	if(PB.Chat.Input != ''){
    		PB.WebSocket.Send("CHAT_MESSAGE", {message: document.getElementById("chati").value});
    		document.getElementById("chati").value = ''
    	}
    }
});

PB.Chat.chatInput.addEventListener("focus", () => {
		PB.WebSocket.Send("MOVEMENT", {direction: {x:0, y:0}});
		keys = {};
})
////

//KEY PRESS
var keys = {};
document.addEventListener("keydown", function(event){
	let key = event.key.toLowerCase();
	if(document.activeElement != PB.Chat.chatInput && !keys[key] && 'wasd '.includes(key)){
		keys[key] = true;
		let direction = {x:0, y:0};
		if(keys['w']) direction.y = -1; 
		else if(keys['s']) direction.y = 1;
		else direction.y = 0;
		if(keys['a']) direction.x = -1;
		else if(keys['d']) direction.x = 1;
		else direction.x = 0;
		if(key == ' ') PB.WebSocket.Send("PLANT_BOMB");
		PB.WebSocket.Send("MOVEMENT", {direction: direction});
	}
});

document.addEventListener("keyup", function(event){
	let key = event.key.toLowerCase();
	if(document.activeElement != PB.Chat.chatInput && keys[key] && 'wasd '.includes(key)){
		keys[key] = false;
		let direction = {x:0, y:0};
		if(keys['w']) direction.y = -1; 
		else if(keys['s']) direction.y = 1;
		else direction.y = 0;
		if(keys['a']) direction.x = -1;
		else if(keys['d']) direction.x = 1;
		else direction.x = 0;
		PB.WebSocket.Send("MOVEMENT", {direction: direction});
	}
});
////

//RIGHT CLICK BLOCKER
document.addEventListener("contextmenu", function(event){
	event.preventDefault();
});
////

//UNFOCUS | CHANGE TAB
window.addEventListener('blur', () => {
	keys = {};
	PB.WebSocket.Send("MOVEMENT", {direction: {x:0, y:0}});
});
////

Start();