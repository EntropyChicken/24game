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
		shadeColor : color(150,200,180),
		backgroundColor : color(210,225,250)
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
