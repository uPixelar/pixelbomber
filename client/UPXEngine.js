class UPXEngine{
	constructor(data){
		this.fpsCounter = data.fpsCounter || false;
		this.resolution = data.resolution || {width: 1920, height: 1080};
		this.disableInput = data.disableInput || false;
		if(data.autoStart) this.Start();
	}

	Start(){
		console.info('Initializing %cUPXEngine %c...', 'color: #0ff; font-size: 1.5vh;', null);
		this.Canvas = this.createCanvas();
		this.Canvas.Show = ()=>{
			this.Canvas.style.display = '';
		}
		this.Canvas.Hide = ()=>{
			this.Canvas.style.display = 'none';
		}
		var keys = {};
		this.keys = keys;
		this.keyLog = {};
		this.counter = this.createFPSCounter();
		this.ctx = this.Canvas.getContext('2d');
		document.body.appendChild(this.Canvas);
		console.info('%cAdded canvas to the document', 'font-size: 1vh');

		if(this.fpsCounter){
			document.body.appendChild(this.counter);
			console.info('%cAdded FPS counter to the document', 'font-size: 1vh');
		}
		this.lastTick = 0;
		let engine = this;
		window.addEventListener("keydown", function (event) {
			if(engine.disableInput && event.key != 'F5') event.preventDefault();
			let key = event.key.toLowerCase();
			if(!keys[key]) keys[key] = true;
		});
		window.addEventListener("keyup", function (event) {
			if(engine.disableInput && event.key != 'F5') event.preventDefault();
			let key = event.key.toLowerCase();
			if(keys[key]) keys[key] = false;
		});
		document.body.style.margin = '0';
		document.body.style.padding = '0';
		document.body.style.overFlow = 'hidden';
	}

	createCanvas(){
		let canvas = document.createElement("canvas");
		canvas.id = 'UPXEngine-canvas';
		canvas.width = this.resolution.width;
		canvas.height = this.resolution.height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		return canvas;
	}

	createFPSCounter(){
		let counter = document.createElement("span");
		counter.id = 'UPXEngine-FPScounter';
		counter.style.position = 'absolute';
		counter.style.zIndex = '999';
		counter.style.bottom = '0';
		counter.style.fontFamily = 'arial black'
		counter.style.left = '0';
		counter.style.fontSize = '1.75vh';
		counter.style.background = '#2229';
		counter.style.color = '#090';
		counter.style.width = '9vh';
		counter.style.padding = '0.2vh 0.4vh'
		counter.innerHTML = 'FPS: 0';
		return counter;
	}

	DrawRect(x, y, w, h, c){
		if(x+w > 0 && y+h > 0 && x < this.Canvas.width && y < this.Canvas.height){
			this.ctx.fillStyle = c;
			this.ctx.fillRect(x, y, w, h);
		}
	}

	DrawImage(x, y, w, h, i, flipped){
		if(x+w > 0 && y+h > 0 && x < this.Canvas.width && y < this.Canvas.height){
			if(flipped){
				this.ctx.scale(-1, 1);
				this.ctx.translate(-w-x*2, 0)
				this.ctx.drawImage(i, x, y, w, h);
				this.ctx.setTransform(1, 0, 0, 1, 0, 0)
			}else{
				this.ctx.drawImage(i, x, y, w, h);
			}		
		}
	}

	DrawCircle(x, y, r, c){
		this.ctx.beginPath();
    	this.ctx.arc(x, y, r, 0, 2*Math.PI, false);
    	this.ctx.fillStyle = c;
   		this.ctx.fill();
	}

	IsJustPressed = function(key){
		key = key.toLowerCase();
		if(this.keyLog[key] != this.keys[key]){
			this.keyLog[key] = this.keys[key];
			return this.keys[key];
		}
	}

	IsPressed = function(key){
		key = key.toLowerCase();
		return this.keys[key];
	}

	Vector2(x, y){
		return new class{
			constructor(){
				this.x = x;
				this.y = y;
			}

			add(vector){
				this.x += vector.x;
				this.y += vector.y;
				return this;
			}

			clamp(vector){
				if(this.x > vector.x[1]) this.x = vector.x[1];
				else if(this.x < vector.x[0]) this.x = vector.x[0];
				if(this.y > vector.y[1]) this.y = vector.y[1];
				else if(this.y < vector.y[0]) this.y = vector.y[0];
				return this;
			}
		}
	}

	Update(currentTime){
		this.ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this.DeltaTime = currentTime-this.lastTick;
		this.lastTick = currentTime;
		this.counter.innerHTML = 'FPS: '+Math.round(1000/this.DeltaTime);
	}
}