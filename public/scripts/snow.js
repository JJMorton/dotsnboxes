let Snow = function() {
	this.x = random(-width, width*3);
	this.y = random(-1000);
	this.z = random(1, 7);
	this.move = function() {
		
		if (this.y >= height) {
			this.x = random(-width, width*2);
			this.y = random(-1000);
			this.z = random(3, 10);
		} else {
			this.y += this.z;
			this.x += (mouseX-width/2)*(this.z*2)/width;
		}
	}
	this.show = function() {
		strokeWeight(this.z/2);
		stroke(c_fore, 30);
		line(this.x, this.y - this.z, this.x, this.y);
	}
}