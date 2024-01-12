class UPXEngine{
	constructor(data){
		this.drawFPS = data.drawFPS || false;
		this.parent = data.parent;
		this.resolution = data.resolution || {width: 1920, height: 1080};
		this.Canvas = this.createCanvas();
		this.ctx = this.Canvas.getContext('2d');
		this.Canvas.Show = ()=>{
			this.Canvas.style.display = 'block';
		}
		this.Canvas.Hide = ()=>{
			this.Canvas.style.display = 'none';
		}
		this.counter = this.createFPSCounter();
		this.FPS = 0;
		if(data.autoStart) this.Start();
	}

	Start(){
		console.info('Edited version of %cUPXEngine %cfor %cPixel%cBomber%c by %cuPixelar%c', 'color: #0ff; font-size: 1.5vh;', null, 'color: #9dab5e; font-size: 1.5vh;', 'color: #c8b372; font-size: 1.5vh;', null, 'color: #fff; font-size: 1.5vh;', null);
		if(this.parent) document.getElementById(this.parent).appendChild(this.Canvas);
		else document.body.appendChild(this.Canvas);
		if(this.drawFPS){
			document.body.appendChild(this.counter);
		}
		this.Canvas.Show();
	}

	createCanvas(){
		let canvas = document.createElement("canvas");
		canvas.id = 'UPXEngine-canvas';
		canvas.width = this.resolution.width;
		canvas.height = this.resolution.height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.display = 'none';
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

	Update(currentTime){
		this.DeltaTime = currentTime-this.TotalTime;
		this.TotalTime = currentTime;
		this.ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this.FPS = Math.round(1000/this.DeltaTime)
		this.counter.innerHTML = `FPS: ${this.FPS}`;
	}
}