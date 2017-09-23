# Pong #
__The classic table tennis game, coded in JavaScript__

### [Play the Game](https://artcarvajal.github.io/pong) ###

## Basic Premise ##
Two players face off on opposite ends of a game field, with a ball between them.

The ball will start moving toward one player. The goal is to stop the ball reaching your side of the game field using your paddle.

## Thoughts ##
Utilizes the HTML5 `canvas` and `AudioContext` elements, as well as constructors for players and the ball, and the `requestAnimationFrame()` method for frame-by-frame logic and animation.

Particularly in my (simple) collision detection implementation, I found myself reaching back to my work with GameMaker and GML, where collisions are referenced between the current object and the 'other':

```
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
```

Collisions are only checked when necessary; here, that's when the ball is within a logical range of the paddle. Window border collisions are handled separately.