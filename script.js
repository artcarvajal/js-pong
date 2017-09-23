(function(){
///////////////////////////////////////////////////
///////////////////// globals /////////////////////
///////////////////////////////////////////////////
var padding = 50;
var colors = {
  background: 'rgba(1,32,26,0.5)',
  elements: 'rgba(132,228,174,1)',
  hudFontBright: 'rgba(132,228,174,1)',
  hudFontDark: 'rgba(1, 8, 4, 0.5)',
  foreBG: 'rgba(1, 16, 13, 0.5)'
}

// set up screen dimension globals and canvas/canvasRenderingContext globals
var screenWidth = innerWidth;
var screenHeight = innerHeight;

// canvas and canvas context
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// set the canvas width and height intially; also will be set during screen resizes
canvas.width = screenWidth;
canvas.height = screenHeight;

////////////////////////////////////////////////////////
///////////////////// constructors /////////////////////
////////////////////////////////////////////////////////

///////////////////// player /////////////////////
function Player(num) {
  this.num = num;                   // player numbers
  this.width = 10;                  // paddle dimensions
  this.height = 100;
  this.speed = 10;                  // max paddle speed
  this.points = 0;
  this.pressed = {up: 0, down: 0};  // keep track of what directions are currently pressed

  this.x;                                   // the paddle x value, which will not change
  if (num == 1) { this.x = padding; }       // adjust the paddle position to take into account the game field padding to the window border
  else { this.x = screenWidth - padding; }
  this.y = screenHeight / 2;                // start each player in the middle of the screen

  this.bBox = {                         // player paddle bounding boxes
    top: this.y - this.height / 2, 
    bottom: this.y + this.height / 2,
    left: this.x - this.width / 2,
    right: this.x + this.width / 2
  }

  this.setBBox = function() {                     // update the bounding box for the player
    this.bBox.top = this.y - this.height / 2;
    this.bBox.bottom = this.y + this.height / 2;
    this.bBox.left = this.x - this.width / 2;
    this.bBox.right = this.x + this.width / 2;
  }

  this.move = function(dir){                // sets and constrains the player's y position
    if (dir == 'up' && this.bBox.top > 0){
      this.y -= this.speed;
    }
    else if (dir == "down" && this.bBox.bottom < screenHeight) {
      this.y += this.speed
    }
    this.setBBox();
  };
}

///////////////////// ball /////////////////////
function Ball() {
  this.scored = false;                  // bool to keep track of whether a point has been scored this round (the ball doesn't move for a specified time after a point has been scored)
  this.r = 10;                          // ball dimensions
  this.width = this.r * 2;              
  this.height = this.r * 2;
  this.x = screenWidth / 2;    // ball coords
  this.y = screenHeight / 2;

  this.randomDir = function(){ return (Math.PI * Math.ceil(Math.random() * 5)) / 12; }; // set a random initial direction
  this.lastDir = 1;                                     // the side of the game board toward which the ball moved first during the last round; swaps for every point scored
  this.dir = this.randomDir() * this.lastDir;           
  this.initVelocity = 8;                                // velocity and acceleration
  this.velocity = this.initVelocity;
  this.hitAccel = 0.5;
  this.xSpeed = this.velocity * Math.cos(this.dir);
  this.ySpeed = this.velocity * Math.sin(this.dir);

  this.bBox = {                         // ball bounding box
    top: this.y - this.height / 2, 
    bottom: this.y + this.height / 2,
    left: this.x - this.width / 2,
    right: this.x + this.width / 2
  }

  this.setBBox = function() {   // update the bounding box for the player
    this.bBox.top = this.y - this.height / 2;
    this.bBox.bottom = this.y + this.height / 2;
    this.bBox.left = this.x - this.width / 2;
    this.bBox.right = this.x + this.width / 2;
  }

  this.move = function(){     // move the ball
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.setBBox();
  };

  this.reset = function(){              // reset the ball position, velocity, and acceleration; called after every point scored
    this.x = screenWidth / 2;           // used in combination with the restart method below; reset is called first, then restart is called after a short delay
    this.y = screenHeight / 2;
    this.velocity = this.initVelocity;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.lastDir = this.lastDir === 0 ? Math.PI : 0;
    this.scored = false;
    this.dir = this.randomDir() + this.lastDir;
  };

  this.restart = function(){                            // this actually starts the ball moving again
    this.xSpeed = this.velocity * Math.cos(this.dir);   // used in combination with the reset method above; reset is called first, then restart is called after a short delay
    this.ySpeed = this.velocity * Math.sin(this.dir);
  };

  this.checkCollision = function(other) {           // check for collisions; uses simple collision detection on a square bounding box 
    if (this.bBox.right > other.bBox.left &&        // if the bounding boxes overlap, a collision is registered
        this.bBox.left < other.bBox.right &&
        this.bBox.top < other.bBox.bottom &&
        this.bBox.bottom > other.bBox.top) {
      if ((this.xSpeed < 0 && this.x > other.x)||(this.xSpeed > 0 && this.x < other.x)) {       // if the ball is moving left and is to the right of the other, or is moving right and located left of the other
        if (Math.abs(this.xSpeed) < 12) {                                                       // cap speed at 12 pixels per frame,
          this.xSpeed += this.xSpeed < 0 ? -this.hitAccel : this.hitAccel;                      // add or subtract the hit acceleration modifier (depending on current direction)
        }
        this.xSpeed *= -1;                                                                      // reverse the x speed for left or right side collisions
        if ((this.y > other.y + other.height / 4 || this.y < other.y - other.height / 4) && this.ySpeed < 12) {       // register extreme top or bottom side collisions; cap speed at 12 pixels per frame
          this.ySpeed += this.ySpeed < 0 ? -this.hitAccel * 2 : this.hitAccel * 2;                                    // add or subtract hit acceleration x2
        }
      }
      else if ((this.ySpeed < 0 && this.y > other.y)||(this.ySpeed > 0 && this.y < other.y)) {    // register regular top or bottom side collisions; no additional acceleration modifier required, because a score is inevitable
        this.ySpeed *= -1;
      }
      audio.play(audio.hitPaddle);        // play the hitPaddle sound
    }
  }
}

///////////////////// sound source /////////////////////
function SoundSource() {
  var self = this;

  ///////////////////// initial setup /////////////////////
  this.ctx = new (window.AudioContext || window.webkitAudioContext)();  // define audio context
  this.gainNode = this.ctx.createGain();                                // create a gain node
  this.gainNode.gain.value = 0.05;                                      // set the node's initial value
  this.gainNode.connect(this.ctx.destination);                          // connect the node
  
  ///////////////////// when ball meets paddle /////////////////////
  this.hitPaddle = this.ctx.createOscillator();
  this.hitPaddle.type = 'sine';
  this.hitPaddle.frequency.value = 1600; // value in hertz
  this.hitPaddle.start();

  ///////////////////// when ball meets wall /////////////////////
  this.hitWall = this.ctx.createOscillator();
  this.hitWall.type = 'sine';
  this.hitWall.frequency.value = 300;
  this.hitWall.start();

  ///////////////////// when a point is scored /////////////////////
  this.score = this.ctx.createOscillator();
  this.score.type = 'sine';
  this.score.frequency.value = 1000;
  this.score.start();

  this.play = function(o) {       // play a sound
    o.connect(this.gainNode);
    setTimeout(this.stop, 30, o);
  }
  this.stop = function(o) {       // stop a sound
    o.disconnect(this.gainNode);
  }
}

// pause automatically when the game window loses focus
window.addEventListener('blur', function(e){
  if (!title) {
    paused = true;
    help = false;
  }
})

///////////////////// key presses /////////////////////
addEventListener('keydown', function(e){
  switch (e.keyCode) {
    case 32:                // spacebar to start or pause
      e.preventDefault();
      help = false;
      if (title) {
        paused = false;
        title = false;
        start = Date.now();
      }
      else {
        paused = !paused;
      }
      break;
    case 72:                // H for help menu
      e.preventDefault();
      help = !help;
      /*
      if (!help) { help = true; }
      else { 
        help = false; 
        paused = false;
      }*/
      break;
    case 87:                // p1 up
      e.preventDefault();
      p1.pressed.up = 1;
      break;
    case 83:                // p1 down
      e.preventDefault();
      p1.pressed.down = 1;
      break;
    case 38:                // p2 up
      e.preventDefault();
      p2.pressed.up = 1;
      break;
    case 40:                // p2 down
      e.preventDefault();
      p2.pressed.down = 1;
      break;
  }
})

///////////////////// key releases ///////////////////////
// used to keep track of whether or not a player has    //
// released a directional key, which prevents unusual   //
// behavior when multiple directional inputs are        //
// received simultaneously                              //
//////////////////////////////////////////////////////////
addEventListener('keyup', function(e){
  e.preventDefault();
  switch (e.keyCode) {
    case 87: //p1 up
      p1.pressed.up = 0;
      break;
    case 83: //p1 down
      p1.pressed.down = 0;
      break;
    case 38: //p2 up
      p2.pressed.up = 0;
      break;
    case 40: //p2 down
      p2.pressed.down = 0;
      break;
  }
})

///////////////////// resize ///////////////////////
// on window resize, resize the game field, scale //
// the position of the ball and paddles, resize   //
// the canvas, and re-render the scene            //
////////////////////////////////////////////////////
addEventListener('resize', function(){
  if (!paused && !title) {paused = true;}
  scalePosition(ball);
  scalePosition(p1);
  scalePosition(p2);

  canvas.height = screenHeight;
  canvas.width = screenWidth;

  screenWidth = innerWidth;
  screenHeight = innerHeight;

  renderScene();
})

// initialize all game elements
var p1 = new Player(1);
var p2 = new Player(2);
var ball = new Ball();
var audio = new SoundSource();
var title = true;
var paused = false;
var help = false;
var start;

/////////////////////////////////////////////////////////////
///////////////////// utility functions /////////////////////
/////////////////////////////////////////////////////////////

// scales an object's position and bounding box based on the window dimensions
function scalePosition(obj) {
  obj.x = (obj.x / screenWidth) * innerWidth;
  obj.y = (obj.y / screenHeight) * innerHeight;
  obj.setBBox();
}

// draws a scene to the canvas
function renderScene() {
  //clear the background -- colors.background has a 0.5 opaciy to allow for a blur effect
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  //draw the background grid lines -- colors.foreBG has a matching opacity to the background to prevent graphical glitches
  var gridLines = 6;
  var gridLineWidth = 2;
  var gridSpacingHor = screenWidth / gridLines;
  var gridSpacingVert = screenHeight / gridLines;
  ctx.fillStyle = colors.foreBG;
  var fonts = {
    large: '58px Courier New',
    medium: '48px Courier New',
    medSmall: '38px Courier New',
    small: '28px Courier New'
  };

  //DON'T FORGET: fillRect takes a starting x and y position AND A WIDTH AND HEIGHT (NOT A TERMINATING X AND Y POSITION)
  for (var i = 0; i < gridLines; i++) {
    ctx.fillRect((i * gridSpacingHor) - gridLineWidth, 0, gridLineWidth, screenHeight);
  }
  for (var i = 0; i < gridLines; i++) {
    ctx.fillRect(0, (i * gridSpacingVert) - gridLineWidth, screenWidth, gridLineWidth);
  }

  //draw player scores
  ctx.font = fonts.medium;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.hudFontBright;
  ctx.fillText(p1.points, screenWidth / 2 - 40, 50);
  ctx.fillText(p2.points, screenWidth / 2 + 40, 50);

  //draw paddles and ball
  ctx.fillStyle = colors.elements;
  ctx.fillRect(p1.x - p1.width / 2, p1.y - p1.height / 2, 
               p1.width, p1.height);
  ctx.fillRect(p2.x - p2.width / 2, p2.y - p2.height / 2, 
               p2.width, p2.height);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  //draw the help screen
  if (help) {
    ctx.font = fonts.large;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.hudFontBright;
    ctx.fillText('Help', screenWidth / 2, screenHeight / 2 - 60);
    ctx.font = fonts.small;
    ctx.fillText('Player 1: W and S', screenWidth / 2, screenHeight / 2 + 60);
    ctx.fillText('Player 2: up and down arrows', screenWidth / 2, screenHeight / 2 + 120);
    ctx.fillText('Spacebar to pause, H for help screen', screenWidth / 2, screenHeight / 2 + 180);
  }
  //draw title screen
  else {
    if (title) {
      ctx.font = fonts.large;
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.hudFontBright;
      ctx.fillText('Pong', screenWidth / 2, screenHeight / 2 - 60);
      ctx.font = fonts.medSmall;
      ctx.fillText('Press spacebar to begin', screenWidth / 2, screenHeight / 2 + 60);
      ctx.fillText('Press H for help', screenWidth / 2, screenHeight / 2 + 120);
    }
    //draw the pause screen
    if (paused) {
      ctx.font = fonts.large;
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.hudFontBright;
      ctx.fillText('Paused', screenWidth / 2, screenHeight / 2 - 60);
      ctx.font = fonts.medSmall
      ctx.fillText('Press spacebar to unpause', screenWidth / 2, screenHeight / 2 + 60);
      ctx.fillText('Press H for help', screenWidth / 2, screenHeight / 2 + 120);
    }
  }
}

///////////////////// called when a player scores /////////////////////
function scorePoint(player) {
  ball.scored = true;
  player.points++;
  audio.play(audio.score);
  setTimeout(function(){ball.reset.apply(ball)}, 2000);
  setTimeout(function(){ball.restart.apply(ball)}, 3000);
}

///////////////////// main game loop /////////////////////
function gameLoop() {
  if (!paused && !help && !title && Date.now() - start > 2000) {    // if not paused, and the help screen is not showing, and it's been more than 2 seconds since start was updated
    if (p1.pressed.up) { p1.move('up'); }           // move players if their movement flags are set
    if (p1.pressed.down) { p1.move('down'); }
    if (p2.pressed.up) { p2.move('up'); }
    if (p2.pressed.down) { p2.move('down'); }

    //check for window border collisions
    if (ball.y - ball.r + ball.ySpeed <= 0 || ball.y + ball.r + ball.ySpeed >= screenHeight) {
      ball.ySpeed *= -1;
      audio.play(audio.hitWall);
    }

    // check for paddle collisions, only when necessary
    if (ball.x - ball.r + ball.xSpeed < padding + p1.width) { ball.checkCollision(p1); }
    else if (ball.x > screenWidth - padding - p2.width) { ball.checkCollision(p2); }

    // check for scored points based on ball position and state
    if (ball.x - ball.r * 2 < ball.r * -2 && !ball.scored) { scorePoint(p2); }
    if (ball.x + ball.r * 2 > screenWidth + ball.r * 2 && !ball.scored) { scorePoint(p1); }

    // move the ball if a point hasn't been scored
    if (!ball.scored) { ball.move(); }
  }

  // render the scene
  renderScene();

  // get the next animation frame
  requestAnimationFrame(gameLoop);
}

// begin the game!
gameLoop();
})();