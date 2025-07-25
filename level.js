// shrink or make multiple lines to fit in a box
const WRAP_BREAK_CHARS = ["+", "-", "×", "÷", "^", "√", "!", "*", "/", "(", ")", " ", ",", ":"];

function smoothErp(a,recursion=1){
	a = constrain(a,0,1);
	if(recursion>0){
		return smoothErp((1-cos(PI*a))/2,recursion-1);
	}
	return a;
}

class Level {
	static SYMBOLS = ["+","-","×","÷","^","√","ln","!","sin","cos","tan","cot","asin","acos","abs","%"];

	constructor(numbers, opSymbols = Level.SYMBOLS, metaData = {}, useRational = false) {
		this.metaData = metaData;
		this.values = numbers.map(n => useRational ? new Rational(n, 1) : new Complex(n));
		this.originalValues = numbers.map(n => useRational ? new Rational(n, 1) : new Complex(n));
		this.opSymbols = opSymbols;
		this.firstIndex = null;
		this.selectedOp = null;
		this.history = [];
		this.winTimer = 0;
		this.solved = false; // for external use
		this.useRational = useRational;
		this.setupLayout(width,height);
	}

	setupLayout(w=width,h=height) {
		this.width = w;
		this.height = h;

		this.setupBoxes();
		this.setupOps();
		this.undoButton = new Button({
			x: this.width * 0.05, y: this.height * 0.77, w: this.width * 0.22, h: this.height * 0.18,
			label: "Undo",
			style: { r: 10, transparentOnWin: true },
			getText: () => "Undo",
			onClick: () => {
				if(this.history.length){
					this.undo();
				} else {
					this.undoButton.drawAngle -= 0.16;
				}
			}
		});
		this.hintButton = new Button({
			x: this.width * 0.43, y: this.height * 0.77, w: this.width * 0.3, h: this.height * 0.18,
			label: "Hint",
			style: { r: 10, transparentOnWin: true },
			getText: () => this.hintButton.state.showHint ? this.getHint() : "Hint",
			onClick: () => { this.hintButton.state.showHint = !this.hintButton.state.showHint; }
		});
		this.solutionButton = new Button({
			x: this.width * 0.75, y: this.height * 0.77, w: this.width * 0.2, h: this.height * 0.18,
			label: "Solution",
			style: { r: 10, transparentOnWin: true },
			getText: () => this.solutionButton.state.showSolution ? (this.metaData.sols ? this.metaData.sols[0] : "Sorry, no solution 💀😭 Code is bugged") : "Solution",
			onClick: () => { this.solutionButton.state.showSolution = !this.solutionButton.state.showSolution; }
		});
		this.homeButton = new Button({
			x: this.width * 0.05, y: this.height * 0.05, w: max(60, this.width * 0.1), h: this.height * 0.1,
			label: "Home",
			style: {
				r: 10,
				onHoverMovement: -0.004,
				transparentOnWin: true
			},
			getText: () => "Home",
			onClick: () => { setScreen("title"); }
		});
		this.skipButton = new Button({
			x: max(this.width * 0.17, this.homeButton.x+this.homeButton.w+this.width*0.02), y: this.height * 0.05, w: max(60, this.width * 0.1), h: this.height * 0.1,
			label: "Skip",
			style: {
				r: 10,
				onHoverMovement: -0.004,
				transparentOnWin: true
			},
			getText: () => "Skip",
			onClick: () => { this.solved = true; },
			onHoverMovement: -0.0035
		});
	}

	setupBoxes() {
		const spaceConst = 0.8;
		const count = this.values.length;
		const boxW = this.width / (this.values.length+1);
		const boxH = this.height * 0.265;
		const spacing = this.width / (count + 2*spaceConst-1);
		this.boxes = this.values.map((v, i) => ({
			x: spacing * (i + spaceConst) - boxW / 2,
			y: this.height * 0.225,
			w: boxW,
			h: boxH,
			value: v,
			locName: i,
			drawScale: 0.7
		}));
	}

