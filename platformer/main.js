var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas()
{
	canvas.width = canvas.width; 
	canvas.height = 520;
}
resizeCanvas();

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

var background = new Image();
background.src = "background.jpg";

var gameBackground = new Image();
gameBackground.src = "gamebg.jpg";

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;


var STATE_SPLASH = 0;
var STATE_GAME = 1;
var STATE_GAMEOVER = 2;
var STATE_LIFELOST = 3;
var gameState = STATE_SPLASH;

var highscore = localStorage.getItem("highscore");
if(highscore == null){
	highscore = 0; 
	localStorage.setItem("highscore", 0);
}

var heartImage = document.createElement("img");
heartImage.src = "lifepoints.png";

// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;

// load an image to draw
var chuckNorris = document.createElement("img");
chuckNorris.src = "hero.png";

var pandaPool = document.createElement("img");
pandaPool = "pandapool.png";


var player = new Player();
var keyboard = new Keyboard();
var bullets = [];
var enemies = [];

var LAYER_COUNT = level1.layers.length;
var LAYER_BACKGROUND = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 2;
var LAYER_OBJECT_ENEMIES = 3;
var LAYER_OBJECT_TRIGGERS = 4;
var LAYER_OBJECT_KEYS = 5; 
var LAYER_OBJECT_DOORS = 6; 
var LAYER_DEATHONTOUCH = 7;
var LAYER_MAX = 8;



var MAP = {tw: level1.width, th: level1.height};
var TILE = level1.tilewidth;
var TILESET_TILE = level1.tilesets[0].tilewidth;
var TILESET_PADDING = level1.tilesets[0].margin;
var TILESET_SPACING = level1.tilesets[0].spacing;
var TILESET_COUNT_X = level1.tilesets[0].columns;
var TILESET_COUNT_Y = level1.tilesets[0].tilecount / TILESET_COUNT_X;
var tileset = document.createElement("img");
tileset.src = level1.tilesets[0].image;





 // abitrary choice for 1m
var METER = TILE;
 // very exaggerated gravity (6x)
var GRAVITY = METER * 9.8 * 4;
 // max horizontal speed (10 tiles per second)
var MAXDX = METER * 10;
 // max vertical speed (15 tiles per second)
var MAXDY = METER * 15;
 // horizontal acceleration - take 1/2 second to reach maxdx
var ACCEL = MAXDX * 2;
 // horizontal friction - take 1/6 second to stop from maxdx
var FRICTION = MAXDX * 8;
 // (a large) instantaneous jump impulse
var JUMP = METER * 1500;

var ENEMY_MAXDX = METER * 5;
var ENEMY_ACCEL = ENEMY_MAXDX * 2;


var score = 0;

function cellAtPixelCoord(layer, x,y)
{
if(x<0 || x>SCREEN_WIDTH || y<0)
return 1;
// let the player drop of the bottom of the screen (this means death)
if(y>SCREEN_HEIGHT)
return 0;
return cellAtTileCoord(layer, p2t(x), p2t(y));
};

function triggerAtTileCoord(layer, tx, ty){
	if(tx < 0 || tx >= MAP.tw || ty < 0)
return 0;
// let the player drop of the bottom of the screen (this means death)
if(ty <0 || ty >= MAP.th)
return 0;
return cells[layer][ty][tx];
}

function cellAtTileCoord(layer, tx, ty)
{
if(tx < 0 || tx >= MAP.tw || ty < 0)
return 1;
// let the player drop of the bottom of the screen (this means death)
if(ty <0 || ty>=MAP.th)
return 0;
return cells[layer][ty][tx];
};
function tileToPixel(tile)
{
return tile * TILE;
};
function pixelToTile(pixel)
{
return Math.floor(pixel/TILE);
};
function bound(value, min, max)
{
if(value < min)
return min;
if(value > max)
return max;
return value;
}



function drawMap()
{
for(var layerIdx=0; layerIdx<LAYER_COUNT; layerIdx++)
{
var idx = 0;
for( var y = 0; y < level1.layers[layerIdx].height; y++ )
{
for( var x = 0; x < level1.layers[layerIdx].width; x++ )
{
if( level1.layers[layerIdx].data[idx] != 0 )
{
// the tiles in the Tiled map are base 1 (meaning a value of 0 means no tile), so subtract one from the tileset id to get the
// correct tile
var tileIndex = level1.layers[layerIdx].data[idx] - 1;
var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * (TILESET_TILE + TILESET_SPACING);
var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * (TILESET_TILE + TILESET_SPACING);
context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE, x*TILE, (y-1)*TILE, TILESET_TILE, TILESET_TILE);
}
idx++;
}
}
}
}

