// if dividing by zero, the game should explode or something idk

const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "game";
let level;
let classicSets = [[],[],[],[],[]];
let puzzleSets = [[],[]];

function preload() {
	loadJSON("levelData/classicLevelsEasy.json", data => {
		classicSets[0] = data;
	});
	loadJSON("levelData/classicLevelsMedium.json", data => {
		classicSets[1] = data;
	});
	loadJSON("levelData/classicLevelsHard.json", data => {
		classicSets[2] = data;
	});
	loadJSON("levelData/classicLevelsTricky.json", data => {
		classicSets[3] = data;
	});
	loadJSON("levelData/classicLevelsDoomed.json", data => {
		classicSets[4] = data;
	});
	loadJSON("levelData/puzzleLevels.json", data => {
		puzzleSets[0] = data;
	});
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	// level = getClassicLevel(classicSets[0]);
	level = new Level([-1,-3,Math.PI,4,0]);

	Level.setupKeyboard(level);
}

function getClassicLevel(levelSet, previousCards) {
	let lvl, index;
	let cont = true;
	for(let tries = 0; tries<1000 && cont; tries++){
		if(tries===999){
			console.log("reached try #999. see getClassicLevel");
		}
		index = floor(random(0,levelSet.length));
		lvl = levelSet[index];
		if(previousCards===undefined || lvl.cards.length!==previousCards.length){
			break;
		}
		for(let i = 0; i<lvl.cards.length; i++){
			if(lvl.cards[i]!==previousCards[i]){
				cont = false;
				break;
			}
		}
	}
	return new Level(shuffle(lvl.cards), ['+', '-', '×', '÷'], lvl);
}
function getPuzzleLevel(levelSet, previousCards) {
	// if two distinct puzzles have the same cards, then don't transition (for clarity)
	let lvl, index;
	let cont = true;
	for(let tries = 0; tries<1000 && cont; tries++){
		if(tries===999){
			console.log("reached try #999. see getPuzzleLevel");
		}
		index = floor(random(0,levelSet.length));
		lvl = levelSet[index];
		if(previousCards===undefined || lvl.cards.length!==previousCards.length){
			break;
		}
		for(let i = 0; i<lvl.cards.length; i++){
			if(lvl.cards[i]!==previousCards[i]){
				cont = false;
				break;
			}
		}
	}
	return new Level(shuffle(lvl.cards), lvl.ops, lvl);
}







function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function draw() {
	background(220);
	if (screen === "game") {
		level.draw();
		if(level.solved){
			level = getPuzzleLevel(puzzleSets[0],level.originalValues.map(c => c.real));
			Level.setupKeyboard(level);
		}
	}
}

function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	}
}