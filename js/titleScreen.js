class TitleScreen {
	constructor() {
		this.boxes = [];
		this.boxW = min(220, width * 0.35);
		this.boxH = min(80, height * 0.1);
		this.marginY = min(16,height*0.016);
		this.bubbleBox = new BubbleBox(0,0,width,height,20,0);
		this.duelMode = false;

		const labels = [
			{ text: "Easy", set: 0 },
			{ text: "Medium", set: 1 },
			{ text: "Hard", set: 2 },
			{ text: "Tricky", set: 3 },
			{ text: "Very Hard", set: 4 },
            
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
			const y = height*0.4 + row * (this.boxH + this.marginY);

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

		this.duelButton = new Button({
			x: width * 0.5-this.boxes[0].w/2, y: height * 0.2, w: this.boxes[0].w, h: this.boxes[0].h,
			label: "Duel button",
			style: {
				r: 15,
				onHoverMovement: 0.003,
				textColor: color(60,60,60),
				predraw: () => {
					if(titleScreen.duelMode){
						titleScreen.duelButton.style.mainColor = color(225,255,180);
						titleScreen.duelButton.style.shadeColor = theme.shadeColorCorrect;
						titleScreen.duelButton.style.hovering = true;
					}
					else{
						titleScreen.duelButton.style.mainColor = color(255,255,255);
						titleScreen.duelButton.style.shadeColor = theme.shadeColor;
						titleScreen.duelButton.style.hovering = false;
					}
				}
			},
			getText: () => "Two player mode",
			onClick: () => { titleScreen.duelMode = !titleScreen.duelMode }
		});

	}

	draw() {
        background(255);

		this.drawBubbleBox();

		noStroke();
		fill(100,93,85,120);
		rect(-1,-1,width+2,height+2);

		textAlign(CENTER, CENTER);
		noStroke();
		for(let y = 2; y>=-2; y-=2){
			for(let x = y/3-1; x<y/3+1.1; x+=2){
				fill(y<0 ? color(255,255,255) : color(100,93,85));
				textSize(constrain(width*0.07,45,90));
				text("Make 24", width*0.5+x, height*0.14+y);
				textSize(constrain(width*0.035,25,45));
				text("Random",width*0.3+x, height*0.363+y*0.8);
				text("Designed",width*0.7+x, height*0.363+y*0.8);
			}
		}

		this.drawBoxes();
		this.duelButton.draw();
	}

	drawBubbleBox() {
		let rotateAng = 0.17;
		let scaleFactor = 1.05;
		push();
		translate(width/2,height/2);
		rotate(rotateAng);
		scale(scaleFactor);
		translate(-width/2,-height/2);
		let mAng = atan2(mouseY-height/2,mouseX-width/2)-rotateAng;
		let mDst = dist(mouseX,mouseY,width/2,height/2)/scaleFactor;
		this.bubbleBox.draw(width/2+mDst*cos(mAng),height/2+mDst*sin(mAng));
		pop();
	}

	drawBoxes() {
		for (let b of this.boxes) {
			if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
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
				drawShadedButton(b.x, b.y, b.w, b.h, 15, b.isClassic ? color(255,210,160) : color(180,210,255));
			} else {
				fill(255);
				stroke(100, 93, 85);
				strokeWeight(3);
				rect(b.x, b.y, b.w, b.h, 15);
			}

			noStroke();
			textAlign(CENTER, CENTER);
			fill(b.isClassic ? color(255,120,0) : color(30,60,255));

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

    handleClick(mx, my) {
        for (let b of this.boxes) {
            if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
                currentLevelSet = b.set;
                currentUsedIndices = [];
                currentIsClassic = b.isClassic;
                theme.shadeColor = (b.isClassic ? color(255,210,160) : color(180,210,255));
                theme.backgroundColor = (b.isClassic ? color(255,225,190) : color(210,225,250));
                let levelData = getRandomLevel(currentLevelSet, [], currentIsClassic ? ["+","-","×","÷"] : Level.SYMBOLS, false, currentUsedIndices, !currentIsClassic);

				if(this.duelMode){
					duel = new Duel(levelData.cards,levelData.ops,levelData.lvl);
					setScreen("duel");
				}
				else{
					level = new Level(levelData.cards,levelData.ops,levelData.lvl, b.isClassic);
					Level.setupKeyboard(level);
					setScreen("game");
				}

                return;
            }
        }
		const buttons = [this.duelButton];
		for(const btn of buttons) {
			if(btn.contains(mx, my)) {
				btn.drawScale -= 0.08;
				btn.onClick();
				return;
			}
		}
    }

}
