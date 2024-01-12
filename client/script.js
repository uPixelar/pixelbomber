let gridWidth = 100;
let selectedTile = 0;
let camera = { x: 0, y: 0, speed: 10, defaultSpeed: 5, d: function() { console.log(this.x, this.y) } };
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
    }
}

Grids[0].image.src = 'img/empty.png';
Grids[1].image.src = 'img/terrain.jpg';
Grids[2].image.src = 'img/wall.jpg';
Grids[3].image.src = 'img/spawnpoint.jpg'
Grids[4].image.src = 'img/box.jpg'


var Engine = new UPXEngine({ autoStart: true });

Engine.Canvas.Hide();
document.getElementById('second').style.display = 'none';
//document.getElementById('savesuccess').style.display = 'none';

function login() {
    let cols = document.getElementById('column');
    let rows = document.getElementById('row');
    let errormsg = document.getElementById('errormsg');
    //if(cols.value += 31) errormsg.innerHTML = "30dan büyük bir sayı giremezsin";
    if (cols.value.length == 0) errormsg.innerHTML = "Sütun sayısı boş olamaz!";
    else if (rows.value.length == 0) errormsg.innerHTML = "Satır Sayısı boş olamaz!";
    else {
        document.getElementById('first').style.display = 'none';
        document.getElementById('second').style.display = 'flex';
        Engine.Canvas.Show();
        map = new GridMap(cols.value, rows.value);
        Start();
    }
}

class GridMap {
    constructor(first, second) {
        if (typeof second != 'undefined') {
            this.cols = first;
            this.rows = second;
            this.Map = [];
            for (let i = 0; i < this.rows; i++) {
                this.Map[i] = [];
                for (let j = 0; j < this.cols; j++) {
                    if (i == 0 || i == this.rows - 1 || j == 0 || j == this.cols - 1)
                        this.Map[i][j] = 2;
                    else this.Map[i][j] = 1;
                }
            }
        } else {
            this.Map = first;
            this.cols = first.length;
            this.rows = first[0].length || 0;
        }
        this.FixCamera();
    }

    Draw() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                Engine.DrawImage(camera.x + j * gridWidth, camera.y + i * gridWidth, gridWidth, gridWidth, Grids[this.Map[i][j]].image, false);
            }
        }
        if (typeof old.type != 'undefined') {
            let grid = this.FindGrid(cx, cy);
            Engine.DrawRect(camera.x + grid.col * gridWidth, camera.y + grid.row * gridWidth, gridWidth, gridWidth, '#0009');
            if (isDown) {
                map.Map[old.row][old.col] = selectedTile;
                old = {};
            }
        }
        Engine.DrawCircle(camera.x + this.cols * gridWidth / 2, camera.y + this.rows * gridWidth / 2, gridWidth / 20, "#f00");
    }

    FixCamera() {
        camera.x = -this.cols * gridWidth / 2 + Engine.resolution.width / 2;
        camera.y = -this.rows * gridWidth / 2 + Engine.resolution.height / 2;
    }

    Reset() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (i == 0 || i == this.rows - 1 || j == 0 || j == this.cols - 1)
                    this.Map[i][j] = 2;
                else this.Map[i][j] = 1;
            }
        }
    }
    FindGrid(x, y) {
        let i = 0,
            j = 0;
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
    Save() {
        document.getElementById('savesuccess').style.visibility = 'visible';
        setTimeout(() => {document.getElementById('savesuccess').style.visibility = 'hidden';}, 1000)
        localStorage.setItem("map", JSON.stringify(map.Map))
    }
}

function GetMap() {
    JSON.parse(localStorage.getItem("map"))
}

let map;

window.addEventListener("wheel", function(event) {
    if (event.deltaY < 0) {
        if (gridWidth + 10 <= 150) {
            camera.x -= (-camera.x + Engine.Canvas.width / 2) / (gridWidth / 10);
            camera.y -= (-camera.y + Engine.Canvas.height / 2) / (gridWidth / 10);
            gridWidth += 10;
        } else gridWidth = 150;
    } else {
        if (gridWidth - 10 >= 10) {
            camera.x += (-camera.x + Engine.Canvas.width / 2) / (gridWidth / 10);
            camera.y += (-camera.y + Engine.Canvas.height / 2) / (gridWidth / 10);
            gridWidth -= 10;
        } else gridWidth = 10;
    }
    paint();
})

