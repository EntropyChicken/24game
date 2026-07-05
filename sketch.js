const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "title";
let level, duel, titleScreen;
let originalClassicSets = [[], [], [], [], []];
let originalPuzzleSets = [[], [], [], []];
let classicSets = []; // new system is mostly predetermined on shuffle but it will still skip ahead if it's the same as previous (could fix)
let puzzleSets = [];
let currentLevelSet = null;
let currentLevelSetIndex = null; // which index within either classics or puzzles
let currentIsClassic = true;
let theme = {};
let canHover;
let mx = -1, my = -1;
let canSetThemeColor = true;
let gameCount; // after initially loading global counter, update locally alongside global counter
let gameCountDrawScale = 1;

// rgb is default for testing purposes. later i'll probably want to let the players submit their own team names???
let battleTeams = ["red","green","blue"]; 
let battleTeam = null;
let battleScores = { "red": 0, "green": 0, "blue": 0 };
let battleWaiting = true;
let currentBattleLevelData = null;
let setLabels = [
    "Classic Easy", "Classic Medium", "Classic Hard", "Classic Tricky", "Classic Cooked",
    "Puzzle Simple", "Puzzle Interesting", "Puzzle Crazy Hard", "Puzzle Javascript"
];
let battleBackgroundImg, drawWaitingRoomForBattleBackground = false;
let setChecked = [true, true, true, true, true, true, true, false, false];
let battleVictoryFlash = 0;

function preload() {
	loadJSON("levelData/classicLevelsEasy.json", data => { originalClassicSets[0] = data; });
	loadJSON("levelData/classicLevelsMedium.json", data => { originalClassicSets[1] = data; });
	loadJSON("levelData/classicLevelsHard.json", data => { originalClassicSets[2] = data; });
	loadJSON("levelData/classicLevelsTricky.json", data => { originalClassicSets[3] = data; });
	loadJSON("levelData/classicLevelsCooked.json", data => { originalClassicSets[4] = data; });
	loadJSON("levelData/puzzleLevelsSimple.json", data => { originalPuzzleSets[0] = data; });
	loadJSON("levelData/puzzleLevelsInteresting.json", data => { originalPuzzleSets[1] = data; });
	loadJSON("levelData/puzzleLevelsCrazyHard.json", data => { originalPuzzleSets[2] = data; });
	loadJSON("levelData/puzzleLevelsJavascript.json", data => { originalPuzzleSets[3] = data; });
}

