
class Operation {
	constructor(symbol, fn, x, y, w, h) {
		this.symbol = symbol;
		this.fn = fn;
		this.x = x; this.y = y;
		this.w = w; this.h = h;
	}

	draw(selected) {
		if(this.drawOffset === undefined){
			this.drawOffset = 0;
		}
		if(this.drawScale === undefined){
			this.drawScale = 1;
		}
		if (selected || mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			this.drawOffset += height*0.003;
		}
		this.drawOffset *= 0.85;
		this.drawScale = 1+(this.drawScale-1)*0.9;

		push();
		translate(this.x+this.w/2,this.y+this.h/2);
		scale(this.drawScale);
		translate(0,this.drawOffset);
		translate(-this.x-this.w/2,-this.y-this.h/2);

        fill(selected ? color(225,255,180) : color(255,255,255));
		stroke(0); strokeWeight(3);
		rect(this.x, this.y, this.w, this.h, 12);
		fill(0); noStroke();
		textAlign(CENTER, CENTER);
		textSize(height * 0.1);
		text(this.symbol, this.x + this.w/2, this.y + this.h/2);

		pop();
	}

	contains(px, py) {
		return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
	}

	apply(a, b) { return this.fn(a, b); }
}