	setupOps() {
		const spaceConst = this.opSymbols.length>=8 ? 0.6 : 1.9;
		const syms = this.opSymbols;
		const btnW = this.width * (this.opSymbols.length>=8 ? 1.18 : 0.91) / (this.opSymbols.length+3);
		const btnH = this.height * 0.16;
		const spacing = this.width / (syms.length + 2*spaceConst-1);
		this.opButtons = syms.map((s, i) => new Operation(
			s,
			(a, b) => {
				switch (s) {
					case '+': return a.add(b);
					case '-': return a.subtract(b);
					case '×': return a.multiply(b);
					case '÷': return a.divide(b);
					case '^': return a.power(b);
					case '√': return a.sqrt();
					case 'ln': return a.naturalLog();
					case '!': return a.factorial();
					case 'sin': return a.sin();
					case 'cos': return a.cos();
					case 'tan': return a.tan();
					case 'cot': return a.cot();
					case 'acos': return a.acos();
					case 'asin': return a.asin();
					case 'abs': return a.abs();
					case '%': return a.modulo(b);
					case 'floor': return a.floor();
					case 'round': return a.mathDotRound();
					case 'ceil': return a.ceil();
					default:
						console.log("Invalid operator char");
						return new Complex("Invalid operator char");
				}
			},
			spacing * (i + spaceConst) - btnW / 2,
			this.height * 0.525,
			btnW,
			btnH
		));
		for(let btn of this.opButtons){
			btn.drawScale = 0.7;
		}
	}

