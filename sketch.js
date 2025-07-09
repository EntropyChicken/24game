// if dividing by zero, the game should explode or something idk

const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "game";
let level;
let classicLevels;

function preload() {
	loadJSON("levelData/classicLevelsEasy.json", data => {
		classicLevels = data;
	});
}

function setup() {
	createCanvas(windowWidth, windowHeight);

	// level = newClassicLevel();
	level = new Level([23,25,27,Math.PI,Math.E]);
	// level = new Level([2,2,2]);

	Level.setupKeyboard(level);
}

function newClassicLevel(index, previousCards) {
	if(index === undefined){
		index = floor(random(0,classicLevels.length));
	}
	let lvl;
	while(true){
		lvl = classicLevels[index];
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
			level = newClassicLevel();
			Level.setupKeyboard(level);
		}
	}
}

function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	}
}