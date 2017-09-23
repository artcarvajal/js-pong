// define globals
var padding = 50;
var colors = {
  background: "rgba(1,32,26,0.5)",
  elements: "rgba(132,228,174,1)",
  hudFontBright: "rgba(132,228,174,1)",
  hudFontDark: "rgba(1, 8, 4, 0.5)",
  foreBG: "rgba(1, 16, 13, 0.5)"
}

// set up screen dimension globals and canvas/canvasRenderingContext globals
var screenWidth = innerWidth;
var screenHeight = innerHeight;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

canvas.width = screenWidth;
canvas.height = screenHeight;

// constructor for each player
function Player(num) {
  this.num = num;       // player numbers
  this.width = 10;
  this.height = 100;
  this.speed = 10;
  this.points = 0;
  this.pressed = {up: 0, down: 0};

  this.x;
  if (num == 1) { this.x = padding; }
  else { this.x = screenWidth - padding; }
  this.y = screenHeight / 2;

  this.bBox = {
    top: this.y - this.height / 2, 
    bottom: this.y + this.height / 2,
    left: this.x - this.width / 2,
    right: this.x + this.width / 2,
    collisions: {
      top: false,
      bottom: false,
      left: false,
      right: false
    }
  }

  this.setBBox = function() {
    this.bBox.top = this.y - this.height / 2;
    this.bBox.bottom = this.y + this.height / 2;
    this.bBox.left = this.x - this.width / 2;
    this.bBox.right = this.x + this.width / 2;
  }

  this.move = function(dir){
    if (dir == "up" && this.bBox.top > 0){
      this.y -= this.speed;
    }
    else if (dir == "down" && this.bBox.bottom < screenHeight) {
      this.y += this.speed
    }
    this.setBBox();
  };
}

// constructor for the ball
function Ball() {
  this.scored = false;
  this.r = 10;
  this.width = this.r * 2;
  this.height = this.r * 2;
  this.x = screenWidth / 2 - this.r;
  this.y = screenHeight / 2 - this.r;

  this.randomDir = function(){ return (Math.PI * Math.ceil(Math.random() * 5)) / 12; };
  this.lastDir = 1;
  this.dir = this.randomDir() * this.lastDir;
  this.initVelocity = 8;
  this.velocity = this.initVelocity;
  this.hitAccel = 0.5;
  this.xSpeed = this.velocity * Math.cos(this.dir);
  this.ySpeed = this.velocity * Math.sin(this.dir);

  this.bBox = {
    top: this.y - this.height / 2, 
    bottom: this.y + this.height / 2,
    left: this.x - this.width / 2,
    right: this.x + this.width / 2,

    collisions: {
      top: false,
      bottom: false,
      left: false,
      right: false
    }
  }

  this.setBBox = function() {
    this.bBox.top = this.y - this.height / 2;
    this.bBox.bottom = this.y + this.height / 2;
    this.bBox.left = this.x - this.width / 2;
    this.bBox.right = this.x + this.width / 2;
  }

  this.move = function(){
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.setBBox();
  };

  this.reset = function(){
    this.x = screenWidth / 2;
    this.y = screenHeight / 2;
    this.velocity = this.initVelocity;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.lastDir = this.lastDir === 0 ? Math.PI : 0;
    this.scored = false;
    this.dir = this.randomDir() + this.lastDir;
  };

  this.restart = function(){
    this.xSpeed = this.velocity * Math.cos(this.dir);
    this.ySpeed = this.velocity * Math.sin(this.dir);
  };

  this.checkCollision = function(other) {
    if (this.bBox.right > other.bBox.left &&
        this.bBox.left < other.bBox.right &&
        this.bBox.top < other.bBox.bottom &&
        this.bBox.bottom > other.bBox.top) {
      if ((this.xSpeed < 0 && this.x > other.x)||(this.xSpeed > 0 && this.x < other.x)) {
        if (Math.abs(this.xSpeed) < 12) {
          this.xSpeed += this.xSpeed < 0 ? -this.hitAccel : this.hitAccel;
        }
        this.xSpeed *= -1;
        if ((this.y > other.y + other.height / 4 || this.y < other.y - other.height / 4) && this.ySpeed < 12) {
          this.ySpeed += this.ySpeed < 0 ? -this.hitAccel * 2 : this.hitAccel * 2;
        }
      }
      else if ((this.ySpeed < 0 && this.y > other.y)||(this.ySpeed > 0 && this.y < other.y)) {
        this.ySpeed *= -1;
      }
      audio.play(audio.hitPaddle);
    }
  }
}

// set up the constructor for sound sources
function SoundSource() {
  var self = this;
  this.ctx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context
  this.gainNode = this.ctx.createGain();
  this.gainNode.gain.value = 0.05;
  this.gainNode.connect(this.ctx.destination);
  
  this.hitPaddle = this.ctx.createOscillator();
  this.hitPaddle.type = "sine";
  this.hitPaddle.frequency.value = 1600; // value in hertz
  this.hitPaddle.start();

  this.hitWall = this.ctx.createOscillator();
  this.hitWall.type = "sine";
  this.hitWall.frequency.value = 300;
  this.hitWall.start();

  this.score = this.ctx.createOscillator();
  this.score.type = "sine";
  this.score.frequency.value = 1000;
  this.score.start();

  this.play = function(o) {
    o.connect(this.gainNode);
    setTimeout(this.stop, 30, o);
  }
  this.stop = function(o) {
    o.disconnect(this.gainNode);
  }
}

