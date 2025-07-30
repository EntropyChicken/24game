function drawShadedButton(x, y, w, h, r = 8, shadeColor = theme.shadeColor, mainColor = color(255,255,255), shadeHeightFrac = 0.1) {
	fill(shadeColor); stroke(100,93,85); strokeWeight(3);
	rect(x, y, w, h, r);
	noStroke();
	rect(x, y, w, h, r);
	fill(mainColor); noStroke();

	// or no round bottoms: rect(x, y, w, h * (1 - shadeHeightFrac), r, r, 0, 0);
	rect(x, y, w, h - min(16,h*shadeHeightFrac), r);
}
function drawTextInBox(txt, x, y, w, h, maxFontSize = height * 0.045, minFontSize = 20, textColor = color(0,0,0)) {
	fill(textColor); noStroke();
	textAlign(CENTER, CENTER);

	let fontSize = maxFontSize;
	textSize(fontSize);
	const maxWidth = w - 0.013*width;

	// Shrink to minimum font size if necessary
	while (textWidth(txt) > maxWidth && fontSize > minFontSize) {
		fontSize -= 1;
		textSize(fontSize);
	}

	// If text fits, draw it directly
	if (textWidth(txt) <= maxWidth) {
		text(txt, x + w / 2, y + h / 2);
		/*
		// debug rectangle outline
		fill(0,0,255,100);
		stroke(255,0,255);
		rect(x,y,w,h);
		*/
		return textWidth(txt);
	}

	// Custom line-breaking logic
	let lines = [];
	let currentLine = '';
	for (let i = 0; i < txt.length; i++) {
		currentLine += txt[i];
		if (textWidth(currentLine) > maxWidth) {
			// Too long: backtrack to last break char
			let j = currentLine.length - 1;
			while (j > 0 && !WRAP_BREAK_CHARS.includes(currentLine[j])) {
				j--;
			}
			if (j === 0) {
				// No break point found—force break
				lines.push(currentLine.trim());
				currentLine = '';
			} else {
				lines.push(currentLine.slice(0, j + 1).trim());
				currentLine = currentLine.slice(j + 1).trimStart();
			}
		}
	}
	if (currentLine.length > 0) lines.push(currentLine.trim());

	// Draw each line centered
	let lineHeight = fontSize * (minFontSize>14 ? 1.1 : 1);
	let totalHeight = lines.length * lineHeight;
	let startY = y + h / 2 - totalHeight / 2 + lineHeight / 2;

	if(minFontSize>14&&lines.length>=5){
		return drawTextInBox(txt,x,y,w,h,maxFontSize,14);
	}
	
	let maxLineWidth = 0;
	for (let i = 0; i < lines.length; i++) {
		maxLineWidth = max(maxLineWidth,textWidth(lines[i]));
		text(lines[i], x + w / 2, startY + i * lineHeight);
	}
	return maxLineWidth;
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
		if (mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h || this.style.hovering) {
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
		if(typeof this.style.predraw === "function"){
			this.style.predraw();
		}
		drawTextInBox(displayText, this.x, this.y, this.w, this.h, this.style.fontSize || height * 0.045, 16, this.style.textColor);
		pop();
		this.drawAngle *= 0.8;
		this.drawScale = 1 + (this.drawScale - 1) * 0.9;
		this.drawOffset *= 0.8;
	}
	contains(mx, my) {
		return mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h;
	}
}