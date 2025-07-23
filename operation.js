class Operation {
	constructor(symbol, fn, x, y, w, h) {
		this.symbol = symbol;
		this.fn = fn;
		this.x = x; this.y = y;
		this.w = w; this.h = h;
	}

	draw(selected, transparent) {
		if(this.drawAngle === undefined){
			this.drawAngle = 0;
		}
		if(this.drawOffset === undefined){
			this.drawOffset = 0;
		}
		if(this.drawScale === undefined){
			this.drawScale = 1;
		}
		if (selected || mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h) {
			this.drawOffset += height*0.005;
		}
		push();
		translate(this.x+this.w/2,this.y+this.h/2);
		scale(max(0,this.drawScale));
		translate(0,this.drawOffset);
		rotate(this.drawAngle);
		translate(-this.x-this.w/2,-this.y-this.h/2);

		if(transparent){
			noFill();
			stroke(100,93,85,80); strokeWeight(3);
			rect(this.x, this.y, this.w, this.h, 12);
		} else {
			if(typeof drawShadedButton === "function"){
				drawShadedButton(this.x, this.y, this.w, this.h, 12, selected ? theme.shadeColorCorrect : theme.shadeColor, selected ? color(225,255,180) : color(255,255,255));
			} else {
				fill(255,255,255);
				stroke(0); strokeWeight(2);
				rect(this.x, this.y, this.w, this.h, 12);
			}
		}
		fill(0); noStroke();
		textAlign(CENTER, CENTER);
		let ts = height * 0.06;
		while(ts>14){
			textSize(ts);
			let tw = textWidth(this.symbol);
			if(tw<this.w-5){
				break;
			}
			if(ts<=20&&tw<this.w){
				break;
			}
			ts--;
		}
		text(this.symbol, this.x + this.w/2, this.y + this.h/2);
		pop();
		this.drawAngle *= 0.8;
		this.drawOffset *= 0.8;
		this.drawScale = 1+(this.drawScale-1)*0.9;
	}

	contains(px, py) {
		return px > this.x && px < this.x + this.w && py > this.y && py < this.y + this.h;
	}

	apply(a, b) { return this.fn(a, b); }
}