function setup() {
	for(let s of originalClassicSets){
		classicSets.push(shuffle([...s]));
	}
	for(let s of originalPuzzleSets){
		puzzleSets.push(shuffle([...s]));
	}

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
		if (keyIsDown(220) && keyIsDown(191)) {
			screen = "battleMaster";
		}
	} else if (screen === "game") {
		background(220);
		level.draw();
		if (level.solved) {
			checkResetSet();
			let levelArgs = getRandomLevel(currentLevelSet, level.originalValues.map(c => c.real),
				currentIsClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS, false, false);
			level = new Level(levelArgs.cards,levelArgs.ops,levelArgs.lvl,currentIsClassic);
			Level.setupKeyboard(level);
			setThemeColor(theme.backgroundColor);
		}
	} else if (screen === "duel") {
		background(220);
		duel.draw();
		if (duel.solved) {
			checkResetSet();
			let levelArgs = getRandomLevel(currentLevelSet, duel.levels[0].originalValues.map(c => c.real),
				currentIsClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS, false, false);
			duel = new Duel(levelArgs.cards,levelArgs.ops,levelArgs.lvl,duel.scores);
			setThemeColor(theme.backgroundColor);
		}
	} else if (screen === "battle") {
		if(battleTeam === null){
			drawBattleTeamSelection();
		}
		else{
			if (level && !battleWaiting) {
				// The player has a level and is actively playing
				background(220);
				level.draw();
				
				// Check if they just solved it
				if (level.winTimer > 0 || level.solved) {
					battleWaiting = true;
					battleVictoryFlash = 100;
					// Tell the Game Master this team won!
					channel.send({
						type: "broadcast",
						event: "battle_win",
						payload: { team: battleTeam }
					});
				}
			} else {
				// Waiting for the game master to send a level. honestly just don't draw anything because this flashes for a second whenever you win and it's annoying 


				// background(100);
				// textAlign(CENTER,CENTER);
				// textSize(40);
				// fill(255);
				// text("Waiting for next puzzle...\nYou are on team " + battleTeam, width/2, height/2);
			}
		}
	} else if (screen === "battleMaster") {
        if (currentBattleLevelData === null) {
            broadcastNewBattleLevel();
        }
        background(0);
        textAlign(LEFT, TOP);
        fill(255);
        textSize(40);
        text("TEAMS & SCORES:", 100, 100);
        
        for(let i = 0; i < battleTeams.length; i++){
            let tName = battleTeams[i];
            text(tName + ": " + battleScores[tName], 100, 160 + 60 * i);
        }
        
        // --- NEW: Draw Active Puzzle Sets Checkboxes ---
        textSize(30);
        text("ACTIVE PUZZLE SETS:", width / 2 - 100, 100);
        for (let i = 0; i < 9; i++) {
            let cx = width / 2 - 100;
            let cy = 160 + i * 45; // Space them out vertically
            
            // Draw Checkbox
            stroke(255);
            strokeWeight(2);
            if (setChecked[i]) fill(100, 255, 100); // Green if checked
            else fill(0);                           // Black if unchecked
            rect(cx, cy, 30, 30, 5);
            
            // Draw Label
            noStroke();
            fill(255);
            textSize(24);
            textAlign(LEFT, CENTER);
            text(setLabels[i], cx + 45, cy + 15);
        }
        
        // Skip Button
        fill(255, 100, 100);
        rect(width - 350, 100, 250, 80, 15);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(40);
        text("Skip Puzzle", width - 225, 140);
    }
}


