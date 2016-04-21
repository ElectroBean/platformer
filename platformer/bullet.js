var Bullet = function() {	
	this.image = document.createElement("img");	
	this.position = new Vector2();
	this.position.add(player.position);
    this.width = 5,
    this.height = 5,
    this.velocity = new Vector2(1,0)
	var speed = 256; 
	this.rotation = player.rotation;
	this.velocity.rotateDirection(this.rotation);
	this.velocity.multiplyScalar(speed);
	this.image.src = "bullet.png";
};

Bullet.prototype.update = function(deltaTime)
{
var posChange = this.velocity.copy();
posChange.multiplyScalar(deltaTime);
this.position.add(posChange);
}

Bullet.prototype.draw = function()
{
	DrawImage(context, this.image, this.position.x, this.position.y, this.rotation)
}