window.addEventListener("blur", function(e){
  if (!title) {
    paused = true;
    help = false;
  }
})

addEventListener("keydown", function(e){
  switch (e.keyCode) {
    case 32: //spacebar to start or pause
      e.preventDefault();
      if (title) {
        help = false;
        paused = false;
        title = false;
        start = startTime();
      }
      else {
        if (paused) { 
          paused = false; 
          help = false;
        }
        else { 
          paused = true; 
          help = false;
        }
      }
      break;
    case 72: //H for help menu
      e.preventDefault();
      if (!help) { help = true; }
      else { 
        help = false; 
        paused = false;
      }
      break;
    case 87: //p1 up
      e.preventDefault();
      p1.pressed.up = 1;
      break;
    case 83: //p1 down
      e.preventDefault();
      p1.pressed.down = 1;
      break;
    case 38: //p2 up
      e.preventDefault();
      p2.pressed.up = 1;
      break;
    case 40: //p2 down
      e.preventDefault();
      p2.pressed.down = 1;
      break;
  }
})

addEventListener("keyup", function(e){
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

addEventListener("resize", function(){
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

var p1 = new Player(1);
var p2 = new Player(2);
var ball = new Ball();
var audio = new SoundSource();
var title = true;
var paused = false;
var help = false;
var start;

function startTime() {
  return Date.now();
}

function scalePosition(obj) {
  obj.x = (obj.x / screenWidth) * innerWidth;
  obj.y = (obj.y / screenHeight) * innerHeight;
  obj.setBBox();
}

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

  //DON'T FORGET: fillRect takes a starting x and y position AND A WIDTH AND HEIGHT (NOT A TERMINATING X AND Y POSITION)
  for (var i = 0; i < gridLines; i++) {
    ctx.fillRect((i * gridSpacingHor) - gridLineWidth, 0, gridLineWidth, screenHeight);
  }
  for (var i = 0; i < gridLines; i++) {
    ctx.fillRect(0, (i * gridSpacingVert) - gridLineWidth, screenWidth, gridLineWidth);
  }

  //draw player scores
  ctx.font = "48px Courier New";
  ctx.textAlign = "center";
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
    ctx.font = "58px Courier New";
    ctx.textAlign = "center";
    ctx.fillStyle = colors.hudFontBright;
    ctx.fillText("Help", screenWidth / 2, screenHeight / 2 - 60);
    ctx.font = "28px Courier New";
    ctx.fillText("Player 1: W and S", screenWidth / 2, screenHeight / 2 + 60);
    ctx.fillText("Player 2: up and down arrows", screenWidth / 2, screenHeight / 2 + 120);
    ctx.fillText("Spacebar to pause, H for help screen", screenWidth / 2, screenHeight / 2 + 180);
  }
  //draw title screen
  else {
    if (title) {
      ctx.font = "58px Courier New";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.hudFontBright;
      ctx.fillText("Pong", screenWidth / 2, screenHeight / 2 - 60);
      ctx.font = "38px Courier New";
      ctx.fillText("Press spacebar to begin", screenWidth / 2, screenHeight / 2 + 60);
      ctx.font = "38px Courier New";
      ctx.fillText("Press H for help", screenWidth / 2, screenHeight / 2 + 120);
    }
    //draw the pause screen
    if (paused) {
      ctx.font = "58px Courier New";
      ctx.textAlign = "center";
      ctx.fillStyle = colors.hudFontBright;
      ctx.fillText("Paused", screenWidth / 2, screenHeight / 2 - 60);
      ctx.font = "38px Courier New";
      ctx.fillText("Press spacebar to unpause", screenWidth / 2, screenHeight / 2 + 60);
      ctx.fillText("Press H for help", screenWidth / 2, screenHeight / 2 + 120);
    }
  }
}

function gameLoop() {
  if (!paused && !help && !title && Date.now() - start > 2000) {
    if (p1.pressed.up) { p1.move("up"); }
    if (p1.pressed.down) { p1.move("down"); }
    if (p2.pressed.up) { p2.move("up"); }
    if (p2.pressed.down) { p2.move("down"); }

    //check for collisions
    if (ball.y - ball.r + ball.ySpeed <= 0 || ball.y + ball.r + ball.ySpeed >= screenHeight) {
      ball.ySpeed *= -1;
      audio.play(audio.hitWall);
    }
    ball.checkCollision(p1);
    ball.checkCollision(p2);

    if (ball.x - ball.r * 2 < ball.r * -2 && !ball.scored) {
      ball.scored = true;
      p2.points++;
      audio.play(audio.score);
      setTimeout(function(){ball.reset.apply(ball)}, 2000);
      setTimeout(function(){ball.restart.apply(ball)}, 3000);
    }

    if (ball.x + ball.r * 2 > screenWidth + ball.r * 2 && !ball.scored) {
      ball.scored = true;
      p1.points++;
      audio.play(audio.score);
      setTimeout(function(){ball.reset.apply(ball)}, 2000);
      setTimeout(function(){ball.restart.apply(ball)}, 3000);
    }

    if (!ball.scored) { ball.move(); }
  }

  renderScene();

  requestAnimationFrame(gameLoop);
}

gameLoop();