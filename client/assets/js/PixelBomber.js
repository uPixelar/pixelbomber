var PB = {
    Engine: new UPXEngine({autoStart:true, parent: 'game-box', drawFPS: false}),
    Config: {
        "WEBSOCKET_URL": "ws://"+window.location.hostname+":8888",
        //"WEBSOCKET_URL": "ws://eff4-188-119-60-31.eu.ngrok.io",
        "GRID_SIZE": 50
    },
    UserData: {},
    Elements: {
        MainMenu: {
            UI: document.getElementById("mainmenu"),
            Nickname: document.getElementById("mm-nickname"),
            InviteCode: document.getElementById("mm-invitecode"),
            Show: function(){
                this.UI.style.display = 'flex';
            },
            Hide: function(){
                this.UI.style.display = 'none';
            }
        },
        Game: {
            UI: document.getElementById("gui"),
            GameBox: document.getElementById("game-box"),
            InviteCode: document.getElementById("gui-invitecode"),
            Show: function(){
                this.UI.style.display = 'block';
            },
            Hide: function(){
                this.UI.style.display = 'none';
            },
            Buttons:{
                Start: document.getElementById("gui-btn-start"),
                Selector: document.getElementById("gui-mapname"),
            },
            PlayerList: {
                Add: function(player){
                    let div = document.createElement("div");
                    div.id = "player-"+player.ID;
                    div.classList.add('item-player');
                    let img = document.createElement("img");
                    img.classList.add('player-pic');
                    img.src = './assets/texture/pp.png';
                    let span = document.createElement("span");
                    span.classList.add('player-nick');
                    span.innerHTML = player.Nickname;
                    div.appendChild(img);
                    div.appendChild(span);
                    this.element.appendChild(div);
                    return div;
                },
                Reset: function(){
                    while (this.element.firstChild) {
                        this.element.removeChild(this.element.firstChild);
                    }
                },
                element: document.getElementById("player-box")
            }
        }
    },
    Notifier: {
        telement: document.getElementById("notify-text"),
        belement: document.getElementById("notify-box"),
        Notify: function(type, text, timeout){
            timeout = timeout || 2500;
            if(typeof text == 'undefined'){
                text = type;
                type = 'inform';
            }
            clearTimeout(this.timer);
            this.telement.innerHTML = text;
            this.belement.style.background = this.colors[type] || this.colors['inform'];
            this.belement.style.opacity = 1;
            let ele = this.belement;
            this.timer = setTimeout(() => {
                ele.style.opacity = 0;
            }, timeout);
        },
        colors: {
            'inform': '#00f',
            'error': '#f00',
            'success': '#0f0'
        }
    },
    Chat: {
        chatOutput: document.getElementById('chato'),
        chatInput: document.getElementById('chati'),
        AddChatMessage: function(message){
            this.chatOutput.value += message+'\n';
            this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        },
        AddGameMessage: function(message){
            this.chatOutput.value += '[GAME] '+message+'\n';
            this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
        },
        get Input(){
            return this.chatInput.value;
        }
    },
    Loader: {
        loader: document.getElementById('loader'),
        loadertext: document.getElementById('loadertext'),
        Hide: ()=>{
            this.loader.style.display = 'none';
        },
        Show: (text)=>{
            this.loader.style.display = 'flex';
            if(text) this.loadertext.innerHTML = text;
        },
        set Text(text){
            this.loadertext.innerHTML = text;
        }
    },
    WebSocket: {
        RetryCount: 0,
        Connected: false,
        Send: function(action, data){
            if(this.Connected) this.ws.send(JSON.stringify({action: action, data: data}));
        }
    },
    Maps: [
        {id:0, name:"Basic", data: [[2,2,2,2,2,2,2,2,2,2,2],[2,3,1,4,4,4,4,4,1,3,2],[2,1,1,4,4,2,4,4,1,1,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,2,2,2,2,2,2,2,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,4,4,4,4,2,4,4,4,4,2],[2,1,1,4,4,2,4,4,1,1,2],[2,3,1,4,4,4,4,4,1,3,2],[2,2,2,2,2,2,2,2,2,2,2]]},
        {id:1, name:"Nazi", data: [[2,2,2,2,2,2,2,2,2,2,2,2,2],[2,1,1,1,3,1,1,1,1,1,1,1,2],[2,1,2,4,4,4,2,2,2,2,2,1,2],[2,1,2,4,4,4,2,4,4,4,4,1,2],[2,1,2,4,4,4,2,4,4,4,4,3,2],[2,1,2,4,4,4,2,4,4,4,4,1,2],[2,1,2,2,2,2,2,2,2,2,2,1,2],[2,1,4,4,4,4,2,4,4,4,2,1,2],[2,3,4,4,4,4,2,4,4,4,2,1,2],[2,1,4,4,4,4,2,4,4,4,2,1,2],[2,1,2,2,2,2,2,4,4,4,2,1,2],[2,1,1,1,1,1,1,1,3,1,1,1,2],[2,2,2,2,2,2,2,2,2,2,2,2,2]]},
        {id:2, name:"seindleR ÖZEL", data: [[2,2,2,2,2,2,2,2,2,2,2],[2,3,1,4,2,4,2,4,1,3,2],[2,1,4,4,4,4,4,4,4,1,2],[2,4,4,4,2,4,2,4,4,4,2],[2,2,4,2,2,4,2,2,4,2,2],[2,4,4,4,4,4,4,4,4,4,2],[2,2,4,2,2,4,2,2,4,2,2],[2,4,4,4,2,4,2,4,4,4,2],[2,1,4,4,4,4,4,4,4,1,2],[2,3,1,4,2,4,2,4,1,3,2],[2,2,2,2,2,2,2,2,2,2,2]]},
        {id:3, name:"29x29 map", data: [[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],[2,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,2],[2,1,1,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,2,4,4,2,1,1,4,1,1,1,1,1,4,1,1,1,1,1,1,4,1,1,1,1,1,2],[2,1,1,2,4,4,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,2,4,1,2,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,2],[2,1,1,2,2,1,2,1,1,1,1,1,1,4,1,1,1,1,1,4,4,4,2,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4,4,4,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,4,4,1,1,1,1,1,1,1,2,2,2,2,2,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,4,2,2,1,2,2,1,1,2,2,2,1,2,2,2,1,1,4,1,1,4,1,1,1,1,2],[2,1,1,1,2,4,1,4,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,1,4,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,2,1,2,2,2,1,1,2,4,4,1,4,4,2,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,2,4,4,1,4,4,2,1,2,2,2,2,2,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,2,2,2,1,2,2,2,1,2,4,4,1,2,4,1,1,1,2],[2,1,1,1,1,4,1,2,4,2,1,1,1,1,1,1,1,1,1,2,2,2,1,2,1,1,1,1,2],[2,1,1,2,1,2,1,2,4,4,2,1,1,1,2,1,1,1,1,2,4,4,1,2,1,1,1,1,2],[2,1,2,4,2,4,2,2,1,2,1,1,1,2,4,2,1,1,1,2,2,2,1,2,1,1,1,1,2],[2,1,2,1,1,1,1,1,1,4,2,1,1,2,1,2,1,1,1,2,4,4,1,2,1,1,1,1,2],[2,1,2,1,2,2,4,2,4,2,1,1,1,2,1,1,1,1,4,2,2,2,1,2,1,1,1,1,2],[2,1,2,4,2,1,2,1,2,1,4,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,2,4,2,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2],[2,1,1,1,1,1,1,1,1,1,1,1,1,2,4,2,1,1,1,1,1,1,4,1,1,1,1,1,2],[2,1,1,1,1,1,1,4,1,1,1,1,2,4,4,4,2,1,1,1,1,1,1,1,1,1,1,1,2],[2,3,1,1,1,1,1,1,1,1,1,2,4,4,2,4,4,2,1,1,1,1,1,1,1,1,1,3,2],[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]]},
    ]
};