var musicBackround;
var sfxFire;

var cells = []; // the array that holds our simplified collision data
function initialize() {
 for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) { // initialize the collision map
 cells[layerIdx] = [];
 var idx = 0;
 for(var y = 0; y < level1.layers[layerIdx].height; y++) {
 cells[layerIdx][y] = [];
 for(var x = 0; x < level1.layers[layerIdx].width; x++) {
 if(level1.layers[layerIdx].data[idx] != 0) {
 // for each tile we find in the layer data, we need to create 4 collisions
 // (because our collision squares are 35x35 but the tile in the
// level are 70x70)
 cells[layerIdx][y][x] = 1;
cells[layerIdx][y-1][x] = 1;
cells[layerIdx][y-1][x+1] = 1;
cells[layerIdx][y][x+1] = 1;
 }
 else if(cells[layerIdx][y][x] != 1) {
// if we haven't set this cell's value, then set it to 0 now
 cells[layerIdx][y][x] = 0;
}
 idx++;
 }
 }
 }

 idx = 0;
for(var y = 0; y < level1.layers[LAYER_OBJECT_ENEMIES].height; y++) {
for(var x = 0; x < level1.layers[LAYER_OBJECT_ENEMIES].width; x++) {
if(level1.layers[LAYER_OBJECT_ENEMIES].data[idx] != 0) {
var px = tileToPixel(x);
var py = tileToPixel(y);
var e = new Enemy(px, py);
enemies.push(e);
}
idx++;
}
} 
 
cells[LAYER_OBJECT_TRIGGERS] = [];
idx = 0;
for(var y = 0; y < level1.layers[LAYER_OBJECT_TRIGGERS].height; y++) {
cells[LAYER_OBJECT_TRIGGERS][y] = [];
for(var x = 0; x < level1.layers[LAYER_OBJECT_TRIGGERS].width; x++) {
if(level1.layers[LAYER_OBJECT_TRIGGERS].data[idx] != 0) {
cells[LAYER_OBJECT_TRIGGERS][y][x] = 1;
cells[LAYER_OBJECT_TRIGGERS][y-1][x] = 1;
cells[LAYER_OBJECT_TRIGGERS][y-1][x+1] = 1;
cells[LAYER_OBJECT_TRIGGERS][y][x+1] = 1;
}
else if(cells[LAYER_OBJECT_TRIGGERS][y][x] != 1) {
// if we haven't set this cell's value, then set it to 0 now
cells[LAYER_OBJECT_TRIGGERS][y][x] = 0;
}
idx++;
}
}



var musicBackground = new Howl(
{
urls: ["background.ogg"],
loop: true,
buffer: true,
volume: 0.1,
} );
musicBackground.play();
sfxFire = new Howl(
{
urls: ["fireEffect.ogg"],
buffer: true,
volume: 0.2,
onend: function() {
isSfxPlaying = false;
}
} );
}

function run()
{
context.fillStyle = "#ccc";
context.fillRect(0, 0, canvas.width, canvas.height);
var deltaTime = getDeltaTime();
switch(gameState)
{
case STATE_SPLASH:
runSplash(deltaTime);
break;
case STATE_GAME:
runGame(deltaTime);
break;
case STATE_GAMEOVER:
runGameOver(deltaTime);
break;
case STATE_LIFELOST:
runLifeLost(deltaTime);
break;
}
//end run
}

var viewOffset = new Vector2();

