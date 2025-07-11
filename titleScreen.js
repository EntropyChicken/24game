class TitleScreen {
	constructor() {
		this.boxes = [];
		this.boxW = min(220, width * 0.3);
		this.boxH = min(80, height * 0.1);
		this.marginY = 16;
		this.bubbles = [];

		const labels = [
			{ text: "Easy", set: 0 },
			{ text: "Medium", set: 1 },
			{ text: "Hard", set: 2 },
			{ text: "Tricky", set: 3 },
			{ text: "Cooked", set: 4 },
            
			{ text: "Simple", set: 0 },
			{ text: "Interesting", set: 1 },
			{ text: "Javascript", set: 3 },
			{ text: "Crazy Hard", set: 2 }
		];

		for (let i = 0; i < labels.length; i++) {
            const isClassic = i < 5;

			const col = isClassic ? 0 : 1;
			const row = isClassic ? i : i - 5;
			const x = width * (0.3 + 0.4 * col) - this.boxW / 2;
			const y = height*0.31 + row * (this.boxH + this.marginY);

			this.boxes.push({
				x, y, w: this.boxW, h: this.boxH,
				label: labels[i].text,
				isClassic: isClassic,
				set: isClassic ? classicSets[labels[i].set] : puzzleSets[labels[i].set],
				drawOffset: 0,
				drawAngle: 0,
				drawScale: 1
			});
		}
	}

	draw() {
        background(255);

		this.processBubbles();
		noStroke();
		fill(255,255,255,150);
		rect(-1,-1,width+2,height+2);

		textAlign(CENTER, CENTER);
        fill(100,93,85);
		for(let y = 0; y<=1; y++){
			for(let x = 0; x<=1; x++){
				textSize(constrain(width*0.064,45,90));
				text("Make 24", width*0.5+x, height*0.14+y);
				textSize(constrain(width*0.036,25,45));
				text("Random",width*0.3+x, height*0.3-32+y);
				text("Designed",width*0.7+x, height*0.3-32+y);
			}
		}

		this.drawBoxes();
	}

	drawBoxes() {
		for (let b of this.boxes) {
			if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
				b.drawOffset += height * (b.isClassic ? 0.007 : -0.007);
			}

			push();
			translate(b.x + b.w / 2, b.y + b.h / 2);
			scale(b.drawScale);
			translate(b.drawOffset, 0);
			rotate(b.drawAngle);
			translate(-b.x - b.w / 2, -b.y - b.h / 2);

			// Replace white button with shaded button
			if(typeof drawShadedButton === "function"){
				drawShadedButton(b.x, b.y, b.w, b.h, 15);
			} else {
				fill(255);
				stroke(100, 93, 85);
				strokeWeight(3);
				rect(b.x, b.y, b.w, b.h, 15);
			}

			noStroke();
			textAlign(CENTER, CENTER);
			fill(b.isClassic ? color(255,130,0) : color(0,0,255));

			const maxWidth = b.w - 10;
			const maxHeight = b.h - 10;
			let fontSize = min(24, b.h * 0.4);
			textSize(fontSize);

			let label = b.label;
			let fallbackWidth = textWidth(label);
			let fallbackHeight = fontSize * 1.2;

			if (fallbackWidth <= maxWidth && fallbackHeight <= maxHeight) {
				text(label, b.x + b.w / 2, b.y + b.h / 2);
			} else {
				// fallback: multiline wrapping
				let lines = [];
				let currentLine = '';
				for (let char of label) {
					let testLine = currentLine + char;
					if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
						lines.push(currentLine);
						currentLine = char;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine.length > 0) lines.push(currentLine);

				const lineHeight = fontSize * 1.1;
				const startY = b.y + b.h / 2 - (lines.length - 1) * lineHeight / 2 + 3;

				lines.forEach((line, j) => {
					text(line, b.x + b.w / 2, startY + j * lineHeight);
				});
			}

			pop();
			
			b.drawAngle *= 0.8;
			b.drawScale = 1 + (b.drawScale - 1) * 0.9;
			b.drawOffset *= 0.8;
		}
	}
	
	processBubbles() {
		if(this.bubbles.length<12&&random(0,20)<1){
			Bubble.spawnBubbleInBox(this.bubbles,0,0,width,height);
		}
		
		// let newBubbles = [];
		// for(let b of this.bubbles){
		// 	// console.log(b);
		// 	newBubbles.push(...b.process());
		// }
		// for(let i = this.bubbles.length-1; i>=0; i--){
		// 	this.bubbles[i].spliceOutsideBox(this.bubbles,0,0,width,height);
		// }
		// this.bubbles.push(...newBubbles);
		
		for(let b of this.bubbles){
			b.avoid(this.bubbles);
		}
		for(let b of this.bubbles){
			b.process(this.bubbles);
		}
		for(let i = this.bubbles.length-1; i>=0; i--){
			this.bubbles[i].spliceOutsideBox(this.bubbles,0,0,width,height);
		}
		for(let b of this.bubbles){
			b.draw();
		}
	}

    handleClick(mx, my) {
        for (let b of this.boxes) {
            if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
                currentLevelSet = b.set;
                currentUsedIndices = [];
                currentIsClassic = b.isClassic;
                level = getRandomLevel(currentLevelSet, [], currentIsClassic ? ["+","-","×","÷"] : Level.SYMBOLS, false, currentUsedIndices, !currentIsClassic);
                Level.setupKeyboard(level);
                screen = "game";
                return;
            }
        }
    }

}