function Start() {
    window.addEventListener("mousemove", function(event) {
        mx = event.pageX;
        my = event.pageY;
        paint();
    });
    GetMap();
    window.requestAnimationFrame(Update);
}

function limiter(input) {
    if (input.value < 0) input.value = 0, alert("Girilen sayı negatif bir değerde olamaz!");
    if (input.value > 30) input.value = 30, alert("Girilen sayı 30'dan daha fazla olamaz!");;

 }

function Update(ct) {
    Engine.Update(ct);
    map.Draw();
    if (Engine.IsPressed("w")) camera.y += camera.speed;
    else if (Engine.IsPressed("s")) camera.y -= camera.speed;
    if (Engine.IsPressed("a")) camera.x += camera.speed;
    else if (Engine.IsPressed("d")) camera.x -= camera.speed;
    if (Engine.IsPressed("shift")) camera.speed = 2 * camera.defaultSpeed;
    else camera.speed = camera.defaultSpeed;
    //if(Engine.IsJustPressed(' ')) console.log(-camera.x+Engine.Canvas.width/2, -camera.y+Engine.Canvas.height/2);
    //Engine.DrawCircle(960, 540, 5, '#000');
    //CODE GOES ABOVE
    window.requestAnimationFrame(Update);
}

document.querySelectorAll('.tile').forEach((element) => {
    element.onclick = function(event) {
        selectedTile = parseInt(this.id);
    }
})
let cx, cy, mx = 0,
    my = 0;
let old = {};

function paint() {
    cx = -camera.x + Math.round((mx * 1920) / document.documentElement.clientWidth);
    cy = -camera.y + Math.round((my * 1080) / document.documentElement.clientHeight);
    let newg = map.FindGrid(cx, cy);
    if (newg.row < map.rows && newg.col < map.cols) {
        if (typeof old.type != 'undefined' && (newg.row != old.row || newg.col != old.col)) {
            map.Map[old.row][old.col] = old.type;
            old = {};
        } else if (typeof old.type != 'undefined' && newg.row == old.row && newg.col == old.col) {} else if (map.Map[newg.row][newg.col] != selectedTile) {
            old.type = map.Map[newg.row][newg.col];
            old.row = newg.row;
            old.col = newg.col;
            map.Map[newg.row][newg.col] = selectedTile;
        }
    } else if (typeof old.type != 'undefined') {
        map.Map[old.row][old.col] = old.type;
        old = {};
    }
}

let isDown = false;
window.addEventListener("mousedown", function(event) {
    isDown = true;
});
window.addEventListener("mouseup", function(event) {
console.log("up")
    isDown = false;
});
    
window.addEventListener("dragstart", function(event) {
event.preventDefault();
});

/*
=>row
[0, 0, 0, 0]| col
[0, 0, 0, 0]V
[0, 0, 0, 0]
[0, 0, 0, 0]

if (false) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < walls.length; i++) {
            ctx.fillRect(walls[i].x, walls[i].y, walls[i].w, walls[i].h);
        }
        me.m = [event.pageX, event.pageY];
        let wall = {};
        wall.x = me.b[0] < me.m[0] ? me.b[0] : me.m[0];
        wall.y = me.b[1] < me.m[1] ? me.b[1] : me.m[1];
        wall.w = Math.abs(me.m[0] - me.b[0]);
        wall.h = Math.abs(me.m[1] - me.b[1]);
        let wx = Math.round((wall.w * 1920) / document.documentElement.clientWidth);
        let wy = Math.round((wall.h * 1080) / document.documentElement.clientHeight);
        let ox = Math.round((wall.x * 1920) / document.documentElement.clientWidth);
        let oy = Math.round((wall.y * 1080) / document.documentElement.clientHeight);
        ctx.beginPath();
        ctx.rect(ox, oy, wx, wy);
        ctx.stroke();

    }



*/