function runGame(deltaTime){
	//asdasd	
	context.drawImage(gameBackground, 0, 0);

context.save();
if(player.position.x > viewOffset.x + canvas.width/2)
{
    viewOffset.x = player.position.x - canvas.width/2;
	localStorage.setItem("viewOffset.x", viewOffset.x);
}
context.translate(-viewOffset.x, 0);
drawMap();

player.update(deltaTime);

player.draw();

if(player.position.x < viewOffset.x){
	player.velocity.x = 0; 
 	if(player.velocity.x == 0 && keyboard.isKeyDown(keyboard.KEY_RIGHT) == true){
		player.velocity.x = player.velocity.x;
		player.position.x = viewOffset.x;
	}
}

//bullet stuff


if(player.shootTimer > 0)
player.shootTimer -= deltaTime;

if(player.shoot == true && player.lives >= 1 && bullets.length <= 10 && player.shootTimer <= 0 && player.climbing == false)
{
	if(player.direction == RIGHT){
	var e = new Bullet(player.position.x + 100, player.position.y - 14, player.direction == RIGHT); 
	player.shootTimer += 0.2;
	bullets.push(e);
	}
else if(player.direction == LEFT){
	var e = new Bullet(player.position.x - 100, player.position.y - 14, player.direction == RIGHT); 
	player.shootTimer += 0.2;
	bullets.push(e);
}
}
var hit=false;
for(var i=0; i<bullets.length; i++)
{
bullets[i].update(deltaTime);
if( bullets[i].position.x - viewOffset.x < 0 ||
bullets[i].position.x - viewOffset.x > SCREEN_WIDTH)
{
hit = true;
}
for(var j=0; j<enemies.length; j++)
{
if(intersects( bullets[i].position.x, bullets[i].position.y, TILE, TILE,
               enemies[j].position.x, enemies[j].position.y, TILE, TILE) == true)
{
// kill both the bullet and the enemy
enemies.splice(j, 1);
hit = true;
// increment the player score
score += 1;
break;
}
}
if(hit == true)
{
bullets.splice(i, 1);
break;
}
}

for(var i=0; i<bullets.length; i++){
	var tx = pixelToTile(bullets[i].position.x);
    var ty = pixelToTile(bullets[i].position.y);
    var nx = (bullets[i].position.x)%TILE; // true if player overlaps right
    var ny = (bullets[i].position.y)%TILE; // true if player overlaps below
    var cell = cellAtTileCoord(LAYER_PLATFORMS, tx, ty);
    var cellright = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty);
    var celldown = cellAtTileCoord(LAYER_PLATFORMS, tx, ty + 1);
    var celldiag = cellAtTileCoord(LAYER_PLATFORMS, tx + 1, ty + 1);
	
	
	if (bullets[i].velocity.x > 0) {
 if ((cellright && !cell) || (celldiag && !celldown && ny)) {
 // clamp the x position to avoid moving into the platform we just hit
 bullets[i].position.x = tileToPixel(tx);
 bullets[i].velocity.x = 0; // stop horizontal velocity
 bullets.splice(i, 1);
 }
}
else if (bullets[i].velocity.x < 0) {
 if ((cell && !cellright) || (celldown && !celldiag && ny)) {
// clamp the x position to avoid moving into the platform we just hit
bullets[i].position.x = tileToPixel(tx + 1);
bullets[i].velocity.x = 0; // stop horizontal velocity
bullets.splice(i, 1);
}
}
}
for(var i=0; i<bullets.length; i++){
	bullets[i].draw();
}



// end of bullet stuff

if(player.lives > 1)
{
for(var i=0; i<enemies.length; i++)
{
if (intersects (player.position.x, player.position.y, TILE, TILE,
                enemies[i].position.x, enemies[i].position.y, TILE, TILE) == true)
{
    player.lives -= 1;
	gameState = STATE_LIFELOST;
	player.position.set (0, 0);
	viewOffset.x = 0;
	hit = true;
	enemies.splice(j, 1);
} 
}
}
if(player.lives == 1)
{
for(var i=0; i<enemies.length; i++)
{
if (intersects (player.position.x, player.position.y, TILE, TILE,
                      enemies[i].position.x, enemies[i].position.y, TILE, TILE) == true)
{
	gameState = STATE_GAMEOVER;
} 
}
}





for(var i=0; i<enemies.length; i++)
{
enemies[i].update(deltaTime);
}

for(var i=0; i<enemies.length; i++)
{
    enemies[i].draw();
}
context.restore();

// update the frame counter
fpsTime += deltaTime;
fpsCount++;
if(fpsTime >= 1)
{
fpsTime -= 1;
fps = fpsCount;
fpsCount = 0;
}

context.fillStyle = "#78c018";
context.fillRect(SCREEN_WIDTH - 220, 0, 500, 30)

