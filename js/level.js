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
	static SYMBOLS = ["+","-","×","÷","^","√","ln","!","sin","cos","tan","cot","asin","acos","sec","csc","abs","%"]; // round, floor, and ceil are not included for space purposes
	static WIN_TIMER_START = 70;
	static BACK_SLASH_CHEAT = false;

	constructor(numbers, opSymbols = Level.SYMBOLS, metaData = {}, useRational = false) {
		this.metaData = metaData;
		this.values = numbers.map(n => useRational ? new Rational(n, 1) : new Complex(n));
		this.originalValues = numbers.map(n => useRational ? new Rational(n, 1) : new Complex(n));
		this.opSymbols = opSymbols;
		this.firstIndex = null;
		this.selectedOp = null;
		this.history = [];
		this.winTimer = 0;
		this.solved = false; // for external use (to make a new Level after 24 is made and the win timer has finished)
		this.useRational = useRational;
		this.hintUsed = false; // becomes true forever once the hint has been revealed at least once

		this.watcherSequence = new Sequence(undefined, useRational);
		this.sourceIdOfPos = numbers.map(n => -1);

		this.setupBoxes();
		this.setupOps();
		this.reSetupLayout(width,height);
	}

	reSetupLayout(w=width,h=height) {
		this.width = w;
		this.height = h;

		this.selectedOp = null;
		this.firstIndex = null;
		this.reSetupBoxes();
		this.reSetupOps();
		this.undoButton = new Button({
			x: this.width * 0.05, y: this.height * 0.77, w: this.width * 0.22, h: this.height * 0.18,
			label: "Undo",
			style: {
				r: 10,
				onHoverMovement: -0.004,
				transparentOnWin: true
			},
			getText: () => TRANSLATIONS[currentLang].level.undoButton,
			onClick: () => {
				if(this.history.length){
					this.undo();
				} else {
					this.undoButton.drawAngle -= 0.16;
				}
			}
		});
		this.hintButton = new Button({
			x: this.width * 0.45, y: this.height * 0.77, w: this.width * 0.3, h: this.height * 0.18,
			label: "Hint",
			style: {
				r: 10,
				onHoverMovement: -0.004,
				transparentOnWin: true
			},
			getText: () => this.hintButton.state.showHint ? this.getHint() : TRANSLATIONS[currentLang].level.hintButton,
			onClick: () => {
				this.hintButton.state.showHint = !this.hintButton.state.showHint;
				if (this.hintButton.state.showHint) {
					this.hintUsed = true; // remember for good, even if the hint is toggled back off
					// Apply active theme colors
					this.hintButton.style.mainColor = theme.selectedColor;
					this.hintButton.style.shadeColor = theme.shadeColorCorrect;
				} else {
					// Clear custom colors to trigger button.js default fallbacks
					this.hintButton.style.mainColor = undefined;
					this.hintButton.style.shadeColor = undefined;
				}
			}
		});
		this.solutionButton = new Button({
			x: this.hintButton.x+this.hintButton.w+2, y: this.height * 0.77, w: this.width * 0.2, h: this.height * 0.18,
			label: "Solution",
			style: {
				r: 10,
				onHoverMovement: -0.004,
				transparentOnWin: true
			},
			getText: () => this.solutionButton.state.showSolution ? (this.metaData.sols ? this.metaData.sols[0] : "Sorry, no solution 💀😭 Code is bugged") : (TRANSLATIONS[currentLang].level.solutionButton),
			onClick: () => { 
				this.solutionButton.state.showSolution = !this.solutionButton.state.showSolution; 
				if (this.solutionButton.state.showSolution) {
					// Apply active theme colors
					this.solutionButton.style.mainColor = theme.selectedColor;
					this.solutionButton.style.shadeColor = theme.shadeColorCorrect;
				} else {
					// Clear custom colors to trigger button.js default fallbacks
					this.solutionButton.style.mainColor = undefined;
					this.solutionButton.style.shadeColor = undefined;
				}
			}
		});
		this.homeButton = new Button({
			x: this.width * 0.05, y: this.height * 0.05, w: max(60, this.width * 0.1), h: this.height * 0.1,
			label: "Home",
			style: {
				r: 10,
				onHoverMovement: 0.004,
				transparentOnWin: true
			},
			getText: () => TRANSLATIONS[currentLang].level.homeButton,
			onClick: () => { setScreen("title"); }
		});
		this.skipButton = new Button({
			x: this.homeButton.x+this.homeButton.w+2, y: this.height * 0.05, w: max(60, this.width * 0.1), h: this.height * 0.1,
			label: "Skip",
			style: {
				r: 10,
				onHoverMovement: 0.004,
				transparentOnWin: true
			},
			getText: () => TRANSLATIONS[currentLang].level.skipButton,
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
	reSetupBoxes() {
		const spaceConst = 0.8;
		const count = this.values.length;
		const boxW = this.width / (this.values.length+1);
		const boxH = this.height * 0.265;
		const spacing = this.width / (count + 2*spaceConst-1);
		for(let b of this.boxes){
			let i = b.locName;
			b.x = spacing * (i + spaceConst) - boxW / 2;
			b.y = this.height * 0.225;
			b.w = boxW;
			b.h = boxH;
		}
	}

	setupOps() {
		this.reSetupOps(0.7); // scuffed but yeah this is just that but with the animation
	}
	reSetupOps(drawScale) {
		const spaceConst = this.opSymbols.length>=8 ? 0.6 : 1.9;
		const syms = this.opSymbols;
		const btnW = this.width * (this.opSymbols.length>=8 ? 1.18 : 0.91) / (this.opSymbols.length+3);
		const btnH = this.height * 0.16;
		const spacing = this.width / (syms.length + 2*spaceConst-1);
		let drawScales = [];
		for(let i = 0; i<syms.length; i++){
			if(drawScale!==undefined){
				drawScales.push(drawScale);
			}
			else if(this.opButtons!==undefined&&i<this.opButtons.length&&this.opButtons[i].drawScale!==undefined){
				drawScales.push(this.opButtons[i].drawScale);
			}
			else{
				drawScales.push(1);
			}
		}
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
					case 'sec': return a.sec();
					case 'csc': return a.csc();
					case 'abs': return a.abs();
					case '%': return a.modulo(b);
					case 'floor': return a.floor();
					case 'round': return a.mathDotRound();
					case 'ceil': return a.ceil();
					default:
						console.log ("Invalid operator char");
						return new Complex("Invalid operator char");
				}
			},
			spacing * (i + spaceConst) - btnW / 2,
			this.height * 0.525,
			btnW,
			btnH,
			this.watcherSequence,
			this.useRational
		));
		for(let i = 0; i<this.opButtons.length; i++){
			this.opButtons[i].drawScale = drawScales[i];
		}
	}

	draw(showBackground = true) {
		if(showBackground){
			if (this.winTimer > 0) {
				background(theme.backgroundColorCorrect);
			}
			else {
				if (screen === "battle" || screen === "battleMaster") {
					drawBattleBackground();
				}
				else {
					background(theme.backgroundColor);
				}
			}
		}
		this.drawOps();
		this.drawBoxes();
		this.undoButton.draw(this.winTimer > 0);
		this.homeButton.draw(this.winTimer > 0);

		// bodgey but yeah. if battle screen then DONT do these.
		if (typeof screen !== 'undefined' && !(screen === "battle" || screen === "battleMaster")) {
			this.hintButton.draw(this.winTimer > 0);
			this.solutionButton.draw(this.winTimer > 0);
			this.skipButton.draw(this.winTimer > 0);
		}

		
		if (this.winTimer === 0 && this.boxes.length === 1 && this.boxes[0].value.equals24()) { // MOMENT OF WIN
			this.winTimer = Level.WIN_TIMER_START;
			this.recordWinToLocalStorage();
			incrementGameCounter();
			setThemeColor(theme.backgroundColorCorrect);
		}
		if (this.winTimer > 0) {
			/*
			for(let b of this.opButtons){
				b.drawScale = smoothErp(this.winTimer/Level.WIN_TIMER_START,3);
			}
			*/
			for(let b of this.boxes){
				if(b.value.equals24()){
					let factor = constrain((Level.WIN_TIMER_START-this.winTimer)*0.006-0.03,-0.02,1);
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
			this.winTimer--;
			if (this.winTimer <= 0) {
				this.solved = true;
				return;
			}
		}
	}
	drawBoxes() { // distinct from the titleScreen set boxes, which draw chinese bigger
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
			drawShadedButton(b.x,b.y,b.w,b.h,15,this.firstIndex===i ? theme.shadeColorCorrect : theme.shadeColor,this.firstIndex===i ? theme.selectedColor : color(255,255,255));

			noStroke();
			textAlign(CENTER, CENTER);

			let minFontSize = min(this.height * 0.05, this.width * 0.07);
			let maxFontSize = max(minFontSize,min((this.height+this.width/2) * 0.08, this.height*0.22));

			if (b.value instanceof Rational) {
				let col = b.value.getColor();
				fill(col);
				let numerator = b.value.numerator;
				let denominator = b.value.denominator;
				if(isNaN(numerator)){
					numerator = "🤯";
				}
				if(isNaN(denominator)){
					denominator = "❓";
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
					stroke(col);
					line(b.x + (b.w-maxLineWidth)/2, lineY, b.x + (b.w+maxLineWidth)/2, lineY);
					pop();
				}
			} else {
				drawTextInBox(b.value.getText(true),b.x+b.w*0.015,b.y,b.w*0.97,b.h,(this.height+this.width/2) * 0.08,min(this.height * 0.05, this.width * 0.07),b.value.getColor());
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

		this.sourceIdOfPos = prev.sourceIds.slice();
		if(this.useRational){
			this.boxes = prev.boxes.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Rational(b.value.numerator, b.value.denominator),
				locName: b.locName
			}));
		}
		else{
			this.boxes = prev.boxes.map(b => ({
				x: b.x, y: b.y, w: b.w, h: b.h,
				value: new Complex(b.value.real, b.value.imag),
				locName: b.locName
			}));
		}
		this.firstIndex = null;
		this.selectedOp = null;
		this.watcherSequence.actions.pop();
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
			this.watcherSequence.actions.push({
				a:a,
				s:opBtn.symbol,
				b:b,
				aId:this.sourceIdOfPos[this.boxes[i1].locName],
				bId:this.sourceIdOfPos[this.boxes[i2].locName]
			});
			// console.log(this.watcherSequence.toExpr());
		} else {
			res = opBtn.apply(a, b, this.sourceIdOfPos[this.boxes[i1].locName], this.sourceIdOfPos[this.boxes[i2].locName]);
		}

		// Battle mode: this result may register a "doubler" for the player's team
		// (the battle master decides whether it counts and applies the effect).
		maybeBroadcastBattleDoublerAction(res);

		this.sourceIdOfPos[this.boxes[i2].locName] = this.watcherSequence.actions.length-1;
		this.boxes[i2].value = res;
		this.boxes[i2].drawScale += 0.1;
		this.boxes.splice(i1, 1);

		// new selection
		const newIndex = i1 < i2 ? i2 - 1 : i2;
		this.firstIndex = newIndex;
		this.selectedOp = null;  // remove this to easily repeat operation
	}

	saveState() {
		let snap;
		if(this.useRational){
			snap = {
				sourceIds:this.sourceIdOfPos.slice(),
				boxes:this.boxes.map(b => ({
					x: b.x, y: b.y, w: b.w, h: b.h,
					value: new Rational(b.value.numerator, b.value.denominator),
					locName: b.locName
				}))
			};
		}
		else{
			snap = {
				sourceIds:this.sourceIdOfPos.slice(),
				boxes:this.boxes.map(b => ({
					x: b.x, y: b.y, w: b.w, h: b.h,
					value: new Complex(b.value.real, b.value.imag),
					locName: b.locName
				}))
			};
		}

		const last = this.history[this.history.length - 1];
		if (last && JSON.stringify(snap) === JSON.stringify(last)) return;

		this.history.push(snap);
		
		if (this.history.length > 10000) this.history.splice(1, 1); // preserve the original one
	}

	getHint() {
		const custom_hints = this.metaData?.hint;
		if (custom_hints && typeof custom_hints === 'object') {
			const selectedHint = custom_hints[currentLang] ?? custom_hints.english;
			if (typeof selectedHint === 'string') return selectedHint;
		}

		let hint = "";
		let factorable = this.metaData.factorable;
		let needsFrac = this.metaData.needsFrac;
		let solCount = this.metaData.sols.length;
		if(currentLang==="english"){
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
						console.log ("getFinalStep failed on simplified sol. using original")
						finalStep = getFinalStep(sol);
					}
				}
				else{
					finalStep = getFinalStep(sol);
				}
				hint += (solCount===1 ? "Final step: " : "Possible final step: ") + finalStep; 
			}
		}
		else if(currentLang==="chinese_simplified"){ // simplified chinese
			hint += "已知解法："+solCount+"种。";
			if(solCount!==0){
				let sol = this.metaData.sols[0];
				if(needsFrac!==undefined){
					if(needsFrac){
						hint += "需要分数。";
					}
					else{
						hint += "不需要分数。";
					}
				}
				if(factorable!==undefined){
					if(!factorable){
						hint += "最后一步不能是乘法。";
					}
				}

				let finalStep;
				let shorten = false;
				while(sol.length>=2&&sol[sol.length-1]==="1"&&(["÷","×"].includes(sol[sol.length-2]))){
					sol = sol.substring(0,sol.length-2);
				}
				while(sol.length>=2&&sol[0]==="1"&&(["÷","×"].includes(sol[1]))){
					sol = sol.substring(2);
				}
				if(sol.length>=4&&sol[sol.length-1]===sol[sol.length-3]&&["1","2","3","4","5","6","7","8","9"].includes(sol[sol.length-1])){
					if((sol[sol.length-2]==="÷"&&sol[sol.length-4]==="×")||(sol[sol.length-2]==="×"&&sol[sol.length-4]==="÷")){
						shorten = true;
					}
					if((sol[sol.length-2]==="-"&&sol[sol.length-4]==="+")||(sol[sol.length-2]==="+"&&sol[sol.length-4]==="-")){
						shorten = true;
					}
				}
				if(shorten){
					finalStep = getFinalStep(sol.substring(0,sol.length-4));
					if(finalStep.startsWith("getFinalStep failed")){
						console.log ("getFinalStep failed on simplified sol. using original")
						finalStep = getFinalStep(sol);
					}
				}
				else{
					finalStep = getFinalStep(sol);
				}
				hint += (solCount===1 ? "最后一步：" : "可能的最后一步：") + finalStep;
			}
		}
		else if(currentLang==="chinese_traditional"){ // traditional chinese
			hint += "已知解法："+solCount+"種。";
			if(solCount!==0){
				let sol = this.metaData.sols[0];
				if(needsFrac!==undefined){
					if(needsFrac){
						hint += "需要分數。";
					}
					else{
						hint += "不需要分數。";
					}
				}
				if(factorable!==undefined){
					if(!factorable){
						hint += "最後一步不能是乘法。";
					}
				}

				let finalStep;
				let shorten = false;
				while(sol.length>=2&&sol[sol.length-1]==="1"&&(["÷","×"].includes(sol[sol.length-2]))){
					sol = sol.substring(0,sol.length-2);
				}
				while(sol.length>=2&&sol[0]==="1"&&(["÷","×"].includes(sol[1]))){
					sol = sol.substring(2);
				}
				if(sol.length>=4&&sol[sol.length-1]===sol[sol.length-3]&&["1","2","3","4","5","6","7","8","9"].includes(sol[sol.length-1])){
					if((sol[sol.length-2]==="÷"&&sol[sol.length-4]==="×")||(sol[sol.length-2]==="×"&&sol[sol.length-4]==="÷")){
						shorten = true;
					}
					if((sol[sol.length-2]==="-"&&sol[sol.length-4]==="+")||(sol[sol.length-2]==="+"&&sol[sol.length-4]==="-")){
						shorten = true;
					}
				}
				if(shorten){
					finalStep = getFinalStep(sol.substring(0,sol.length-4));
					if(finalStep.startsWith("getFinalStep failed")){
						console.log ("getFinalStep failed on simplified sol. using original")
						finalStep = getFinalStep(sol);
					}
				}
				else{
					finalStep = getFinalStep(sol);
				}
				hint += (solCount===1 ? "最後一步：" : "可能的最後一步：") + finalStep;
			}
		}
		return hint;
	}

	recordWinToLocalStorage() {
		const record = {
			originalValues: this.originalValues.map(v => this.useRational ? (v.numerator / v.denominator) : v.real),
			opSymbols: this.opSymbols.slice(),
			hintUsed: this.hintUsed,
			screen: (typeof screen !== 'undefined') ? screen : null,
			solution: this.watcherSequence.toExpr(),
			timestamp: Date.now()
		};

		let history;
		try {
			history = JSON.parse(localStorage.getItem('winHistory')) || [];
			if (!Array.isArray(history)) history = [];
		} catch (e) {
			history = [];
		}

		history.push(record);

		try {
			localStorage.setItem('winHistory', JSON.stringify(history));
		} catch (e) {
			console.log("Failed to save victory to localStorage", e);
		}
	}

	handleClick(mx, my) {
		// bodgey but, don't do these superbuttons if battle
		let buttons = [this.undoButton, this.homeButton];
		if (typeof screen !== 'undefined' && !(screen === "battle" || screen === "battleMaster")) {
			buttons.push(this.hintButton, this.solutionButton, this.skipButton);
		}
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
				if (symbolIsUnary(btn.symbol)) {
					if (this.firstIndex !== null) {
						btn.drawScale -= 0.08;
						// Apply unary op immediately to selected box
						this.saveState();
						const a = this.boxes[this.firstIndex].value;
						// For unary, ignore b param
						const res = btn.apply(a, null, this.sourceIdOfPos[this.boxes[this.firstIndex].locName]);
						maybeBroadcastBattleDoublerAction(res);
						this.sourceIdOfPos[this.boxes[this.firstIndex].locName] = this.watcherSequence.actions.length-1;
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

		if (key === '\\' && Level.BACK_SLASH_CHEAT){
			this.opSymbols = Level.SYMBOLS;
			this.setupOps();
		}
		if (key === 'u' || key === 'z' || key === 'Backspace'){
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
			'x': '×',
			'=': '+', // for typo or tryhard
		};
		if (key in opKeyMap) {
			const symbol = opKeyMap[key];
			// Find op button with this symbol
			for (let btn of this.opButtons) {
				if (btn.symbol === symbol) {
					// For unary ops, apply immediately if number selected
					if (symbolIsUnary(symbol)) {
						if (this.firstIndex === null) {
							btn.drawAngle -= 0.16;
						}
						else{
							this.saveState();
							const a = this.boxes[this.firstIndex].value;
							const res = btn.apply(a, null, this.sourceIdOfPos[this.boxes[this.firstIndex].locName]);
							maybeBroadcastBattleDoublerAction(res);
							this.sourceIdOfPos[this.boxes[this.firstIndex].locName] = this.watcherSequence.actions.length-1;
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

		if (key.length === 1) {
			const layout = "qwertyuiop"; // first row of keyboard
			const idx = layout.indexOf(key.toLowerCase());
			if (idx !== -1) {
				for (let i = 0; i < this.boxes.length; i++) {
					if (this.boxes[i].locName === idx) {
						if (this.firstIndex !== null && this.selectedOp) {
							if (i === this.firstIndex) {
								this.firstIndex = null;
								this.selectedOp = null;
							} else {
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

// Returns EVERY doubler reason a value satisfies (not just the first match),
// so a single number can simultaneously count for multiple doublers
function getBattleDoublerActionReasons(value) {
    const reasons = [];
    if (value instanceof Rational) {
        if (isNaN(value.numerator) || isNaN(value.denominator)) {
            // an undefined value can't also be meaningfully "negative" or "non-integer"
            reasons.push("invalid_number");
            return reasons;
        }
        if (value.numerator / value.denominator > 24) reasons.push("over_24"); // maybe try multiplying both sides by denomatinor for more precision?
        if (value.numerator / value.denominator > 9000) reasons.push("over_9000");
        if (!value.isInteger()) reasons.push("non_integer");
        if (value.numerator < 0) reasons.push("negative_number");
        return reasons;
    }
    if (value instanceof Complex) {
        if (value.isNaN()) {
            reasons.push("invalid_number");
            return reasons;
        }
        if (value.imag === 0 && value.real > 24) reasons.push("over_24");
        if (value.imag === 0 && value.real > 9000) reasons.push("over_9000");
        if (value.imag !== 0) reasons.push("non_real");
        if (value.imag !== 0 || (Number.isFinite(value.real) && Math.round(value.real) !== value.real)) reasons.push("non_integer");
        if (value.imag === 0 && Number.isFinite(value.real) && value.real < 0) reasons.push("negative_number");
        return reasons;
    }
    return reasons;
}

function maybeBroadcastBattleDoublerAction(value) {
	const reasons = getBattleDoublerActionReasons(value);
	if (!reasons.length) return;
	if (typeof screen === 'undefined' || screen !== "battle") return;
	if (!battleTeam) return;
	if (typeof broadcastBattleDoublerAction === 'function') {
		broadcastBattleDoublerAction(reasons);
	}
}

// Battle mode: a freshly loaded level's starting numbers should ALSO be checked
// for doublers, not just numbers produced later by operations.
function maybeBroadcastBattleDoublersForInitialValues(levelInstance) {
	if (!levelInstance || !levelInstance.originalValues) return;
	for (const value of levelInstance.originalValues) {
		maybeBroadcastBattleDoublerAction(value);
	}
}

Level.setupKeyboard = function(levelInstance, override = true) {
	if (override || !window._levelKeyboardHandler) {
		// If there's an existing handler, remove it first
		if (window._levelKeyboardHandler) {
			window.removeEventListener('keydown', window._levelKeyboardHandler);
		}

		// Create and assign the new handler
		window._levelKeyboardHandler = function(e) {
			if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
			levelInstance.handleKey(e);
		};

		window.addEventListener('keydown', window._levelKeyboardHandler);
	}
};