function drawBattleTeamSelection(){
	let baseTextSize = 40;
	let orbitPadding = 20;
	if(battleTeams.length>8){
		orbitPadding = 3;
	}
	let centralOrbitRadius = 220;
	let maxOrbitDiameter = min(250, 2 * centralOrbitRadius * sin(PI / battleTeams.length));

	background(220);
	textAlign(CENTER, CENTER);
	let maxTextWidth = 0;
	textSize(baseTextSize); 
	for (let i = 0; i < battleTeams.length; i++) {
		let w = textWidth(battleTeams[i]);
		if (w > maxTextWidth) {
			maxTextWidth = w;
		}
	}
	let orbitDiameter = maxTextWidth + orbitPadding;
	let currentOrbitTextSize = baseTextSize;
	if (orbitDiameter > maxOrbitDiameter) {
		orbitDiameter = maxOrbitDiameter;
		let availableSpace = maxOrbitDiameter - orbitPadding;
		currentOrbitTextSize = baseTextSize * (availableSpace / maxTextWidth);
	}

	let widthMax = 2*centralOrbitRadius+maxOrbitDiameter;
	push();
	translate(width / 2, height / 2);
	if(widthMax>width){
		scale(width/widthMax);
	}

	stroke(0);
	strokeWeight(2);
	noFill();
	ellipse(0, 0, centralOrbitRadius * 2, centralOrbitRadius * 2);
	fill(0);
	noStroke();
	textSize(baseTextSize);
	text("Choose\na team!", 0, 0);
	for (let i = 0; i < battleTeams.length; i++) {
		push();
		let orbitSpeed = battleTeams.length>8 ? 0.00012 : 0.00024;
		let ang = -PI * 0.8 + millis() * orbitSpeed + (i / battleTeams.length) * 2 * PI;
		translate(cos(ang) * centralOrbitRadius, sin(ang) * centralOrbitRadius);
		
		stroke(50);
		strokeWeight(2);
		fill(255);
		ellipse(0, 0, orbitDiameter, orbitDiameter);

		fill(0);
		noStroke();
		textSize(currentOrbitTextSize);
		text(battleTeams[i], 0, 0);
		pop();

		if(mouseIsPressed&&dist(mouseX,mouseY,width/2+cos(ang) * centralOrbitRadius, height/2+sin(ang) * centralOrbitRadius)<orbitDiameter/2){
			setBattleTeam(battleTeams[i]);
			break;
		}
	}
}
function setBattleTeam(team){
	battleTeam = team;
	background(0);
	push();
	textAlign(CENTER,CENTER);
	textSize(30);
	fill(255);
	text("Team: "+team+"\n...waiting for puzzle...",0,0);
	pop();
	channel.send({
		type: "broadcast",
		event: "request_current_level",
		payload: {}
	});
}
function drawBattleBackground(scaleFactor=1.0003, iterations=3, fadeFreq=0.1, col) {
	if(drawWaitingRoomForBattleBackground){
		push();
		for(let iter = 0; iter<iterations; iter++){ 
			push();
			translate(width / 2, height / 2);
			scale(scaleFactor);
			
			imageMode(CENTER);
			if (battleBackgroundImg !== undefined){
			image(battleBackgroundImg, 0, 0);
			}
			pop();

			noFill();
			strokeWeight(10);
			let high = constrain(random(100, 280),0,255);
			
			stroke(random(0, 255),80);
			
			let rad = pow(random(0, 1.1), 6) * 40 + 15;
			if (random(0, 10) < 1) {
			rad *= random(1, 3);
			}
			let x = random(-rad, width + rad);
			let y = random(-rad, height + rad);
			ellipse(x, y, rad * 2, rad * 2);
			
			if(random(0,1)<fadeFreq){
				background(50,15);
			}
			battleBackgroundImg = get();
		}
		pop();
		background(50,100);
	}
	else{
		// background(lerpColor(color(130),theme.backgroundColorCorrect,battleVictoryFlash));
		background(lerpColor(color(130),theme.backgroundColorCorrect,min(1,battleVictoryFlash)));
	}
	theme.shadeColor = lerpColor(color(190),theme.backgroundColorCorrect,min(1,battleVictoryFlash));
	battleVictoryFlash*=0.7;
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


function getRandomLevel(levelSet, previousCards, defaultOps = Level.SYMBOLS, overrideOps = false, shuffleCards) {
	// find first valid level
	for (let i = 0; i < levelSet.length; i++) {
		let lvl = levelSet[i];

		if (!sameCards(lvl.cards, previousCards)) {
			levelSet.splice(i, 1); // consume from deck
			return buildLevel(lvl, defaultOps, overrideOps, shuffleCards);
		}
	}

	// fallback: all remaining levels violate constraint
	let lvl = levelSet.pop();
	return buildLevel(lvl, defaultOps, overrideOps, shuffleCards);
}
function buildLevel(lvl, defaultOps, overrideOps, shuffleCards) {
	let ops = defaultOps;
	if (!overrideOps && lvl.ops !== undefined) {
		ops = lvl.ops;
	}

	let cards = shuffleCards ? shuffle(lvl.cards) : lvl.cards;

	return {
		cards: cards,
		ops: ops,
		lvl: lvl
	};
}
function sameCards(a, b) {
	if (!a || !b || a.length !== b.length) return false;

	let sa = a.toSorted();
	let sb = b.toSorted();
	return sa.every((v, i) => v === sb[i]);
}
function checkResetSet() {
	if (currentLevelSet.length === 0) {
		if(currentIsClassic){
			classicSets[currentLevelSetIndex] = shuffle([...originalClassicSets[currentLevelSetIndex]]);
			currentLevelSet = classicSets[currentLevelSetIndex];
		}
		else{
			puzzleSets[currentLevelSetIndex] = shuffle([...originalPuzzleSets[currentLevelSetIndex]]);
			currentLevelSet = puzzleSets[currentLevelSetIndex];
		}
	}
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
	} else if (screen === "battle") {
		// --- NEW: Allow players to click and solve the puzzle ---
		if (level && !battleWaiting && battleTeam !== null) {
			level.handleClick(mouseX, mouseY);
		}
	} else if (screen === "battleMaster") {
        // Repurposed button: Skip Puzzle
        if (mouseX > width - 350 && mouseX < width - 100 && mouseY > 100 && mouseY < 180) {
            broadcastNewBattleLevel();
        }
        
        // Check if a checkbox/label was clicked
        for (let i = 0; i < 9; i++) {
            let cx = width / 2 - 100;
            let cy = 160 + i * 45;
            // The clickable width is ~250px so players can click the text too
            if (mouseX > cx && mouseX < cx + 250 && mouseY > cy && mouseY < cy + 30) {
                setChecked[i] = !setChecked[i];
                
                // Prevent the Game Master from unchecking the very last active set
                if (!setChecked.includes(true)) {
                    setChecked[i] = true;
                }
            }
        }
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
	"https://yjiizqjjuunbvmkuxulv.supabase.co",
	"sb_publishable_UgcUH946WkpvMmPIvHN0Yg_cDczSY6T"
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
        })
		// 1. Players receive the active level configuration
		.on("broadcast", { event: "battle_level" }, (msg) => {
			if (screen === "battle" && battleTeam !== null) {
				let args = msg.payload;
				level = new Level(args.cards, args.ops, args.lvl, args.isClassic);
				Level.setupKeyboard(level);
				battleWaiting = false;
			}
		})
		// 2. Game Master receives a win announcement
		.on("broadcast", { event: "battle_win" }, (msg) => {
			let winningTeam = msg.payload.team;
			if (battleScores[winningTeam] !== undefined) {
				battleScores[winningTeam]++;
			}
			if (screen === "battleMaster") {
				broadcastNewBattleLevel(); // Automatically cycles to the next level
			}
		})
		// 3. New players query the Game Master for the level currently in play
		.on("broadcast", { event: "request_current_level" }, (msg) => {
			if (screen === "battleMaster" && currentBattleLevelData) {
				channel.send({
					type: "broadcast",
					event: "battle_level",
					payload: currentBattleLevelData
				});
			}
		});

    const status = await channel.subscribe(); 
    console.log("channel status:", status);
}
setupRealtime();

