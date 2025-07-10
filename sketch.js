// if dividing by zero, the game should explode or something idk

const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "game";
let level;
let classicSets = [[],[],[],[],[]];
let puzzleSets = [[],[],[],[]];

function preload() {
	loadJSON("levelData/classicLevelsEasy.json", data => {classicSets[0] = data;});
	loadJSON("levelData/classicLevelsMedium.json", data => {classicSets[1] = data;});
	loadJSON("levelData/classicLevelsHard.json", data => {classicSets[2] = data;});
	loadJSON("levelData/classicLevelsTricky.json", data => {classicSets[3] = data;});
	loadJSON("levelData/classicLevelsDoomed.json", data => {classicSets[4] = data;});
	loadJSON("levelData/puzzleLevelsSimple.json", data => {puzzleSets[0] = data;});
	loadJSON("levelData/puzzleLevelsInteresting.json", data => {puzzleSets[1] = data;});
	loadJSON("levelData/puzzleLevelsCrazy.json", data => {puzzleSets[2] = data;});
	loadJSON("levelData/puzzleLevelsJavascript.json", data => {puzzleSets[3] = data;});
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	
	// let a = new Complex(0,0.70488569589).sin()
	// let b = a.asin();
	// let c = b.sin();
	// console.log(a);
	// console.log(b);
	// console.log(c);
	// const z1 = new Complex(1, 0);
	// console.log(z1.asin().real);  // Now correctly returns ~1.5708 (π/2)
	// const z2 = new Complex(0.9999, 0);
	// console.log(z2.asin().real);  // Still returns ~1.5567 (close to π/2)
	// const z3 = new Complex(-1, 0);
	// console.log(z3.asin().real);  // Returns ~-1.5708 (-π/2)
	// console.log(new Complex(0,0).acos());

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
		let sortedCards = lvl.cards.toSorted();
		let sortedPreviousCards = previousCards.toSorted();
		for(let i = 0; i<sortedCards.length; i++){
			if(sortedCards[i]!==sortedPreviousCards[i]){
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
		let sortedCards = lvl.cards.toSorted();
		let sortedPreviousCards = previousCards.toSorted();
		for(let i = 0; i<sortedCards.length; i++){
			if(sortedCards[i]!==sortedPreviousCards[i]){
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
			level = getPuzzleLevel(puzzleSets[3],level.originalValues.map(c => c.real));
			Level.setupKeyboard(level);
		}
	}
}

function mousePressed() {
	if (screen === "game") {
		level.handleClick(mouseX, mouseY);
	}
}