	draw(showBackground = true) {
		const WIN_TIMER_START = 75;
		if (this.winTimer === 0 && this.boxes.length === 1 && this.boxes[0].value.equals24()) {
			this.winTimer = WIN_TIMER_START;
			setThemeColor(theme.backgroundColorCorrect);
		}
		if (this.winTimer > 0) {
			/*
			for(let b of this.opButtons){
				b.drawScale = smoothErp(this.winTimer/WIN_TIMER_START,3);
			}
			*/
			for(let b of this.boxes){
				if(b.value.equals24()){
					let factor = constrain((WIN_TIMER_START-this.winTimer)*0.006-0.03,-0.02,1);
					let vel = {
						x:(this.width/2-b.w/2-b.x)*factor,
						y:(this.height*0.32-b.h/2-b.y)*factor
					};
					b.x += vel.x;
					b.y += vel.y;
					b.drawOffset = 0;
					b.drawAngle = 0;
					b.drawScale = 1;
					// b.drawAngle = sq(3*factor)*(0.5-b.locName%2);
					// b.drawScale = 1+constrain(dist(0,0,vel.x,vel.y),0,10)*0.03;
				}
			}
			if(showBackground){
				background(theme.backgroundColorCorrect);
			}
			this.winTimer--;
			if (this.winTimer <= 0) {
				this.solved = true;
				return;
			}
		} else {
			if(showBackground){
				background(theme.backgroundColor);
			}
		}
		this.drawOps();
		this.drawBoxes();
		this.undoButton.draw(this.winTimer > 0);
		this.hintButton.draw(this.winTimer > 0);
		this.solutionButton.draw(this.winTimer > 0);
		this.homeButton.draw(this.winTimer > 0);
		this.skipButton.draw(this.winTimer > 0);
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
			if(b.drawOffset === undefined){
				b.drawOffset = 0;
			}
			if (i === this.firstIndex || mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
				b.drawOffset -= this.height*0.005;
			}
			push();
			translate(b.x+b.w/2,b.y+b.h/2);
			scale(b.drawScale);
			translate(0,b.drawOffset);
			rotate(b.drawAngle);
			translate(-b.x-b.w/2,-b.y-b.h/2);


			stroke(100,93,85); strokeWeight(3);
			drawShadedButton(b.x,b.y,b.w,b.h,15,this.firstIndex===i ? theme.shadeColorCorrect : theme.shadeColor,this.firstIndex===i ? color(225,255,180) : color(255,255,255));

			noStroke();
			textAlign(CENTER, CENTER);

			let minFontSize = min(this.height * 0.05, this.width * 0.07);
			let maxFontSize = max(minFontSize,min((this.height+this.width/2) * 0.08, this.height*0.22));

			if (b.value instanceof Rational) {
				fill(b.value.getColor());
				let numerator = b.value.numerator;
				let denominator = b.value.denominator;
				if(isNaN(numerator)){
					numerator = "🤯⁉️";
				}
				if(isNaN(denominator)){
					denominator = "😭🥀";
				}
				if (b.value.isInteger()) {
					drawTextInBox(numerator,b.x+b.w*0.015,b.y,b.w*0.97,b.h,maxFontSize,minFontSize,b.value.getColor());
				} else {
					let maxLineWidth = b.w*0.4;
					maxLineWidth=max(maxLineWidth,drawTextInBox(numerator,b.x+b.w*0.015,b.y,b.w*0.97,b.h*0.485,max(minFontSize,maxFontSize*0.75),minFontSize,b.value.getColor()));
					maxLineWidth=max(maxLineWidth,drawTextInBox(denominator,b.x+b.w*0.015,b.y+b.h*0.485,b.w*0.97,b.h*0.485,max(minFontSize,maxFontSize*0.75),minFontSize,b.value.getColor()));
					maxLineWidth=min(maxLineWidth,b.w*0.97);
					
					const lineY = b.y + b.h / 2 - textDescent()/2; // compensate for missing "bottom" of numerical chars to be truly centered
					push();
					strokeWeight(this.height*0.008);
					stroke(0);
					line(b.x + (b.w-maxLineWidth)/2, lineY, b.x + (b.w+maxLineWidth)/2, lineY);
					pop();
				}
			} else {
				drawTextInBox(b.value.getText(),b.x+b.w*0.015,b.y,b.w*0.97,b.h,(this.height+this.width/2) * 0.08,min(this.height * 0.05, this.width * 0.07),b.value.getColor());
				
				/*
					// older version slightly different

					fill(b.value.getColor());
					fill(0,255,0,150);
					let txt = b.value.getText();
					const maxWidth = b.w - 7;
					const maxHeight = b.h - 7;
					const fallbackFontSize = min(this.height * 0.05, this.width * 0.07);

					textSize(fallbackFontSize);
					let fallbackWidth = textWidth(txt);
					let fallbackHeight = fallbackFontSize * 1.2;

					if (fallbackWidth <= maxWidth && fallbackHeight <= maxHeight) {
						let low = fallbackFontSize, high = (this.height+this.width/2) * 0.08, bestSize = fallbackFontSize;
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

						const lineHeight = fallbackFontSize * 1.05;
						const startY = b.y + b.h / 2 - (lines.length - 1) * lineHeight / 2 + 3;

						lines.forEach((line, j) => {
							text(line, b.x + b.w/2, startY + j * lineHeight);
						});
					}
				*/
			}
			pop();

			b.drawAngle *= 0.8;
			b.drawScale = 1+(b.drawScale-1)*0.9;
			b.drawOffset *= 0.8;
		});
	}



	drawOps() {
		this.opButtons.forEach(btn => btn.draw(this.selectedOp === btn, this.winTimer > 0));
	}

	undo() {
		if (!this.history.length) return;
		if(this.undoButton.drawScale>0.99){
			this.undoButton.drawScale -= 0.1;
		}
		this.undoButton.drawScale -= 0.08;
		const prev = this.history.pop();
		if(this.useRational){
			this.boxes = prev.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Rational(b.value.numerator, b.value.denominator),
				locName: b.locName
			}));
		}
		else{
			this.boxes = prev.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Complex(b.value.real, b.value.imag),
				locName: b.locName
			}));
		}
		this.firstIndex = null;
		this.selectedOp = null;
	}

	applyOperation(i1, i2, opBtn) {
		this.saveState();
		const a = this.boxes[i1].value;
		const b = this.boxes[i2].value;

		let res;
		if (a instanceof Rational && b instanceof Rational) {
			switch (opBtn.symbol) {
				case '+':
					res = a.add(b);
					break;
				case '-':
					res = a.subtract(b);
					break;
				case '×':
					res = a.multiply(b);
					break;
				case '÷':
					res = a.divide(b);
					break;
				default:
					throw new Error(`Unsupported operator for Rational: ${opBtn.symbol}`);
			}
		} else {
			res = opBtn.apply(a, b);
		}

		this.boxes[i2].value = res;
		this.boxes[i2].drawScale += 0.1;
		this.boxes.splice(i1, 1);

		// new selection
		const newIndex = i1 < i2 ? i2 - 1 : i2;
		this.firstIndex = newIndex;
		this.selectedOp = null;  // remove this to easily repeat operation
	}

	symbolIsUnary(symbol){
		// when adding any non-unary operator, update this list
		return !(symbol === '+' || symbol === '-' || symbol === '×' || symbol === '÷' || symbol === '^' || symbol === '%');
	}
	saveState() {
		let snap;
		if(this.useRational){
			snap = this.boxes.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Rational(b.value.numerator, b.value.denominator),
				locName: b.locName
			}));
		}
		else{
			snap = this.boxes.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Complex(b.value.real, b.value.imag),
				locName: b.locName
			}));
		}

		const last = this.history[this.history.length - 1];
		if (last && JSON.stringify(snap) === JSON.stringify(last)) return;

		this.history.push(snap);
		
		if (this.history.length > 5000) this.history.splice(1, 1); // preserve the original one
	}

	getHint() {
		let hint = "";
		if(this.metaData.hint===undefined){
			let factorable = this.metaData.factorable;
			let needsFrac = this.metaData.needsFrac;
			let solCount = this.metaData.sols.length;
			hint += solCount+" known solution";
			if(solCount!==1){
				hint += "s";
			}
			hint += ". ";
			if(solCount!==0){
				let sol = this.metaData.sols[0];
				if(needsFrac!==undefined){
					if(needsFrac){
						hint += "Fractions are required. ";
					}
					else{
						hint += "Doesn't need fractions. ";
					}
				}
				if(factorable!==undefined){
					if(factorable){
						// not a great hint lol
						// hint += "It is also possible to make two numbers multiply to 24. ";
					}
					else{
						hint += "Final step CAN'T be multiplication. ";
					}
				}

				let finalStep;
				// simplifcation for some classic levels
				let shorten = false;
				// remove 1s
				while(sol.length>=2&&sol[sol.length-1]==="1"&&(["÷","×"].includes(sol[sol.length-2]))){
					sol = sol.substring(0,sol.length-2);
				}
				while(sol.length>=2&&sol[0]==="1"&&(["÷","×"].includes(sol[1]))){
					sol = sol.substring(2);
				}
				if(sol.length>=4&&sol[sol.length-1]===sol[sol.length-3]&&["1","2","3","4","5","6","7","8","9"].includes(sol[sol.length-1])){
					if((sol[sol.length-2]==="÷"&&sol[sol.length-4]==="×")||(sol[sol.length-2]==="×"&&sol[sol.length-4]==="÷")){
						// could just make 1 first and multiply 1
						shorten = true;
					}
					if((sol[sol.length-2]==="-"&&sol[sol.length-4]==="+")||(sol[sol.length-2]==="+"&&sol[sol.length-4]==="-")){
						// could just make 0 first and add 0
						shorten = true;
					}
				}
				if(shorten){
					finalStep = getFinalStep(sol.substring(0,sol.length-4));
					if(finalStep.startsWith("getFinalStep failed")){
						console.log("getFinalStep failed on simplified sol. using original")
						finalStep = getFinalStep(sol);
					}
				}
				else{
					finalStep = getFinalStep(sol);
				}
				hint += "Possible final step: " + finalStep; 
			}
		}
		else{
			hint = this.metaData.hint;
		}
		return hint;
	}

	handleClick(mx, my) {
		// General button clicks
		const buttons = [this.undoButton, this.hintButton, this.solutionButton, this.homeButton, this.skipButton];
		for(const btn of buttons) {
			if(btn.contains(mx, my)) {
				btn.drawScale -= 0.08;
				btn.onClick();
				return;
			}
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
					b.drawScale -= 0.065;
					this.firstIndex = i;
					return;
				}

				// if op selected but no first, shouldn't reach here (firstIndex non-null)

				// if number selected but no op, switch selection
				if (this.firstIndex !== null && this.selectedOp === null) {
					b.drawScale -= 0.065;
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
				if (this.symbolIsUnary(btn.symbol)) {
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
					else{
						btn.drawAngle -= 0.16;
					}
					return;
				} else {
					/*
					OLD version where you can select op before any numbers
					// Binary op: select/deselect
					this.selectedOp = (this.selectedOp === btn) ? null : btn;
					if(this.selectedOp === btn){
						btn.drawScale -= 0.065;
					}
					*/
					if(this.firstIndex===null){
						btn.drawAngle -= 0.16;
					}
					else{
						this.selectedOp = (this.selectedOp === btn) ? null : btn;
						if(this.selectedOp === btn){
							btn.drawScale -= 0.065;
						}
					}
				}
				return;
			}
		}
	}

	handleKey(e) {
		const key = e.key;

		// if (key === 'S'){
		// 	this.solved = true;
		// }
		// if (key === 'H'){
		// 	screen = "title";
		// }

		if (key === '\\'){
			this.opSymbols = Level.SYMBOLS;
			this.setupOps();
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
				let valMatch;
				if(this.useRational){
					valMatch = (v.isInteger() && v.numerator.toString() === key);
				}
				else{
					valMatch = (v.imag === 0 && v.real.toString() === key);
				}
				if (valMatch && (i !== this.firstIndex || !(this.firstIndex !== null && this.selectedOp))) {
					if (this.firstIndex !== null && this.selectedOp) {
						this.applyOperation(this.firstIndex, i, this.selectedOp);
					} else {
						this.firstIndex = i;
						this.boxes[i].drawScale -= 0.065;
					}
					return;
				}
			}
			// (didn't find it) deselection
			if(this.firstIndex!==null&&this.selectedOp){
				let v = this.boxes[this.firstIndex].value;

				let valMatch;
				if(this.useRational){
					valMatch = (v.isInteger() && v.numerator.toString() === key);
				}
				else{
					valMatch = (v.imag === 0 && v.real.toString() === key);
				}

				if (valMatch){
					this.firstIndex = null;
					this.selectedOp = null;
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
			'!': '!',
			'|': 'abs',
			'%': '%',
			'x': '×', // sus
		};
		if (key in opKeyMap) {
			const symbol = opKeyMap[key];
			// Find op button with this symbol
			for (let btn of this.opButtons) {
				if (btn.symbol === symbol) {
					// For unary ops, apply immediately if number selected
					if (this.symbolIsUnary(symbol)) {
						if (this.firstIndex === null) {
							btn.drawAngle -= 0.16;
						}
						else{
							this.saveState();
							const a = this.boxes[this.firstIndex].value;
							const res = btn.apply(a, null);
							this.boxes[this.firstIndex].value = res;
							this.boxes[this.firstIndex].drawScale += 0.1;
							this.selectedOp = null;
							btn.drawScale -= 0.08;
						}
						return;
					} else {
						if(this.firstIndex===null){
							btn.drawAngle -= 0.16;
						}
						else{
							this.selectedOp = (this.selectedOp === btn) ? null : btn;
							if(this.selectedOp){
								btn.drawScale -= 0.065;
							}
						}
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
					if (this.boxes[i].locName === loc){
						if (this.firstIndex !== null && this.selectedOp) {
							if(i === this.firstIndex) {
								this.firstIndex = null;
								this.selectedOp = null;
							}
							else {
								this.applyOperation(this.firstIndex, i, this.selectedOp);
							}
						} else {
							this.firstIndex = i;
							this.boxes[i].drawScale -= 0.065;
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
