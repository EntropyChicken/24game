function drawShadedButton(x, y, w, h, r = 8, shadeColor = theme.shadeColor, mainColor = color(255,255,255), shadeHeightFrac = 0.1) {
	fill(shadeColor); stroke(100,93,85); strokeWeight(3);
	rect(x, y, w, h, r);
	noStroke();
	rect(x, y, w, h, r);
	fill(mainColor); noStroke();

	// or no round bottoms: rect(x, y, w, h * (1 - shadeHeightFrac), r, r, 0, 0);
	rect(x, y, w, h * (1 - shadeHeightFrac), r);
}

class Button {
	constructor({x, y, w, h, label, onClick, getText, drawAngle = 0, drawScale = 1, drawOffset = 0, style = {}, enabled = true}) {
		this.x = x; this.y = y; this.w = w; this.h = h;
		this.label = label;
		this.onClick = onClick;
		this.getText = getText || (() => label);
		this.drawAngle = drawAngle;
		this.drawScale = drawScale;
		this.drawOffset = drawOffset;
		this.style = style;
		this.enabled = enabled;
		this.state = {};
	}
	draw(winTimer = false) {
		if (this.drawAngle === undefined) this.drawAngle = 0;
		if (this.drawScale === undefined) this.drawScale = 1;
		if (this.drawOffset === undefined) this.drawOffset = 0;
		if (mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h) {
			if(this.style.onHoverMovement === undefined) this.style.onHoverMovement = 0.0045;
			this.drawOffset += height * this.style.onHoverMovement;
		}
		push();
		translate(this.x + this.w / 2, this.y + this.h / 2);
		scale(this.drawScale);
		translate(0, this.drawOffset);
		rotate(this.drawAngle);
		translate(-this.x - this.w / 2, -this.y - this.h / 2);
		if(winTimer && this.style.transparentOnWin){
			noFill(); stroke(100,93,85,80); strokeWeight(3);
			rect(this.x, this.y, this.w, this.h, this.style.r || 10);
		} else {
			drawShadedButton(this.x, this.y, this.w, this.h, this.style.r || 10, this.style.shadeColor || theme.shadeColor, this.style.mainColor || color(255,255,255));
		}
		let displayText = this.getText();
		drawTextInBox(displayText, this.x, this.y, this.w, this.h, this.style.fontSize || height * 0.045);
		pop();
		this.drawAngle *= 0.8;
		this.drawScale = 1 + (this.drawScale - 1) * 0.9;
		this.drawOffset *= 0.8;
	}
	contains(mx, my) {
		return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
	}
}