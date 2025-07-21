const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "title";
let level;
let titleScreen;
let classicSets = [[], [], [], [], []];
let puzzleSets = [[], [], [], []];
let currentLevelSet = null;
let currentUsedIndices = []; // Keeps track of used indices
let currentIsClassic = true;
let theme;

function preload() {
	loadJSON("levelData/classicLevelsEasy.json", data => { classicSets[0] = data; });
	loadJSON("levelData/classicLevelsMedium.json", data => { classicSets[1] = data; });
	loadJSON("levelData/classicLevelsHard.json", data => { classicSets[2] = data; });
	loadJSON("levelData/classicLevelsTricky.json", data => { classicSets[3] = data; });
	loadJSON("levelData/classicLevelsCooked.json", data => { classicSets[4] = data; });
	loadJSON("levelData/puzzleLevelsSimple.json", data => { puzzleSets[0] = data; });
	loadJSON("levelData/puzzleLevelsInteresting.json", data => { puzzleSets[1] = data; });
	loadJSON("levelData/puzzleLevelsCrazyHard.json", data => { puzzleSets[2] = data; });
	loadJSON("levelData/puzzleLevelsJavascript.json", data => { puzzleSets[3] = data; });
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	titleScreen = new TitleScreen();
	screen = "title";
	theme = {
		shadeColor : color(255,0,255),
		shadeColorCorrect : color(155,200,155),
		backgroundColor : color(210,225,250),
		backgroundColorCorrect : color(160,205,120)
	};
}

function getRandomLevel(levelSet, previousCards, defaultOps = Level.SYMBOLS, overrideOps = false, usedIndices = [], shuffleCards) {
	let lvl, index;
	let cont = true;
	for (let tries = 0; tries < 1000 && cont; tries++) {
		if (tries === 999) {
			console.log("reached try #999 in getRandomLevel");
		}
		index = floor(random(0, levelSet.length));
		if (usedIndices.includes(index)) continue;

		lvl = levelSet[index];
		if (previousCards === undefined || lvl.cards.length !== previousCards.length) {
			cont = false;
			break;
		}
		let sortedCards = lvl.cards.toSorted();
		let sortedPreviousCards = previousCards.toSorted();
		for (let i = 0; i < sortedCards.length; i++) {
			if (sortedCards[i] !== sortedPreviousCards[i]) {
				cont = false;
				break;
			}
		}
	}

	// track used index
	usedIndices.push(index);
	if (usedIndices.length > min(levelSet.length-3,50)) usedIndices.shift();

	let ops = defaultOps;
	if (!overrideOps && lvl.ops !== undefined) {
		ops = lvl.ops;
	}
	let cards;
	if(shuffleCards){
		cards = shuffle(lvl.cards);
	}
	else{
		cards = lvl.cards;
	}
	return new Level(cards, ops, lvl);
}

/*
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}
*/

function draw() {
	if (screen === "title") {
		titleScreen.draw();
	} else if (screen === "game") {
		background(220);
		level.draw();
		if (level.solved) {
			level = getRandomLevel(currentLevelSet, level.originalValues.map(c => c.real),
				currentIsClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS, false, currentUsedIndices, !currentIsClassic);
			Level.setupKeyboard(level);
		}
	}
}

function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	} else if (screen === "title") {
		titleScreen.handleClick(mouseX, mouseY);
	}
}

function touchStarted() {
	mousePressed();
	return false;
}

function getFinalStep(expr) {
    // remove spaces
    expr = expr.replace(/\s+/g, "");

    // tokenize into numbers and operators/parentheses
    const tokenize = s => {
        let t = [], num = "";
        for (let c of s) {
            if (/\d/.test(c)) {
                num += c;
            } else {
                if (num) { t.push(num); num = ""; }
                t.push(c);
            }
        }
        if (num) t.push(num);
        return t;
    };

    // apply one binary operation at index i (so tokens[i] is op)
    // replace tokens[i-1..i+1] with the computed result
    // and record lastOp = {a, op, b}
    let lastOp = null;
    function applyOp(tokens, i) {
        const a = Number(tokens[i - 1]);
        const op = tokens[i];
        const b = Number(tokens[i + 1]);
        let res;
        switch (op) {
            case '×': res = a * b; break;
            case '÷': res = a / b; break;
            case '+': res = a + b; break;
            case '-': res = a - b; break;
        }
        lastOp = { a, op, b };
        // splice out a, op, b; insert result
        tokens.splice(i - 1, 3, String(res));
    }

    function reduceTokens(tokens) {
        // 1) innermost parentheses
        let open;
        while ((open = tokens.lastIndexOf('(')) !== -1) {
            let close = tokens.indexOf(')', open + 1);
            const inner = tokens.slice(open + 1, close);
            reduceTokens(inner);
            // after reducing inner, it should be a single token
            tokens.splice(open, close - open + 1, inner[0]);
        }
        // 2) × and ÷ first
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '×' || tokens[i] === '÷') {
                applyOp(tokens, i);
                i--; // step back to catch chained ops
            }
        }
        // 3) + and -
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '+' || tokens[i] === '-') {
                applyOp(tokens, i);
                i--;
            }
        }
    }
	function truncateTo8Decimals(x) {
		if (typeof x !== 'number') return x;
		const truncated = Math.floor(x * 1e8) / 1e8;
		return parseFloat(truncated.toString()); // removes trailing zeroes
	}


    let tokens = tokenize(expr);
    lastOp = null;
    reduceTokens(tokens);

    if (!lastOp) return "getFinalStep failed";

	const step = `${truncateTo8Decimals(lastOp.a)}${lastOp.op}${truncateTo8Decimals(lastOp.b)}`;

    return finalStepEquals24(step)
        ? step
        : "getFinalStep failed to equal 24";
}



function finalStepEquals24(expression) {
	// Supported operators
	const ops = ['+', '-', '×', '÷'];
	let opFound = null;
	let opIndex = -1;
	for (let op of ops) {
		opIndex = expression.indexOf(op);
		if (opIndex !== -1) {
			opFound = op;
			break;
		}
	}
	if (!opFound) return false;
	// Split into a and b
	let a = expression.substring(0, opIndex).trim();
	let b = expression.substring(opIndex + opFound.length).trim();
	// Try to parse numbers
	a = parseFloat(a);
	b = parseFloat(b);
	if (isNaN(a) || isNaN(b)) return false;
	let result;
	switch (opFound) {
		case '+':
			result = a + b;
			break;
		case '-':
			result = a - b;
			break;
		case '×':
			result = a * b;
			break;
		case '÷':
			if (b === 0) return false;
			result = a / b;
			break;
		default:
			return false;
	}
	return Math.abs(result - 24) < EQUALITY_THRESHOLD;
}