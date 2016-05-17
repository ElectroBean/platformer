var Bullet = function(x, y, moveRight) {	
	this.sprite = new Sprite("bullet4.png");
    this.sprite.buildAnimation(1, 1, 50, 50, -1, [0]);
    this.sprite.setAnimationOffset(0, 0, -20);
    this.sprite.setLoop(0, false);
    this.position = new Vector2(x, y);
    this.velocity = new Vector2();
    this.moveRight = moveRight;
    
if(this.moveRight == true)
    this.velocity.set(MAXDX *2, 0);
else
    this.velocity.set(-MAXDX *2, 0);

};

Bullet.prototype.update = function(deltaTime)
{
this.sprite.update(deltaTime);
this.position.x = Math.floor(this.position.x + (deltaTime * this.velocity.x));
}




Bullet.prototype.draw = function()
{
var screenX = this.position.x - viewOffset.x;
this.sprite.draw(context, this.position.x, this.position.y);
}
