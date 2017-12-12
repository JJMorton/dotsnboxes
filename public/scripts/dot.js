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

	draw() {
		if (this.box) {
			noStroke();
			fill(255, 20);
			rect(this.x, this.y, this.jointSize, this.jointSize);
			textAlign(CENTER, CENTER);
			if (mobile) {
				textSize(this.jointSize/2);
			} else {
				textSize(this.jointSize/3);
			}
			fill(255);
			text(this.boxText, this.x + this.jointSize/2 - this.size/4, this.y + this.jointSize/2 - this.size/4);
		}

		noStroke();
		fill(255);
		ellipse(this.x, this.y, this.size);

		stroke(255);
		strokeWeight(this.size * 0.7);
		for (let i = 0; i < this.joints.length; i++) {
			if (this.joints[i]) {
				switch(i) {
					case 0:
						line(this.x, this.y, this.x, this.y - this.jointSize);
						break;
					case 1:
						line(this.x, this.y, this.x + this.jointSize, this.y);
						break;
					case 2:
						line(this.x, this.y, this.x, this.y + this.jointSize);
						break;
					case 3:
						line(this.x, this.y, this.x - this.jointSize, this.y);
				}
			}
		}

		if (this.active) {
			noStroke();
			fill(255, 70);
			ellipse(this.x, this.y, this.hoverSize);
		}
	}

	hover() {
		stroke(255);
		strokeWeight(2);
		noFill();
		ellipse(this.x, this.y, this.hoverSize);
	}

}