class Dot {

	constructor(x, y, size, hoverRadius, jointSize) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.hoverSize = hoverRadius * 2;
		this.jointSize = jointSize;

		this.active = false;

		//             top,    right,  bottom, left
		this.joints = [false,  false,  false,  false];
		// This refers to the bottom right box
		this.box = false;
		this.boxText = "";
		this.boxID = "";
	}

	createJoint(index) {
		this.joints[index] = true;
	}

	draw(g) {
		if (this.box) {
			g.noStroke();
			g.fill(c_fore, 20);
			g.rect(this.x, this.y, this.jointSize, this.jointSize);
			g.textAlign(CENTER, CENTER);
			if (mobile) {
				g.textSize(this.jointSize/2);
			} else {
				g.textSize(this.jointSize/3);
			}
			g.fill(c_fore);
			g.text(this.boxText, this.x + this.jointSize/2 - this.size/4, this.y + this.jointSize/2 - this.size/4);
		}

		g.noStroke();
		g.fill(c_fore);
		g.ellipse(this.x, this.y, this.size);

		g.stroke(c_fore);
		g.strokeWeight(this.size * 0.7);
		for (let i = 0; i < this.joints.length; i++) {
			if (this.joints[i]) {
				switch(i) {
					case 0:
						g.line(this.x, this.y, this.x, this.y - this.jointSize);
						break;
					case 1:
						g.line(this.x, this.y, this.x + this.jointSize, this.y);
						break;
					case 2:
						g.line(this.x, this.y, this.x, this.y + this.jointSize);
						break;
					case 3:
						g.line(this.x, this.y, this.x - this.jointSize, this.y);
				}
			}
		}

		if (this.active) {
			g.noStroke();
			g.fill(c_fore, 70);
			g.ellipse(this.x, this.y, this.hoverSize);
		}
	}

	hover() {
		stroke(c_fore);
		strokeWeight(2);
		noFill();
		ellipse(this.x, this.y, this.hoverSize);
	}

}