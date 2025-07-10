class Level {
	constructor(numbers, opSymbols = ['+', '-', '×', '÷', '^', '√', 'ln'], metaData = {}) {
        this.metaData = metaData;
		this.values = numbers.map(n => new Complex(n));
		this.originalValues = numbers.map(n => new Complex(n));
		this.boxes = [];
		this.opSymbols = opSymbols;
		this.setupBoxes();
		this.setupOps();
		this.setupUndo();
		this.firstIndex = null;
		this.selectedOp = null;
		this.history = [];
		this.winTimer = 0;
		this.solved = false; // for external use
	}

	setupBoxes() {
        const spaceConst = 0.8;
		const count = this.values.length;
		const boxW = width / (this.values.length+1);
		const boxH = height * 0.265;
		const spacing = width / (count + 2*spaceConst-1);
		this.boxes = this.values.map((v, i) => ({
			x: spacing * (i + spaceConst) - boxW / 2,
			y: height * 0.25,
			w: boxW,
			h: boxH,
			value: v,
			locName: i
		}));
	}

	setupOps() {
        const spaceConst = 1.9;
		const syms = this.opSymbols;
		const btnW = width * 0.91 / (this.opSymbols.length+3);
		const btnH = height * 0.16;
		const spacing = width / (syms.length + 2*spaceConst-1);
		this.opButtons = syms.map((s, i) => new Operation(
			s,
			(a, b) => {
				switch (s) {
					case '+': return a.add(b);
					case '-': return a.subtract(b);
					case '×': return a.multiply(b);
					case '÷': return a.divide(b);
                    case '^': return a.power(b);
                    case '√': return a.power(new Complex(0.5));
                    case 'ln': return a.naturalLog();
				}
			},
			spacing * (i + spaceConst) - btnW / 2,
			height * 0.55,
			btnW,
			btnH
		));
	}

	setupUndo() {
		this.undoButton = {
			x: width * 0.05,
			y: height * 0.85,
			w: width * 0.15,
			h: height * 0.08
		};
	}

	draw() {
		if (this.winTimer === 0 && this.boxes.length === 1 && this.boxes[0].value.equals(new Complex(24))) {
			this.winTimer = 45;
		}
        if (this.winTimer > 0) {
            background(100, 240, 140); // green
            this.winTimer--;
            if (this.winTimer <= 0) {
				this.solved = true;
                return;
            }
        } else {
            background(100, 130, 180);
        }
		this.drawOps();
		this.drawBoxes();
		this.drawUndo();
	}
    drawBoxes() {
		let sorted = this.boxes
			.map((b, i) => ({ b, i }))
			.sort((a, b) => {
				let scaleA = a.b.drawScale ?? 1;
				let scaleB = b.b.drawScale ?? 1;
				return scaleA - scaleB;
			});

		sorted.forEach(({ b, i }) => {
			if(b.drawAngle === undefined){
				b.drawAngle = 0;
			}
			if(b.drawScale === undefined){
				b.drawScale = 1;
			}
			if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
				b.drawAngle += 0.03
				// alternative: b.drawAngle += b.locName%2 ? -0.02 : 0.02
			}
			b.drawAngle *= 0.8;
			b.drawScale = 1+(b.drawScale-1)*0.9;

			push();
			translate(b.x+b.w/2,b.y+b.h/2);
			rotate(b.drawAngle);
			scale(b.drawScale);
			translate(-b.x-b.w/2,-b.y-b.h/2);


			fill(i === this.firstIndex ? color(255,255,150) : color(255,255,255));
			stroke(0); strokeWeight(3);
			rect(b.x, b.y, b.w, b.h, 15);

			fill(0); noStroke();
			textAlign(CENTER, CENTER);

			let txt = "";
			let raw = b.value;
			if(keyIsDown(32)){
				txt = raw.real.toString()+"+"+raw.imag.toString()+"i";
			}
			else if(isNaN(raw.real)||isNaN(raw.imag)){
				txt = "🤯⁉️";
			}
			else{
				let rounded = raw.round(DISPLAY_THRESHOLD);
				if(abs(raw.real)>DISPLAY_THRESHOLD) {
					txt = rounded.real.toString();
				}
				if (abs(raw.imag)>DISPLAY_THRESHOLD) {
					if(txt!==""&&rounded.imag>=0) {
						txt += "+";
					}
					txt += rounded.imag + "i";
				}
				if(txt===""){
					txt = "0";
				}
			}

			const maxWidth = b.w - 7;
			const maxHeight = b.h - 7;
			const fallbackFontSize = height * 0.033;

			// First check if fallback size is enough for one-line fit
			textSize(fallbackFontSize);
			let fallbackWidth = textWidth(txt);
			let fallbackHeight = fallbackFontSize * 1.2;

			if (fallbackWidth <= maxWidth && fallbackHeight <= maxHeight) {
				// Try to find largest size that fits in one line
				let low = fallbackFontSize, high = height * 0.12, bestSize = fallbackFontSize;
				while (low <= high) {
					let mid = (low + high) >> 1;
					textSize(mid);
					let w = textWidth(txt);
					let h = mid * 1.2;

					if (w <= maxWidth && h <= maxHeight) {
						bestSize = mid;
						low = mid + 1;
					} else {
						high = mid - 1;
					}
				}
				textSize(bestSize);
				text(txt, b.x + b.w/2, b.y + b.h/2);
			} else {
				// Wrapping fallback
				textSize(fallbackFontSize);
				let lines = [];
				let currentLine = '';
				for (let char of txt) {
					let testLine = currentLine + char;
					if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
						lines.push(currentLine);
						currentLine = char;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine.length > 0) lines.push(currentLine);

				const lineHeight = fallbackFontSize * 1.2;
				const startY = b.y + b.h / 2 - (lines.length - 1) * lineHeight / 2;

				lines.forEach((line, j) => {
					text(line, b.x + b.w/2, startY + j * lineHeight + 3);
				});
			}
			pop();
		});
	}



	drawOps() {
		this.opButtons.forEach(btn => btn.draw(this.selectedOp === btn));
	}

	drawUndo() {
		const b = this.undoButton;
		if(b.drawAngle === undefined){
			b.drawAngle = 0;
		}
		if(b.drawScale === undefined){
			b.drawScale = 1;
		}
		if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
			b.drawAngle -= 0.02
		}
		b.drawAngle *= 0.8;
		b.drawScale = 1+(b.drawScale-1)*0.9;

		push();
		translate(b.x+b.w/2,b.y+b.h/2);
		rotate(b.drawAngle);
		scale(b.drawScale);
		translate(-b.x-b.w/2,-b.y-b.h/2);

		fill('white'); stroke(0); strokeWeight(3);
		rect(b.x, b.y, b.w, b.h, 10);
		fill(0); noStroke();
		textAlign(CENTER, CENTER);
		textSize(height * 0.04);
		text("Undo", b.x + b.w/2, b.y + b.h/2);
		pop();
	}

	handleClick(mx, my) {
		// Undo click
		const u = this.undoButton;
		if (mx > u.x && mx < u.x + u.w && my > u.y && my < u.y + u.h) {
			u.drawScale -= 0.06;
			this.undo(); return;
		}

		// Number box click
		for (let i = 0; i < this.boxes.length; i++) {
			const b = this.boxes[i];
			if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
				// unselect same box
				if (this.firstIndex === i) {
					this.firstIndex = null;
					this.selectedOp = null;
					return;
				}

				// if no number selected, pick this one
				if (this.firstIndex === null) {
					b.drawScale -= 0.06;
					this.firstIndex = i;
					return;
				}

				// if op selected but no first, shouldn't reach here (firstIndex non-null)

				// if number selected but no op, switch selection
				if (this.firstIndex !== null && this.selectedOp === null) {
					b.drawScale -= 0.06;
					this.firstIndex = i; return;
				}

				// if op selected and different box, apply
				if (this.selectedOp && i !== this.firstIndex) {
					this.applyOperation(this.firstIndex, i, this.selectedOp);
					return;
				}
			}
		}

		// Operation click
		for (let btn of this.opButtons) {
			if (btn.contains(mx, my)) {
				// Check if this is a unary op (√ or ln)
                if ((btn.symbol === '√' || btn.symbol === 'ln')) {
                    if (this.firstIndex !== null) {
						btn.drawScale -= 0.08;
                        // Apply unary op immediately to selected box
                        this.saveState();
                        const a = this.boxes[this.firstIndex].value;
                        // For unary, ignore b param
                        const res = btn.apply(a, null);
                        this.boxes[this.firstIndex].value = res;
						this.boxes[this.firstIndex].drawScale += 0.1;
                        this.selectedOp = null;
                    }
                    // Never visibly select unary op
                    return;
                } else {
                    // Binary op: select/deselect
                    this.selectedOp = (this.selectedOp === btn) ? null : btn;
					if(this.selectedOp === btn){
						btn.drawScale -= 0.06;
					}
                }
                return;
            }
        }
	}

	applyOperation(i1, i2, opBtn) {
		this.saveState();
		const a = this.boxes[i1].value;
		const b = this.boxes[i2].value;
		const res = opBtn.apply(a, b);
		this.boxes[i2].value = res;
		this.boxes[i2].drawScale += 0.1;
		this.boxes.splice(i1, 1);

		// new selection
		const newIndex = i1 < i2 ? i2 - 1 : i2;
		this.firstIndex = newIndex;
		this.selectedOp = null;  // remove this to easily repeat operation
	}

	saveState() {
		const snap = this.boxes.map(b => ({
			x: b.x, y: b.y, w: b.w, h: b.h,
			value: new Complex(b.value.real, b.value.imag),
			locName: b.locName
		}));
		this.history.push(snap);
		if (this.history.length > 5000) this.history.shift();
	}

	undo() {
		if (!this.history.length) return;
		const prev = this.history.pop();
		this.boxes = prev.map(b => ({
			x: b.x, y: b.y, w: b.w, h: b.h,
			value: new Complex(b.value.real, b.value.imag),
			locName: b.locName
		}));
		this.firstIndex = null;
		this.selectedOp = null;
	}

	// newGame() {
	// 	this.values = randomNumbers().map(n => new Complex(n));
	// 	this.history = [];
	// 	this.firstIndex = null;
	// 	this.selectedOp = null;
	// 	this.setupBoxes();
	// 	this.setupOps();
	// 	this.setupUndo();
	// }

	handleKey(e) {
		const key = e.key;

		if (key === '\\'){
			this.solved = true;
		}
		if (key === 'u' || key === 'z'){
			this.undo();
			return;
		}
		/* Possible starter for full keyboard use (DO NOT DELETE THIS COMMENT)
		if (key === 'ArrowLeft'){
			if(this.firstIndex === null){
				this.firstIndex = 0;
			}
			else{
				this.firstIndex = (this.firstIndex+this.boxes.length-1)%this.boxes.length;
			}
		}
		if (key === 'ArrowRight'){
			if(this.firstIndex === null){
				this.firstIndex = 0;
			}
			else{
				this.firstIndex = (this.firstIndex+1)%this.boxes.length;
			}
		}
		*/
        if (/^[0-9]$/.test(key)) {
            // Find first box with that number (real part, imag==0)
            for (let i = 0; i < this.boxes.length; i++) {
                let v = this.boxes[i].value;
                if (v.imag === 0 && v.real.toString() === key && (i !== this.firstIndex || !(this.firstIndex !== null && this.selectedOp))) {
                    if (this.firstIndex !== null && this.selectedOp) {
						this.applyOperation(this.firstIndex, i, this.selectedOp);
                    } else {
                        this.firstIndex = i;
                    }
                    return;
                }
            }
            return;
        }
        // Map keys to op symbols
        const opKeyMap = {
            '+': '+',
            '-': '-',
            '*': '×',
            '/': '÷',
            '^': '^',
            's': '√',
            'l': 'ln',
            'x': '×', // sketchy
        };
        if (key in opKeyMap) {
            const symbol = opKeyMap[key];
            // Find op button with this symbol
            for (let btn of this.opButtons) {
                if (btn.symbol === symbol) {
                    // For unary ops, apply immediately if number selected
                    if (symbol === '√' || symbol === 'ln') {
                        if (this.firstIndex !== null) {
                            this.saveState();
                            const a = this.boxes[this.firstIndex].value;
                            const res = btn.apply(a, null);
                            this.boxes[this.firstIndex].value = res;
                            this.boxes[this.firstIndex].drawScale += 0.1;
                            this.selectedOp = null;
                        }
                        return;
                    } else {
                        // Binary op: select/deselect
                        this.selectedOp = (this.selectedOp === btn) ? null : btn;
                    }
                    return;
                }
            }
			return;
        }

		if (key.length === 1){
			const code = key.toLowerCase().charCodeAt(0);
			if (code >= 97 && code <= 122) { // 'a' to 'z'
				let loc = code - 97;
				for (let i = 0; i < this.boxes.length; i++) {
					if (this.boxes[i].locName === loc && i !== this.firstIndex) {
						if (this.firstIndex !== null && this.selectedOp) {
							this.applyOperation(this.firstIndex, i, this.selectedOp);
						} else {
							this.firstIndex = i;
						}
						return;
					}
				}
			}
		}
    }
}

Level.setupKeyboard = function(levelInstance, override=true) {
	if (override || !window._levelKeyboardHandler) {
		window._levelKeyboardHandler = function(e) {
			if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
			levelInstance.handleKey(e);  // pass the full event
		};
		window.addEventListener('keydown', window._levelKeyboardHandler);
	}
};
