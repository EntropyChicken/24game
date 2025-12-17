const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "title";
let level, duel, titleScreen;
let classicSets = [[], [], [], [], []];
let puzzleSets = [[], [], [], []];
let currentLevelSet = null;
let currentUsedIndices = []; // Keeps track of used indices
let currentIsClassic = true;
let theme = {};
let canHover;
let mx = -1, my = -1;
let canSetThemeColor = true;
let gameCount; // after initially loading global counter, update locally alongside global counter
let gameCountDrawScale = 1;

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
	// testSolutions();

	canHover = window.matchMedia('(hover: hover)').matches;
	if(canHover){
		canSetThemeColor = false;
	}
	
	theme = {
		shadeColor : color(255,0,255),
		shadeColorCorrect : color(155,200,155),
		backgroundColor : color(210,225,250),
		backgroundColorCorrect : color(160,205,120)
	};

	createCanvas(windowWidth, windowHeight);
	titleScreen = new TitleScreen();
	setScreen("title");
}
function draw() {
	if (canHover) {
		mx = mouseX;
		my = mouseY;
	}
	
	if (screen === "title") {
		titleScreen.draw();
	} else if (screen === "game") {
		background(220);
		level.draw();
		if (level.solved) {
			let levelArgs = getRandomLevel(currentLevelSet, level.originalValues.map(c => c.real),
				currentIsClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS, false, currentUsedIndices, !currentIsClassic);
			level = new Level(levelArgs.cards,levelArgs.ops,levelArgs.lvl,currentIsClassic);
			Level.setupKeyboard(level);
			setThemeColor(theme.backgroundColor);
		}
	} else if (screen === "duel") {
		background(220);
		duel.draw();
		if (duel.solved) {
			let levelArgs = getRandomLevel(currentLevelSet, duel.levels[0].originalValues.map(c => c.real),
				currentIsClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS, false, currentUsedIndices, !currentIsClassic);
			duel = new Duel(levelArgs.cards,levelArgs.ops,levelArgs.lvl,duel.scores);
			setThemeColor(theme.backgroundColor);
		}
	}
}








function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	
	let newTitleScreen = new TitleScreen();
	if(titleScreen!==undefined){
		newTitleScreen.duelMode = titleScreen.duelMode;
	}
	titleScreen = newTitleScreen;
	
	if(level!==undefined){
		level.reSetupLayout();
	}
	if(duel!==undefined){
		duel.reSetupLayout();
	}
}


