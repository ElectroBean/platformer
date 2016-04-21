var Vector2 = function(x, y){{
	this.x = 0;
	this.y = 0; 
}
    if(x != undefined){
		this.x = x; 
		
	}
	if(y != undefined){
		this.y = y;
	}
this.copy = function(){
	return new Vector2(this.x, this.y);
};
this.reverse = function(){
	this.set(-this.x, -this.y)
};
this.set = function(newX,newY){
	this.x = newX;
	this.y = newY; 
}
this.magnitude = function(){
	return Math.sqrt(this.x*this.x + this.y*this.y);
}
this.normalize = function(){
	var mag = this.magnitude(); 
	if(mag == 0) return;
	this.x/=mag;
	this.y/=mag;
}
this.add = function(other){
	this.x += other.x;
	this.y += other.y;
}
this.subtract = function(other){
	this.x -= other.x;
	this.y -= other.y;
}
this.multiplyScalar = function(val){
	this.x *= val;
	this.y *= val;
}
this.rotateDirection = function(angle){
	var s = Math.sin(angle);
	var x = Math.sin(angle);
	
	var dirX = (this.x * x) - (this.y * s);
	var dirY = (this.x * s) + (this.y * x);
	
	this.set(dirX, dirY);
}
}