// draw the FPS
context.fillStyle = "#FF0000";
context.font="14px Arial";
context.fillText("FPS: " + fps, 30, 20, 100);
context.fill();

context.fillStyle = "#000000"; 
context.font = "16px Arial";
var scoreText = "score: " + score;
context.fillText("Score: " + score, SCREEN_WIDTH - 100, 22);
context.fill();


if(player.position.y > SCREEN_HEIGHT && player.lives > 1){
	player.lives -= 1;
	gameState = STATE_LIFELOST;
	player.position.set (0, 0);
	viewOffset.x = 0;
}
else if(player.position.y > SCREEN_HEIGHT && player.lives == 1){
	gameState = STATE_GAMEOVER;
}
for(var i=0; i<player.lives; i++)
{
DrawImage(context, heartImage,  SCREEN_WIDTH - 200 + ((heartImage.width+8)*i), 15, 0, 1.5, 1.5);
}

}

var win = false; 
var firstGameOver = true; 
var gotHighScore = false;
function runGameOver(){
	context.drawImage(gameBackground, 0, 0);
	
	context.fillStyle = "black";
	context.fillRect(0, SCREEN_HEIGHT/2 - 42, 1000, 120)
	
	if(firstGameOver == true){
		firstGameOver = false; 
		if(score >= highscore){
			gotHighScore = true; 
			highscore = score;
			localStorage.setItem("highscore", score);
		}
		else {
			gotHighScore = false;
		}
	}
	if(win == false){
	context.font = "32px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("You seem to have lost. Nice work!", SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
	}
	if(score == 0 && win == false){
	context.font = "32px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("You literally scored 0, you suck, go home.", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
	}
	if(score > 0 && win == false){
	context.font = "32px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("You scored, " +score + ", nice job!", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
	}
	if(score >= 0 && win == true){
	context.font = "32px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("You won!!! You scored: " +score, SCREEN_WIDTH/2, SCREEN_HEIGHT/2); 
	
	context.font = "16.5px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("Prepare for the sequel: The Bats Strike Back", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 20); 
	
	context.font = "16.5px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("And the sequel to the sequel: Return of the Chucks", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 40); 
	
	context.font = "12px Franklin";
	context.textAling = "center"; 
	context.fillStyle = "gold";
	context.fillText("Dont forget the prequels: The Phantom Bat, Attack of the Semi-Giant Bats, and Revenge of the Bats", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 60); 
	}
	
	
	if(keyboard.isKeyDown(keyboard.KEY_R) == true){
	  player.lives = 3;
	  gameState = STATE_GAME;
	  player.position.set (0, 0);
	  viewOffset.x = 0;
	  player.sprite.setAnimation(ANIM_IDLE_RIGHT);
	  win = false;
	  enemies.length = 0;
	  initialize();
	  score = 0; 
	  bullets.length = 0; 
	}
	
}

var splashTime = 3; 
function runSplash(deltaTime){
	splashTime -= deltaTime;
	if(splashTime <= 0){
		gameState = STATE_GAME;
	}
	context.drawImage(background, 0, 0);
	context.fillStyle = "black";
	context.fillRect(0, SCREEN_HEIGHT/2 + 5, 1000, 33.5)
	
context.font="32px Franklin Gothic Medium Condensed";
context.textAlign = "center";
context.fillStyle = "GOLD";
context.strokeStyle = "gold";


context.fillText("A New Hope ft. Chuck Norris", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 30);
context.strokeText("A New Hope ft. Chuck Norris", SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 30);


}

var lifelosttime = 1;
function runLifeLost(deltaTime){
	context.drawImage(gameBackground, 0, 0);
	
	lifelosttime -= deltaTime; 
	if(lifelosttime <= 0){
		gameState = STATE_GAME;
		lifelosttime = 1;
		player.position.set (0, 0);
		viewOffset.x = 0;
	}
	

	context.fillStyle = "black";
	context.fillRect(0, SCREEN_HEIGHT/2 - 33, 1000, 50)
	
	context.fillStyle = "gold";
	context.font = "32px Franklin";
	context.textAling = "center"; 
	context.fillText("Life Lost! Good Job!", SCREEN_WIDTH/2, SCREEN_HEIGHT/2);
}

initialize();


//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);
