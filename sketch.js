// if dividing by zero, the game should explode or something idk

const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "game";
let level;
let classicSets = [[],[],[],[],[]];

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
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	// level = getClassicLevel(classicSets[2]);
	level = new Level([23,25,27,Math.PI,Math.E]);
	// level = new Level([2,2,2]);

	Level.setupKeyboard(level);
}

function getClassicLevel(levelSet, previousCards) {
	let lvl, index;
	while(true){
		index = floor(random(0,levelSet.length));
		lvl = levelSet[index];
		if(previousCards===undefined || lvl.cards.length!==previousCards.length){
			break;
		}
		for(let i = 0; i<lvl.cards.length; i++){
			if(lvl.cards[i]!==previousCards[i]){
				break;
			}
		}
	}
	return new Level(lvl.cards, ['+', '-', '×', '÷'], lvl);
}


function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function draw() {
	background(220);
	if (screen === "game") {
		level.draw();
		if(level.solved){
			console.log(level.originalValues);
			level = getClassicLevel(classicSets[2],level.originalValues);
			Level.setupKeyboard(level);
		}
	}
}

function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	}
}