async function broadcastWin() {
	channel.send({
		type: "broadcast",
		event: "win",
		payload: { gameCount:gameCount, battleTeam:battleTeam } // if battleTeam is null then that just means they're playing the non-battle versions of the game like solo or duel. so it doesn't matter in that case
	});
}
function broadcastNewBattleLevel() {
    // 1. Gather all indices that are currently checked on
    let availableIndices = [];
    for (let i = 0; i < 9; i++) {
        if (setChecked[i]) availableIndices.push(i);
    }
    
    // Safety fallback just in case
    if (availableIndices.length === 0) availableIndices = [0]; 
    
    // 2. Pick a random active set
    let chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    
    // 3. Determine if it's a classic (0-4) or a puzzle (5-8)
    let isClassic = chosenIndex < 5;
    let setArrayIndex = isClassic ? chosenIndex : chosenIndex - 5;
    
    let chosenSet = isClassic ? classicSets[setArrayIndex] : puzzleSets[setArrayIndex];
    let originalSet = isClassic ? originalClassicSets[setArrayIndex] : originalPuzzleSets[setArrayIndex];
    
    // Reset the deck if we've used all levels in this specific set
    if (chosenSet.length === 0) {
        if (isClassic) {
            classicSets[setArrayIndex] = shuffle([...originalClassicSets[setArrayIndex]]);
            chosenSet = classicSets[setArrayIndex];
        } else {
            puzzleSets[setArrayIndex] = shuffle([...originalPuzzleSets[setArrayIndex]]);
            chosenSet = puzzleSets[setArrayIndex];
        }
    }
    
    // Classic levels strictly default to + - * /, while Puzzles allow advanced symbols
    let defaultOps = isClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS;
    let levelData = getRandomLevel(chosenSet, [], defaultOps, false, false);
    
    // Cache it so we can hand it out to mid-game joiners
    currentBattleLevelData = {
        cards: levelData.cards,
        ops: levelData.ops,
        lvl: levelData.lvl,
		isClassic: isClassic
    };
    
    // Broadcast to everyone
    channel.send({
        type: "broadcast",
        event: "battle_level",
        payload: currentBattleLevelData
    });
}