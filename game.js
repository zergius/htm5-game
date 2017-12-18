var G = function() {
	var canvas, ctx, w, h, frames = 0, lastT, fps, fpsContainer, imgs = {}, resourcesLoaded = false, numResources = 0;
	var inputStates = {left: false, right: false};
	var ship = {
		x: 0,
		y: 0,
		speed: 120,
		width: 90,
		moving: false,
		direction: ''
	};
	var back = {
		stars: 15,
		starSpeed: 2
	};
	var cometInfo = {
		speed: 100,
		sizeBig: 30,
		sizeSmall: 4,
		angleVar: 90,
		angleMin:45,
		maxComets: 5,
		rotSpeedRadSec: 3,
	};
	var images = {
		ship: {f: 'ship.png', w: 90, h: 90, col: 1, row: 1, frames:1, xo:90, yo:0},
		flame: {f: 'flame.png', w:55, h: 22, col: 1, row: 5, frames:5, xo:0, yo:0},
		back: {f: 'back.png', w:400, h:600, col: 1, row: 1, frames:1, xo:0, yo:0},
		asteroid: {f: 'asteroid.png', w:78, h:78, col: 1, row: 1, frames:1, xo:0, yo:0},
	}
	var totalResourcesToLoad = 0;
	for(k in images) {
		if (images.hasOwnProperty(k)) {
			totalResourcesToLoad++;
		}
	}

	var countResources = function(){
		numResources += 1;
		console.log(numResources + ' of ' + totalResourcesToLoad + ' loaded');
		if(numResources == totalResourcesToLoad) {
			resourcesLoaded = true;
		}
	}
	
	var fpsMeter = function(curT) {
		if(lastT === undefined) {
			lastT = curT;
			return;
		}
		var timediff = curT - lastT;
		if(timediff >= 1000) {
			fps = frames;
			frames = 0;
			lastT = curT;
		}
		fpsContainer.innerHTML = 'FPS: ' + fps;
		frames++;
	};

	/* Image loader */
	var loadImages = function(){
		for(k in images) {
			if (images.hasOwnProperty(k)) {
				imgs[k] = {};
				imgs[k].i = new Image();
				imgs[k].i.src = images[k].f;
				imgs[k].i.onload = function() {
					imgs[k].r = new sprite(imgs[k].i, images[k].xo, images[k].yo, images[k].w, images[k].h, images[k].frames, images[k].col, images[k].row);
					countResources();
				}(k);
			}
		}
	};

	function clearCanvas() {
		ctx.clearRect(0, 0, w, h);
		//ctx.fillRect(0, 0, w, h);
	}

	function sprite(img, x, y, w, h, frames, col, row) {
		var api = {};
		api.img = img;
		api.x = x;
		api.y = y;
		api.w = w;
		api.h = h;
		api.frames = frames;
		api.col = col;
		api.row = row;
		api.render = function(posX, posY, scaleX, scaleY, frame, rotation) {
			if(frame > 0) {
				var x = api.x;
				var y = api.y;
				if(api.row > 1 && api.col > 1) {
					x = parseInt(frame / col, 10) * api.w;
					y = (frame % row) * api.h;
				}
				if(api.col > 1 && api.row == 1) {
					x = frame * api.w;
				}
				if(api.row > 1 && api.col == 1) {
					y = frame * api.h;
				}
			}
			else {
				var x = api.x;
				var y = api.y;
			}
			rotation = typeof rotation !== 'undefined' ? rotation : 0;
			ctx.save();
			if(rotation == 0) {
				ctx.drawImage(api.img, x, y, api.w, api.h, posX, posY, api.w * scaleX, api.h * scaleY);
			}
			else {
				ctx.translate(posX + api.w * scaleX / 2, posY + api.h * scaleY / 2);
				ctx.rotate(rotation);
				ctx.drawImage(api.img, x, y, api.w, api.h, -api.w * scaleX / 2, -api.h * scaleY/ 2, api.w * scaleX, api.h * scaleY);
			}
			ctx.restore();
		}
		return api;
	}
	
	function kbInteraction() {
		window.addEventListener('keydown', function(event){
			if (event.keyCode === 37) {
				inputStates.left = true;
			} else if (event.keyCode === 38) {
				inputStates.up = true;
			} else if (event.keyCode === 39) {
				inputStates.right = true;
			} else if (event.keyCode === 40) {
				inputStates.down = true;
			}  else if (event.keyCode === 32) {
				inputStates.space = true;
			}
		}, false);
		window.addEventListener('keyup', function(event){
			if (event.keyCode === 37) {
				inputStates.left = false;
			} else if (event.keyCode === 38) {
				inputStates.up = false;
			} else if (event.keyCode === 39) {
				inputStates.right = false;
			} else if (event.keyCode === 40) {
				inputStates.down = false;
			} else if (event.keyCode === 32) {
				inputStates.space = false;
			}
		}, false);
	}

	function Ship() {
		this.then = performance.now();
		this.frameInterval = 67;
		this.timeSinceRedraw = 0;
		this.move = function() {
			if(inputStates.left == true || inputStates.right == true) {
				var now = performance.now();
				var difference = now - this.then;
				var distance = (ship.speed * difference) / 1000;
				if(inputStates.left == true) {
					ship.moving = true;
					ship.direction = 'left';
					if(ship.x - distance > 0) {
						ship.x -= distance;
					}
				}
				if(inputStates.right == true) {
					ship.moving = true;
					ship.direction = 'right';
					if(ship.x + ship.width + distance < w) {
						ship.x += distance;
					}
				}
			}
			if(inputStates.left == false && inputStates.right == false) {
				ship.moving = false;
				ship.direction = '';
			}
		};
		this.draw = function() {
			this.move();
			var posX = ship.x;
			var posY = ship.y;
			var scaleX = 1;
			var scaleY = 1;
			var flameX = posX + 17;
			var flameY = posY + 63;
			var now = performance.now();
			var difference = now - this.then;
			if(this.timeSinceRedraw > this.frameInterval) {
				var flameFrame = Math.floor(Math.random() * (imgs.flame.r.frames));
				this.timeSinceRedraw = 0;
			}
			else {
				this.timeSinceRedraw += difference;
			}
			imgs.ship.r.render(posX, posY, scaleX, scaleY, 0);
			imgs.flame.r.render(flameX, flameY, scaleX, scaleY, flameFrame);
			this.then = now;
		}
	}

	function Back() {
		this.stars = [];
		this.maxStars = back.stars;
		this.draw = function() {
			imgs.back.r.render(0, 0, 1, 1, 0);
			if(this.stars.length < this.maxStars) {
				this.generateStars(this.maxStars);
			}
			var starsLen = this.stars.length;
			for(i = 0; i < starsLen; i++) {
				this.stars[i].draw();
			}
		}
		this.generateStars = function(number) {
			for(i = 0; i < number; i++) {
				var star = new Star();
				this.stars.push(star);
			}
		}
	}
	
	function Star() {
		this.x = 0;
		this.y = 0;
		this.r = 0;
		this.layer = 0;
		this.color = 'rgb(255, 255, 255)';
		this.move = function() {
			if(this.r == 0) {
				this.regenerate();
			}
			this.y += back.starSpeed * (this.layer / 10);
			if(this.y > h) {
				this.regenerate();
			}
			if(ship.moving) {
				if(ship.direction == 'left') {
					this.x += .5 * (this.layer / 10);
				}
				else {
					this.x -= .5 * (this.layer / 10);
				}
			}
		};
		this.draw = function() {
			this.move();
			ctx.save();
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, 2*Math.PI);
			ctx.fillStyle = this.color;
			ctx.fill();
			ctx.restore();
		};
		this.regenerate = function(){
			this.x = parseInt(Math.random() * w + 1);
			if(this.r == 0) {
				this.y = parseInt(Math.random() * h);
			}
			else {
				this.y = -5;
			}
			this.r = 1;
			this.layer = parseInt(Math.random() * 10 + 1);
			this.color = 'rgba('+ parseInt(Math.random() * 128 + 128) + ', ' + parseInt(Math.random() * 128 + 128) + ', ' + parseInt(Math.random() * 128 + 128) + ', ' + this.layer / 10 + ')';
		};
	}
	
	function Comets() {
		this.comets = [];
		this.maxComets = cometInfo.maxComets;
		this.then = performance.now();
		this.generateComets = function(number) {
			for(i = 0; i < number; i++) {
				var now = performance.now();
				if(now - this.then > 1000) {
					var x = Math.random() * w;
					var y = -5;
					var speed = cometInfo.speed * (Math.random() +1);
					var angle = Math.random() * cometInfo.angleVar + cometInfo.angleMin;
					var rotation = Math.random() * cometInfo.rotSpeedRadSec * 2 - cometInfo.rotSpeedRadSec;
					var size = cometInfo.sizeBig;
					var comet = new Comet(x, y, speed, angle, size, rotation);
					this.comets.push(comet);
					this.then = now;
				}
			}
		}
		this.draw = function() {
			var cometsLen = this.comets.length;
			if(cometsLen < this.maxComets) {
				this.generateComets(1);
			}
			//Collision detection.
			for(i = 0; i < cometsLen; i++) {
				if(this.comets[i]) {
					this.comets[i].move();
					this.comets[i].draw();
				}
			}
			//remove comets that passed out of cavas height (in separate loop not to mess with modifying comets array while draw)
			for(i = 0; i < cometsLen; i++) {
				if(this.comets[i] && this.comets[i].y > h) {
					this.comets.splice(i, 1);
					this.generateComets(1);
				}
			}
		}
	}
	
	function Comet(x, y, speed, angle, size, rotation) {
		this.x = x;
		this.y = y;
		this.v = speed;
		this.a = angle * (Math.PI / 180);
		this.r = size / 2;
		this.rotSpeed = rotation;
		this.rotPos = 0;
		//this.color = '#333';
		this.img = imgs.asteroid.r;
		this.scale = size / images.asteroid.w;
		this.then = performance.now();
		this.draw = function() {
			//if(this.rotSpeed == 0) {
				//console.log(this.rotPos);
				this.img.render(this.x - this.r, this.y - this.r, this.scale, this.scale, 0, this.rotPos);
			/*}
			else {
				ctx.save();
				ctx.restore();
			}*/
			var now = performance.now();
			this.then = now;
		};
		this.move = function() {
			var now = performance.now();
			var difference = now - this.then;
			var distance = this.v * difference / 1000;
			if(this.rotSpeed != 0) {
				var rotDif = this.rotSpeed * difference / 1000;
				this.rotPos += rotDif;
			}
			//console.log(this.rotPos);
			if(ship.moving) {
				if(ship.direction == 'left') {
					this.x += distance * Math.cos(this.a) + (ship.speed * difference / 1000) * 0.5;
				}
				else {
					this.x += distance * Math.cos(this.a) - (ship.speed * difference / 1000) * 0.5;
				}
			}
			else {
				this.x += distance * Math.cos(this.a);
			}
			this.y += distance * Math.sin(this.a);
		}
	}

	var mainLoop = function(time) {
		clearCanvas();
		fpsMeter(time);
		if(resourcesLoaded) {
			background.draw();
			shipObj.draw();
			cometCloud.draw();
		}
		requestAnimationFrame(mainLoop);
	};

	var start = function() {
		fpsContainer = document.getElementById('fps-meter');
		canvas = document.querySelector("#game");
		w = canvas.width;
		h = canvas.height;
		ship.x = w / 2 - ship.width / 2;
		ship.y = h  - ship.width;
		ctx = canvas.getContext('2d');
		loadImages();
		kbInteraction();
		shipObj = new Ship();
		background = new Back();
		cometCloud = new Comets();
		requestAnimationFrame(mainLoop);
	};

	return {
		start: start,
	}
}

window.onload = function init() {
	var game = new G();
	game.start();
}