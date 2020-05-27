(function() {

	/**************** THE GAME *****************/
	// Constructor Function
	var Game = function(canvasId){

		var canvas = document.getElementById(canvasId);
		// Get the drawing context
		var screen = canvas.getContext('2d');
		var gameSize = { x: canvas.width, y: canvas.height};

		/*
		 * The main bodies in the game are the players, the invaders and the bullets
		 * So we will create a bodies array
		 */

		this.bodies = createInvaders(this).concat(new Player(this, gameSize));
		var self = this;

		loadSound("shoot.wav", function(shootSound){

			self.shootSound = shootSound;
			// tick will run about 60 times a second
			// tick is responsible for running all the game logic
			var tick = function() {
				self.update();
				self.draw(screen, gameSize);
				requestAnimationFrame(tick);
			};

			tick();
		});
		
	};


	Game.prototype = {

		update: function() {

			var bodies = this.bodies;

			var notCollidingWithAnything = function(b1) {
				return bodies.filter(function(b2) {
					return colliding(b1,b2);
				}).length === 0;
			};

			this.bodies = this.bodies.filter(notCollidingWithAnything);
			for(var i=0;i< this.bodies.length;i++) {
				this.bodies[i].update();
			}
		},

		// Players, Invadors and Bullets - All will be drawn as black rectangles
		draw: function(screen, gameSize) {
			screen.clearRect(0, 0, gameSize.x, gameSize.y);
			for(var i=0;i< this.bodies.length;i++) {
				drawRect(screen, this.bodies[i]);
			}

		},

		addBody: function(body) {
			this.bodies.push(body);
		},

		// Do not release bullets if invaders are below
		invadersBelow: function(invader) {
			return this.bodies.filter(function(b){
				return b instanceof Invader &&
				      b.center.y > invader.center.y &&
				      b.center.x - invader.center.x < invader.size.x;
			}).length > 0;
		}
	};

	/****** BODIES IN THE GAME ***********/

	/************* 1. PLAYER *************/
	// Player constructor function
	var Player = function(game, gameSize) {
		this.game = game;
		this.size = { x:15, y:15};
		this.center =  { x: gameSize.x/2, y: gameSize.y - this.size.y};
		this.keyboarder = new Keyboarder();
	}

	// those functions are added here which are needed onl once for all the objects
	Player.prototype = {

		// Our key presses updates the player. the plyer 
		// then delegates the updates to others , so that they can update their statuses
		update: function() {

			// Move Left
			if(this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
				this.center.x -= 2;
			}
			// Move right
			else if(this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
				this.center.x += 2;
			}
			// Fire bullets on clicking space
			else if(this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {
				var bullet = new Bullet({ x: this.center.x, y: this.center.y - this.size.x*2}, { x: 0, y: -6});

				this.game.addBody(bullet);
				this.game.shootSound.load();
				this.game.shootSound.play();
			}


		}
	}

	/**************** 2. BULLET *****************/

	var Bullet = function(center, velocity) {
		
		this.size = { x:3, y:3};
		this.center =  center;
		this.velocity = velocity;
	}

	
	Bullet.prototype = {

		update: function() {

			this.center.x += this.velocity.x;
			this.center.y += this.velocity.y;


		}
	}
	/**************** 3. INVADER *****************/

	// Invader constructor function
	var Invader = function(game, center) {
		this.game = game;
		this.size = { x:15, y:15};
		this.center =  center;
		this.patrolX = 0;
		this.speedX = 0.3;
		
	}

	// those functions are added here which are needed onl once for all the objects
	Invader.prototype = {

		// Our key presses updates the player. the plyer 
		// then delegates the updates to others , so that they can update their statuses
		update: function() {

			if(this.patrolX < 0 || this.patrolX > 40) {
					this.speedX = -this.speedX;
				}

				this.center.x += this.speedX;
				this.patrolX += this.speedX;

				if(Math.random() > 0.995 && !this.game.invadersBelow(this)) {

					var bullet = new Bullet({ x: this.center.x, y: this.center.y + this.size.x*2}, { x: Math.random() - 0.5, y: 2});
					this.game.addBody(bullet);
				}
				

		}
	}

	// Create many invaders

	var createInvaders = function(game) {
		var invaders = [];

		for (var i=0; i<24; i++) {
			var x = 30 + (i%8)*30;
			var y = 30 + (i%3)*30;
			invaders.push(new Invader(game, { x: x, y: y}));

		}

		return invaders;
	}

    // Lets DRAW - Utility function to draw rectangle

    var drawRect = function(screen, body ) {

    	screen.fillRect(body.center.x - body.size.x/2,body.center.y - body.size.x/2, body.size.x, body.size.y );
    }


    // Lets make the MOVE - tells abt the keys pressed

    var Keyboarder = function() {
    	var keyState = {};

    	window.onkeydown = function(e) {
    		keyState[e.keyCode] = true;
    	}

    	window.onkeyup = function(e) {
    		keyState[e.keyCode] = false;
    	}

    	this.isDown = function(keyCode) {
    		return keyState[keyCode] === true;
    	}

    	this.KEYS = { LEFT: 37, RIGHT: 39, SPACE: 32};

    }
	
	// lets check for collision

	var colliding = function(b1,b2) {

		return !(b1 === b2 ||
				 b1.center.x + b1.size.x/2 < b2.center.x - b2.size.x / 2 ||
				 b1.center.y + b1.size.y /2 < b2.center.y - b2.size.y / 2 ||
				 b1.center.x - b1.size.x/2 > b2.center.x + b2.size.x / 2 ||
				 b1.center.y - b1.size.y/2 > b2.center.y + b2.size.y / 2 );
	};
	
	var loadSound = function(url, callback) {
		var sound = new Audio(url);
		var loaded = function() {
			callback(sound);

			sound.removeEventListener('canplaythrough', loaded);
		}
		sound.addEventListener('canplaythrough', loaded);
		sound.load();
	};

	//Instantiate the game once the DOM is read with the canvas
	window.onload = function() {
		new Game("screen");
	}
})();