function getRandomLevel(levelSet, previousCards, defaultOps = Level.SYMBOLS, overrideOps = false, usedIndices = [], shuffleCards) {
	let lvl, index;
	let cont = true;
	for (let tries = 0; tries < 1000 && cont; tries++) {
		if (tries === 999) {
			console.log ("reached try #999 in getRandomLevel");
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
	return {
		cards:cards,
		ops:ops,
		lvl:lvl
	};
}


function symbolIsUnary(symbol) {
	const unaryOperators = ['√', 'ln', '!', 'sin', 'cos', 'tan', 'cot', 'asin', 'acos', 'abs', 'floor', 'round', 'ceil'];
	return unaryOperators.includes(symbol);
}
function symbolIsBinary(symbol) {
	const binaryOperators = ['+', '-', '×', '÷', '%', '^'];
	return binaryOperators.includes(symbol);
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

function setThemeColor(color) {
	if(!canSetThemeColor) return;
	let metaThemeColor = document.querySelector("meta[name=theme-color]");
	if (!metaThemeColor) {
		metaThemeColor = document.createElement('meta');
		metaThemeColor.name = "theme-color";
		document.head.appendChild(metaThemeColor);
	}
	metaThemeColor.setAttribute("content", color);
}
function setScreen(s){
	screen = s;
	if(screen === "title"){
		theme.shadeColor = color(210,210,210);
		setThemeColor(color(175,175,175)); // or maybe theme.backgroundColorCorrect
	}
	else if(screen === "game" || screen === "duel"){
		setThemeColor(theme.backgroundColor);
	}
	else{
		setThemeColor(color(0,0,0));
	}
}

function mouseMoved() {
	if (canHover) {
		mx = mouseX;
		my = mouseY;
	}
}
function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	} else if (screen === "title") {
		titleScreen.handleClick(mouseX, mouseY);
	} else if (screen === "duel") {
		duel.handleClick(mouseX, mouseY);
	}
}

let processedTouchIds = new Set();

function touchStarted() {
	for (let t of touches) {
		if (!processedTouchIds.has(t.id)) {
			processedTouchIds.add(t.id);
			
			if (screen === "game") {
				level.handleClick(t.x, t.y);
			} else if (screen === "title") {
				titleScreen.handleClick(t.x, t.y);
			} else if (screen === "duel") {
				duel.handleClick(t.x, t.y);
			}
		}
	}
	return false;
}

// Hook into raw touchend events
window.addEventListener("touchend", (e) => {
	for (let t of e.changedTouches) {
		processedTouchIds.delete(t.identifier);
	}
});


// unused, just automatically find longer side
function requestLandscape() {
	if (screen.orientation && screen.orientation.lock) {
		screen.orientation.lock('landscape')
			.then(() => console.log ("Landscape locked"))
			.catch(err => console.warn("Could not lock orientation:", err));
	}
	else {
		alert("Please rotate device to landscape mode");
	}
}



let firebaseReady = null;
document.addEventListener('firebase_initialized', () => {
	firebaseReady = window.firebaseAppReady;
	getGameCount().then(val => {
		gameCount = val;
		console.log("Initial game count (after Firebase_initialized):", gameCount);
	});
});


async function incrementGameCounter(change) {
	// Ensure 'change' is a valid number, defaulting to 1 if not provided
	const incrementValue = typeof change === 'number' && !isNaN(change) ? change : 1; 

	if (!firebaseReady || !firebaseReady.isReady || !firebaseReady.increment) {
		console.warn('Firebase or increment function not ready. Skipping.');
		return;
	}

	try {
		// Destructure all needed functions from firebaseReady, including 'increment'
		const { db, collection, doc, setDoc, increment } = firebaseReady; 

		const gameCounterRef = doc(collection(db, 'gameStats'), 'globalCounter');

		await setDoc(gameCounterRef, {
			plays: increment(incrementValue) 
		}, { merge: true });

		gameCount += incrementValue;
	} catch (error) {
		console.error('Error incrementing counter:', error);
	}
	
	broadcastWin();
}

async function getGameCount() {
	if (!firebaseReady || !firebaseReady.isReady) {
		console.warn('Firebase not ready for get count. Skipping.');
		return 0; 
	}
	try {
		const { db, collection, doc, getDoc } = firebaseReady; 
		
		const gameCounterRef = doc(collection(db, 'gameStats'), 'globalCounter');
		
		const docSnap = await getDoc(gameCounterRef);
		if (docSnap.exists()) { 
			console.log('Current game count:', docSnap.data().plays);
			return docSnap.data().plays;
		} else {
			console.log('No game counter found yet!');
			return 0;
		}
	} catch (error) {
		console.error('Error getting game count:', error);
		return 0;
	}
}



// this doesn't store the win counter, it just relays realtime updates
// avoid colliding with any global "supabase"
const supabaseClient = window.supabase.createClient(
	"https://fhgzqafosmioykggwafl.supabase.co",
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoZ3pxYWZvc21pb3lrZ2d3YWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjkyMTMsImV4cCI6MjA3ODc0NTIxM30.j9xIAsRjNpqT-49WxrmrUcKLBSySd1y1ETTK8E4A194"
);
const channel = supabaseClient.channel("main-room", {
    config: {
        broadcast: { self: true }
    }
});
async function setupRealtime() {
    channel
        .on("broadcast", { event: "win" }, (msg) => {
            gameCount = msg.payload.gameCount;
            gameCountDrawScale = 2;
        });

    const status = await channel.subscribe(); 
    console.log("channel status:", status);
}
setupRealtime();

async function broadcastWin() {
	channel.send({
		type: "broadcast",
		event: "win",
		payload: { gameCount:gameCount }
	});
}
