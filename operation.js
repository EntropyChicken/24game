
class Operation {
	constructor(symbol, fn, x, y, w, h) {
		this.symbol = symbol;
		this.fn = fn;
		this.x = x; this.y = y;
		this.w = w; this.h = h;
	}

	draw(selected) {
		if(this.drawAngle === undefined){
			this.drawAngle = 0;
		}
		if(this.drawOffset === undefined){
			this.drawOffset = 0;
		}
		if(this.drawScale === undefined){
			this.drawScale = 1;
		}
		if (selected || mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
			this.drawOffset += height*0.0045;
		}
		this.drawAngle *= 0.8;
		this.drawOffset *= 0.85;
		this.drawScale = 1+(this.drawScale-1)*0.9;

		push();
		translate(this.x+this.w/2,this.y+this.h/2);
		scale(this.drawScale);
		translate(0,this.drawOffset);
		rotate(this.drawAngle);
		translate(-this.x-this.w/2,-this.y-this.h/2);

        fill(selected ? color(225,255,180) : color(255,255,255));
		stroke(100,93,85); strokeWeight(3);
		rect(this.x, this.y, this.w, this.h, 12);
		fill(0); noStroke();
		textAlign(CENTER, CENTER);
		let ts = min(height * 0.1, width * 0.08);
		if(this.symbol.length > 2){
			ts /= pow(this.symbol.length-1,0.8);
		}
		textSize(ts);
		text(this.symbol, this.x + this.w/2, this.y + this.h/2);

		pop();
	}

	contains(px, py) {
		return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
	}

	apply(a, b) { return this.fn(a, b); }
}