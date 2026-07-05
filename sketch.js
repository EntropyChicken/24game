const EQUALITY_THRESHOLD = 1e-6;
const DISPLAY_THRESHOLD = 7e-9;
let screen = "title";
let level, duel, titleScreen, masterPreviewLevel;
let originalClassicSets = [[], [], [], [], []];
let originalPuzzleSets = [[], [], [], []];
let classicSets = []; 
let puzzleSets = [];
let currentLevelSet = null;
let currentLevelSetIndex = null; 
let currentIsClassic = true;
let theme = {};
let canHover;
let mx = -1, my = -1;
let canSetThemeColor = true;
let gameCount; 
let gameCountDrawScale = 1;

// Starts empty for a fully dynamic, custom team setup!
let battleTeams = []; 
let battleTeam = null;
let battleScores = {};
let battleWaiting = true;
let currentBattleLevelData = null;
let battleMasterAwardForNegativeNumber = false;
let battleMasterAwardForNonInteger = false;
let battleMasterAwardForNonReal = false;
let battleMasterAwardForNaN = false;
let battleMasterVictoryFlash = 0;
let battleMasterWinningTeam = "";
let battleMasterWinningPoints = 0;
// Per-team Set of distinct "doubler" reasons triggered so far this round.
// Doing the same doubler action repeatedly only counts once (Set semantics);
// doing two DIFFERENT doubler actions counts as two. Cleared every new round
// (see broadcastNewBattleLevel). ALL triggered doublers are recorded here
// regardless of the checklist below - the checklist is only consulted when
// a team's score is actually computed at win time (see battle_win handler).
let battleDoublers = {};
const BATTLE_DOUBLER_LABELS = {
    negative_number: "Negative",
    non_integer: "Non-Integer",
    non_real: "Non-Real",
    invalid_number: "Non-Number"
};
const DOUBLER_REASON_KEYS = Object.keys(BATTLE_DOUBLER_LABELS);

function isDoublerReasonEnabled(reasonKey) {
    switch (reasonKey) {
        case "negative_number": return battleMasterAwardForNegativeNumber;
        case "non_integer": return battleMasterAwardForNonInteger;
        case "non_real": return battleMasterAwardForNonReal;
        case "invalid_number": return battleMasterAwardForNaN;
        default: return false;
    }
}

function toggleDoublerReasonEnabled(reasonKey) {
    switch (reasonKey) {
        case "negative_number": battleMasterAwardForNegativeNumber = !battleMasterAwardForNegativeNumber; break;
        case "non_integer": battleMasterAwardForNonInteger = !battleMasterAwardForNonInteger; break;
        case "non_real": battleMasterAwardForNonReal = !battleMasterAwardForNonReal; break;
        case "invalid_number": battleMasterAwardForNaN = !battleMasterAwardForNaN; break;
    }
}
let setLabels = [
    "Classic Easy", "Classic Medium", "Classic Hard", "Classic Tricky", "Classic Very Hard",
    "Puzzle Simple", "Puzzle Interesting", "Puzzle Crazy Hard", "Puzzle Javascript 😭"
];
let battleMasterBackgroundImg;
let setChecked = [true, true, true, true, false, true, true, false, false];
let battleVictoryFlash = 0;
let battleLossFlash = 0;
let teamInput; 

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
    
    teamInput = createInput('');
    teamInput.attribute('placeholder', 'Type custom team name...');
    teamInput.style('font-size', '20px');
    teamInput.style('padding', '10px');
    teamInput.style('border-radius', '8px');
    teamInput.style('border', '2px solid #323232');
    teamInput.style('text-align', 'center');

    // --- FIXED POSITIONING LOGIC ---
    // 1. Grab the exact live pixel dimensions of the input box
    let inputWidth = teamInput.elt.offsetWidth;
    let inputHeight = teamInput.elt.offsetHeight;

    // 2. Mathematically center it horizontally
    let safeX = (windowWidth - inputWidth) / 2;

    // 3. Calculate your ideal vertical spot (150px from bottom)
    let targetY = windowHeight - 150;
    let padding = 15; // Safe buffer zone from the absolute edges
    
    // 4. Protect against small screens: ensures Y stays within the top and bottom boundaries
    let safeY = constrain(targetY, padding, windowHeight - inputHeight - padding);
    
    // 5. Apply both clean positions directly through p5
    teamInput.position(safeX, safeY);
    // -------------------------------

    teamInput.hide(); 

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
        if (keyIsDown(220) && keyIsDown(191) && screen !== "battleMaster") {
            setScreen("battleMaster");
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
                background(220);
                level.draw();
                
                if (level.winTimer > 0 || level.solved) {
                    battleWaiting = true;
                    battleVictoryFlash = 500;
                    channel.send({
                        type: "broadcast",
                        event: "battle_win",
                        payload: { team: battleTeam }
                    });
                }
            } 
            else if (battleWaiting) {
                // don't clutter screen
                // background(0);
                // push();
                // textAlign(CENTER, CENTER);
                // textSize(30);
                // fill(255);
                // text("GG! Puzzle Solved!\nWaiting for BattleMaster to send next round...", width / 2, height / 2);
                // pop();
            }
        }
    } else if (screen === "battleMaster") {
        if (currentBattleLevelData === null) {
            broadcastNewBattleLevel();
        }

        {
            push();
            for(let iter = 0; iter<3; iter++){ 
                push();
                translate(width / 2, height / 2);
                scale(1.001);
                rotate(0.0008);
                
                imageMode(CENTER);
                if (battleMasterBackgroundImg !== undefined){
                    image(battleMasterBackgroundImg, 0, 0);
                }
                pop();

                noFill();
                strokeWeight(15);
                
                stroke(random(0, 255), 70);
                
                let rad = pow(random(0, 1.1), 6) * 40 + 15;
                if (random(0, 10) < 1) {
                    rad *= random(1, 3);
                }
                let x = random(-rad, width + rad);
                let y = random(-rad, height + rad);
                push();
                translate(x,y);
                rotate(random(0,360));
                rect(-rad, -rad, rad * 2, rad * 2, rad*0.15);
                pop();
                
                if(random(0,1)<0.1){
                    background(0,8);
                }
                battleMasterBackgroundImg = get();
            }
            pop();
            background(lerpColor(color(0,120),color(255,120),min(1,battleLossFlash)));
            battleLossFlash*=0.95;
        }
        
        textAlign(LEFT, TOP);
        fill(140);
        textSize(28);
        text("SCORES:", 80, 80);
        fill(255);
        for(let i = 0; i < battleTeams.length; i++){
            let tName = battleTeams[i];
            let scoreText = tName + ": " + (battleScores[tName] || 0);
            let doublerSet = battleDoublers[tName];
            if (doublerSet && doublerSet.size > 0) {
                // FILTER: Only map and show doublers that are currently enabled!
                let validNames = [...doublerSet]
                    .filter(reason => isDoublerReasonEnabled(reason)) 
                    .map(reason => BATTLE_DOUBLER_LABELS[reason] || reason);
                
                if (validNames.length > 0) {
                    scoreText += " (" + validNames.join(", ") + ")";
                }
            }
            text(scoreText, 80, 125 + 45 * i);
        }
        
        textSize(28);
        fill(140);
        text("SETS:", width / 2, 80);
        fill(255);
        for (let i = 0; i < 9; i++) {
            let cx = width / 2;
            let cy = 125 + i * 45; 
            
            stroke(255);
            strokeWeight(2);
            if (setChecked[i]) fill(0,150,255); 
            else fill(0);                           
            rect(cx, cy, 30, 30, 5);
            
            noStroke();
            fill(255);
            textSize(24);
            textAlign(LEFT, CENTER);
            text(setLabels[i], cx + 45, cy + 15);
        }

        textSize(28);
        fill(140);
        text("DOUBLERS:", width / 2, 570);
        fill(255);
        for (let i = 0; i < DOUBLER_REASON_KEYS.length; i++) {
            let cx = width / 2;
            let cy = 615 + i * 45;
            let reasonKey = DOUBLER_REASON_KEYS[i];

            stroke(255);
            strokeWeight(2);
            if (isDoublerReasonEnabled(reasonKey)) fill(0,150,255);
            else fill(0);
            rect(cx, cy, 30, 30, 5);

            noStroke();
            fill(255);
            textSize(24);
            textAlign(LEFT, CENTER);
            text(BATTLE_DOUBLER_LABELS[reasonKey], cx + 45, cy + 15);
        }
        
        strokeWeight(2);
        stroke(255, 100, 100);
        fill(255, 100, 100, 80);
        rect(width - 230, 80, 150, 150, 15);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(40);
        text("Skip\nPuzzle", width - 155, 155);

        strokeWeight(2);
        stroke(255, 100, 100);
        fill(255, 100, 100, 80);
        rect(width - 230, 250, 150, 150, 15);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(40);
        text("End\nBattle", width - 155, 325);

        strokeWeight(2);
        stroke(255, 100, 100);
        fill(255, 100, 100, 80);
        rect(width - 230, 420, 150, 150, 15);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(40);
        text("Reset\nScores", width - 155, 495);

        if (masterPreviewLevel) {
            push();
            let previewW = width * 0.3;
            let previewH = height * 0.3;
            let previewX = 80;
            let previewY = height - previewH - 40;

            fill(140);
            noStroke();
            textSize(28);
            textAlign(LEFT, BOTTOM);
            text("CURRENT PUZZLE:", previewX, previewY - 10);

            fill(28);
            stroke(80);
            strokeWeight(2);
            rect(previewX, previewY, previewW, previewH, 12);

            translate(previewX, previewY);
            let scaleX = previewW / width;
            let scaleY = previewH / height;
            let sFactor = min(scaleX, scaleY);
            
            let offsetX = (previewW - (width * sFactor)) / 2;
            let offsetY = (previewH - (height * sFactor)) / 2;
            translate(offsetX, offsetY);
            scale(sFactor);
            let oldMx = mx, oldMy = my;
            mx = -1; my = -1;
            masterPreviewLevel.draw(false);
            mx = oldMx; my = oldMy;
            pop();
        }
        if (battleMasterVictoryFlash > 0.01) {
            push();
            let alphaVal = 255 * min(1, battleMasterVictoryFlash * 1.5); // Multiply slightly so it stays solid a bit longer

            // Draw semitranslucent background overlay
            let flashColor = color(theme.backgroundColorCorrect);
            flashColor.setAlpha(alphaVal * 0.95); // Caps out at 95% opacity
            fill(flashColor);
            noStroke();
            rect(0, 0, width, height);

            // Draw huge dynamic black text
            fill(0, 0, 0, alphaVal);
            textAlign(CENTER, CENTER);
            let winString = battleMasterWinningTeam + " (+" + battleMasterWinningPoints+")";
            
            // Dynamically scale text to fit 90% of screen width
            textSize(100); 
            let tw = textWidth(winString);
            let dynamicSize = (width * 0.9) / tw * 100;
            // Constrain size so it doesn't get ridiculously tall if the name is short
            dynamicSize = min(dynamicSize, height * 0.4); 
            
            textSize(dynamicSize);
            text(winString, width / 2, height / 2);
            pop();

            // Decay the flash
            battleMasterVictoryFlash *= 0.98;
        }
    }
}

function drawBattleTeamSelection(){
    let baseTextSize = 40;
    let orbitPadding = battleTeams.length > 8 ? 3 : 20;
    let centralOrbitRadius = 220;
    
    let maxOrbitDiameter = 250;
    if (battleTeams.length > 1) {
        maxOrbitDiameter = min(250, 2 * centralOrbitRadius * sin(PI / battleTeams.length));
    }

    background(220);
    textAlign(CENTER, CENTER);
    let maxTextWidth = 0;
    textSize(baseTextSize); 
    for (let i = 0; i < battleTeams.length; i++) {
        let w = textWidth(battleTeams[i]);
        if (w > maxTextWidth) maxTextWidth = w;
    }
    let orbitDiameter = maxTextWidth + orbitPadding;
    let currentOrbitTextSize = baseTextSize;
    if (orbitDiameter > maxOrbitDiameter) {
        orbitDiameter = maxOrbitDiameter;
        let availableSpace = max(0, maxOrbitDiameter - orbitPadding);
        currentOrbitTextSize = baseTextSize * (availableSpace / maxTextWidth);
    }

    let widthMax = 2 * centralOrbitRadius + maxOrbitDiameter;
    push();
    translate(width / 2, height / 2);
    if(widthMax > width){
        scale(width / widthMax);
    }

    stroke(0);
    let weightVal = 2;
    strokeWeight(weightVal);
    noFill();
    ellipse(0, 0, centralOrbitRadius * 2, centralOrbitRadius * 2);
    fill(0);
    noStroke();
    textSize(baseTextSize);
    textAlign(CENTER,CENTER);
    text("Create or\nChoose Team", 0, -5); 
    
    for (let i = 0; i < battleTeams.length; i++) {
        push();
        let orbitSpeed = battleTeams.length > 8 ? 0.00012 : 0.00024;
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
    }
    pop();

    // --- CONSTRAINED INPUT & BUTTON POSITIONING ---
    let inputW = 260;
    let inputH = 45;
    let btnW = 120;
    let btnH = 50;
    let padding = 15;

    let inputX = width / 2 - inputW / 2;
    let targetInputY = height / 2 + centralOrbitRadius + 40;
    
    // 115px represents the combined height of the input (45) + gap (20) + button (50)
    let maxInputY = height - 115 - padding; 
    let inputY = constrain(targetInputY, padding, maxInputY);

    teamInput.position(inputX, inputY);
    teamInput.size(inputW, inputH);
    teamInput.show(); 

    let btnX = width / 2 - 60;
    let btnY = inputY + inputH + 20;

    stroke(0);
    strokeWeight(2);
    fill(100, 200, 100); 
    rect(btnX, btnY, btnW, btnH, 10);
    
    noStroke();
    fill(255);
    textSize(22);
    textAlign(CENTER, CENTER);
    text("JOIN", btnX + btnW / 2, btnY + btnH / 2);
}

function setBattleTeam(team){
    team = team.trim();
    if (team === "") return; 

    battleTeam = team;
    teamInput.hide(); 

    background(0);
    push();
    textAlign(CENTER,CENTER);
    textSize(30);
    fill(255);
    text("Team: "+team+"\n...waiting for puzzle...", width / 2, height / 2);
    pop();

    channel.send({
        type: "broadcast",
        event: "new_team_created",
        payload: { teamName: team }
    });

    channel.send({
        type: "broadcast",
        event: "request_current_level",
        payload: {}
    });
}

function drawBattleBackground(scaleFactor=1.0003, iterations=3, fadeFreq=0.1, col) {
    background(lerpColor(lerpColor(color(140),color(255),battleLossFlash),theme.backgroundColorCorrect,min(1,battleVictoryFlash)));
    theme.shadeColor = lerpColor(lerpColor(color(190),color(255),battleLossFlash),theme.backgroundColorCorrect,min(1,battleVictoryFlash));
    battleVictoryFlash*=0.9;
    battleLossFlash*=0.95;
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
    if(masterPreviewLevel!==undefined){
        masterPreviewLevel.reSetupLayout();
    }
}

function getRandomLevel(levelSet, previousCards, defaultOps = Level.SYMBOLS, overrideOps = false, shuffleCards) {
    for (let i = 0; i < levelSet.length; i++) {
        let lvl = levelSet[i];

        if (!sameCards(lvl.cards, previousCards)) {
            levelSet.splice(i, 1); 
            return buildLevel(lvl, defaultOps, overrideOps, shuffleCards);
        }
    }

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
    expr = expr.replace(/\s+/g, "");

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
        tokens.splice(i - 1, 3, String(res));
    }

    function reduceTokens(tokens) {
        let open;
        while ((open = tokens.lastIndexOf('(')) !== -1) {
            let close = tokens.indexOf(')', open + 1);
            const inner = tokens.slice(open + 1, close);
            reduceTokens(inner);
            tokens.splice(open, close - open + 1, inner[0]);
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '×' || tokens[i] === '÷') {
                applyOp(tokens, i);
                i--;
            }
        }
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
        return parseFloat(truncated.toString());
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
    let a = expression.substring(0, opIndex).trim();
    let b = expression.substring(opIndex + opFound.length).trim();
    a = parseFloat(a);
    b = parseFloat(b);
    if (isNaN(a) || isNaN(b)) return false;
    let result;
    switch (opFound) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '×': result = a * b; break;
        case '÷': if (b === 0) return false; result = a / b; break;
        default: return false;
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
        setThemeColor(color(175,175,175));
        if (typeof channel !== 'undefined') {
            channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });
        }
    }
    else if(screen === "game" || screen === "duel"){
        setThemeColor(theme.backgroundColor);
    }
    else if(screen === "battle"){
        setThemeColor(color(0,0,0));
        channel.send({
            type: "broadcast",
            event: "request_teams",
            payload: {}
        });
    }
    else if(screen === "battleMaster"){
        setThemeColor(color(0));
        channel.track({ role: "game_master" });
        if (typeof channel !== 'undefined') {
            channel.send({ 
                type: "broadcast", 
                event: "game_master_pong", 
                payload: {
                    teams: battleTeams,
                    scores: battleScores
                } 
            });
        }
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
        if (battleTeam === null) {  
            let centralOrbitRadius = 220;
            let orbitSpeed = battleTeams.length > 8 ? 0.00012 : 0.00024;
            let inputW = 260;
            let inputH = 45;
            let padding = 15;
            
            let inputX = width / 2 - inputW / 2;
            let targetInputY = height / 2 + centralOrbitRadius + 40;
            let maxInputY = height - 115 - padding;
            let inputY = constrain(targetInputY, padding, maxInputY);
            
            if (mouseX > inputX && mouseX < inputX + inputW && mouseY > inputY && mouseY < inputY + inputH) {
                return;
            }

            let btnX = width / 2 - 60;
            let btnY = inputY + inputH + 20; 
            if (mouseX > btnX && mouseX < btnX + 120 && mouseY > btnY && mouseY < btnY + 50) {
                let typedName = teamInput.value().trim();
                if (typedName !== "") {
                    channel.send({
                        type: "broadcast",
                        event: "new_team_created",
                        payload: { teamName: typedName }
                    });
                    setBattleTeam(typedName);
                    return;
                }
            }

            let baseTextSize = 40;
            let orbitPadding = battleTeams.length > 8 ? 3 : 20;
            let maxOrbitDiameter = 250;
            if (battleTeams.length > 1) {
                maxOrbitDiameter = min(250, 2 * centralOrbitRadius * sin(PI / battleTeams.length));
            }
            
            let maxTextWidth = 0;
            textSize(baseTextSize);
            for (let i = 0; i < battleTeams.length; i++) {
                let w = textWidth(battleTeams[i]);
                if (w > maxTextWidth) maxTextWidth = w;
            }
            let orbitDiameter = maxTextWidth + orbitPadding;
            if (orbitDiameter > maxOrbitDiameter) orbitDiameter = maxOrbitDiameter;

            let widthMax = 2 * centralOrbitRadius + maxOrbitDiameter;
            let sFactor = 1.0;
            if (widthMax > width) {
                sFactor = width / widthMax;
            }

            for (let i = 0; i < battleTeams.length; i++) {
                let ang = -PI * 0.8 + millis() * orbitSpeed + (i / battleTeams.length) * 2 * PI;
                let buttonX = width / 2 + (cos(ang) * centralOrbitRadius) * sFactor;
                let buttonY = height / 2 + (sin(ang) * centralOrbitRadius) * sFactor;
                if (dist(mouseX, mouseY, buttonX, buttonY) < (orbitDiameter * sFactor) / 2) {
                    let selectedTeam = battleTeams[i];
                    setBattleTeam(selectedTeam);
                    break; 
                }
            }
        } else {
            if (level && !battleWaiting) {
                level.handleClick(mouseX, mouseY);
            }
        }
    } else if (screen === "battleMaster") {
        if (mouseX > width - 230 && mouseX < width - 80 && mouseY > 80 && mouseY < 230) {
            battleLossFlash = 1;
            broadcastNewBattleLevel();
        }
        
        if (mouseX > width - 230 && mouseX < width - 80 && mouseY > 250 && mouseY < 400) {
            channel.send({
                type: "broadcast",
                event: "game_master_terminated",
                payload: {}
            });
            setScreen("title");
        }
        
        if (mouseX > width - 230 && mouseX < width - 80 && mouseY > 420 && mouseY < 570) {
            for (let t in battleScores) {
                battleScores[t] = 0;
            }
            channel.send({
                type: "broadcast",
                event: "sync_teams",
                payload: {
                    teams: battleTeams,
                    scores: battleScores
                }
            });
        }
        
        for (let i = 0; i < 9; i++) {
            let cx = width / 2;
            let cy = 125 + i * 45;
            
            if (mouseX > cx - 15 && mouseX < cx + 300 && mouseY > cy - 10 && mouseY < cy + 40) {
                setChecked[i] = !setChecked[i];
                if (!setChecked.includes(true)) {
                    setChecked[i] = true; 
                }
                break; 
            }
        }

        for (let i = 0; i < DOUBLER_REASON_KEYS.length; i++) {
            let cx = width / 2;
            let cy = 615 + i * 45;

            if (mouseX > cx - 15 && mouseX < cx + 300 && mouseY > cy - 10 && mouseY < cy + 40) {
                toggleDoublerReasonEnabled(DOUBLER_REASON_KEYS[i]);
                break;
            }
        }
    }
}

let processedTouchIds = new Set();

function touchStarted() {
    for (let t of touches) {
        if (screen === "battle" && battleTeam === null) {
            let centralOrbitRadius = 220;
            let inputW = 260;
            let inputH = 45;
            let padding = 15;
            
            let inputX = width / 2 - inputW / 2;
            let targetInputY = height / 2 + centralOrbitRadius + 40;
            let maxInputY = height - 115 - padding;
            let inputY = constrain(targetInputY, padding, maxInputY);

            if (t.x > inputX && t.x < inputX + inputW && t.y > inputY && t.y < inputY + inputH) {
                return; 
            }
        }

        if (!processedTouchIds.has(t.id)) {
            processedTouchIds.add(t.id);
            
            if (screen === "game") {
                level.handleClick(t.x, t.y);
            } else if (screen === "title") {
                titleScreen.handleClick(t.x, t.y);
            } else if (screen === "duel") {
                duel.handleClick(t.x, t.y);
            } else if (screen === "battle") {
                if (battleTeam === null) {
                    let centralOrbitRadius = 220;
                    let orbitSpeed = battleTeams.length > 8 ? 0.00012 : 0.00024;
                    
                    let inputW = 260;
                    let inputH = 45;
                    let btnW = 120;
                    let btnH = 50;
                    let padding = 15;
                    
                    let inputX = width / 2 - inputW / 2;
                    let targetInputY = height / 2 + centralOrbitRadius + 40;
                    let maxInputY = height - 115 - padding;
                    let inputY = constrain(targetInputY, padding, maxInputY);
                    
                    let btnX = width / 2 - 60;
                    let btnY = inputY + inputH + 20;
                    
                    if (t.x > btnX && t.x < btnX + btnW && t.y > btnY && t.y < btnY + btnH) {
                        let typedName = teamInput.value().trim();
                        if (typedName !== "") {
                            channel.send({
                                type: "broadcast",
                                event: "new_team_created",
                                payload: { teamName: typedName }
                            });
                            setBattleTeam(typedName);
                            return false;
                        }
                    }

                    let baseTextSize = 40;
                    let orbitPadding = battleTeams.length > 8 ? 3 : 20;
                    let maxOrbitDiameter = 250;
                    if (battleTeams.length > 1) {
                        maxOrbitDiameter = min(250, 2 * centralOrbitRadius * sin(PI / battleTeams.length));
                    }
                    
                    let maxTextWidth = 0;
                    textSize(baseTextSize);
                    for (let i = 0; i < battleTeams.length; i++) {
                        let w = textWidth(battleTeams[i]);
                        if (w > maxTextWidth) maxTextWidth = w;
                    }
                    let orbitDiameter = maxTextWidth + orbitPadding;
                    if (orbitDiameter > maxOrbitDiameter) orbitDiameter = maxOrbitDiameter;

                    let widthMax = 2 * centralOrbitRadius + maxOrbitDiameter;
                    let sFactor = 1.0;
                    if (widthMax > width) {
                        sFactor = width / widthMax;
                    }

                    for (let i = 0; i < battleTeams.length; i++) {
                        let ang = -PI * 0.8 + millis() * orbitSpeed + (i / battleTeams.length) * 2 * PI;
                        let buttonX = width / 2 + (cos(ang) * centralOrbitRadius) * sFactor;
                        let buttonY = height / 2 + (sin(ang) * centralOrbitRadius) * sFactor;
                        
                        if (dist(t.x, t.y, buttonX, buttonY) < (orbitDiameter * sFactor) / 2) {
                            let selectedTeam = battleTeams[i];
                            setBattleTeam(selectedTeam);
                            return false;
                        }
                    }
                } else if (level && !battleWaiting) {
                    level.handleClick(t.x, t.y);
                }
            }
        }
    }
    return false;
}

window.addEventListener("touchend", (e) => {
    for (let t of e.changedTouches) {
        processedTouchIds.delete(t.identifier);
    }
});

let firebaseReady = null;
document.addEventListener('firebase_initialized', () => {
    firebaseReady = window.firebaseAppReady;
    getGameCount().then(val => {
        gameCount = val;
    });
});

async function incrementGameCounter(change) {
    const incrementValue = typeof change === 'number' && !isNaN(change) ? change : 1; 

    if (!firebaseReady || !firebaseReady.isReady || !firebaseReady.increment) {
        return;
    }

    try {
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
        return 0; 
    }
    try {
        const { db, collection, doc, getDoc } = firebaseReady; 
        const gameCounterRef = doc(collection(db, 'gameStats'), 'globalCounter');
        const docSnap = await getDoc(gameCounterRef);
        if (docSnap.exists()) { 
            return docSnap.data().plays;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error getting game count:', error);
        return 0;
    }
}
const supabaseClient = window.supabase.createClient(
    "https://yjiizqjjuunbvmkuxulv.supabase.co",
    "sb_publishable_UgcUH946WkpvMmPIvHN0Yg_cDczSY6T",
    {
        auth: {
            persistSession: false // 💡 Fix: Stops Supabase from requesting browser storage access!
        }
    }
);
const channel = supabaseClient.channel("main-room", {
    config: {
        broadcast: { 
            self: true,
            ack: true
        }
    }
});
async function setupRealtime() {
    channel
        .on("broadcast", { event: "win" }, (msg) => {
            gameCount = msg.payload.gameCount;
            gameCountDrawScale = 2;
        })
        .on("broadcast", { event: "battle_win", filter: {} }, (msg) => {
            let winningTeam = msg.payload.team;
            battleLossFlash = 1;
            if (screen === "battleMaster" && winningTeam) {
                const doublerSet = battleDoublers[winningTeam];
                let validDoublerCount = 0;
                if (doublerSet) {
                    for (let reason of doublerSet) {
                        if (isDoublerReasonEnabled(reason)) validDoublerCount++;
                    }
                }
                const pointsWon = Math.pow(2, validDoublerCount);
                if (battleScores[winningTeam] !== undefined) {
                    battleScores[winningTeam] += pointsWon;
                } else {
                    battleScores[winningTeam] = pointsWon;
                }

                // --- NEW BATTLE MASTER FLASH ---
                battleMasterWinningTeam = winningTeam;
                battleMasterWinningPoints = pointsWon;
                battleMasterVictoryFlash = 1.0; 

                // 2. New round starts now; broadcastNewBattleLevel() clears
                // every team's doubler set.
                broadcastNewBattleLevel();
            }
        })
        .on("broadcast", { event: "battle_invalid_action" }, (msg) => {
            if (screen === "battleMaster" && msg.payload) {
                const team = msg.payload.team;
                const reason = msg.payload.reason;
                if (team && reason) {
                    // Always record the doubler (Set: repeating the same action
                    // doesn't add another doubler, but a different qualifying
                    // action does). Whether it actually counts toward the score
                    // is decided later, at win time, by the DOUBLERS: checklist -
                    // that way toggling a checkbox affects scoring immediately
                    // without needing to know what's already been triggered.
                    if (!battleDoublers[team]) {
                        battleDoublers[team] = new Set();
                    }
                    battleDoublers[team].add(reason);
                }
            }
        })
        .on("broadcast", { event: "sync_teams" }, (msg) => {
            if (msg.payload.teams) {
                for (let t of msg.payload.teams) {
                    if (!battleTeams.includes(t)) battleTeams.push(t);
                }
            }
            if (msg.payload.scores) {
                for (let t in msg.payload.scores) {
                    battleScores[t] = msg.payload.scores[t];
                }
            }
        })
        .on("broadcast", { event: "battle_level" }, (msg) => {
            if (msg.payload.teams) {
                for (let t of msg.payload.teams) {
                    let tTrim = t.trim();
                    if (tTrim && !battleTeams.includes(tTrim)) {
                        battleTeams.push(tTrim);
                    }
                }
            }
            if (msg.payload.scores) {
                for (let t in msg.payload.scores) {
                    battleScores[t] = msg.payload.scores[t];
                }
            }
            
            if (screen === "battle" && battleTeam !== null) {
                let args = msg.payload;
                
                if (args.forceReset || level === null || level === undefined) {
                    level = new Level(args.cards, args.ops, args.lvl, args.isClassic);
                    Level.setupKeyboard(level);
                    battleWaiting = false;
                    battleLossFlash = 2;
                }
            }
        })
        .on("broadcast", { event: "teams_list" }, (msg) => {
            if (msg.payload.teams) {
                for (let t of msg.payload.teams) {
                    let tTrim = t.trim();
                    if (tTrim && !battleTeams.includes(tTrim)) {
                        battleTeams.push(tTrim);
                    }
                }
                for (let t of battleTeams) {
                    if (battleScores[t] === undefined) {
                        battleScores[t] = 0;
                    }
                }
            }
        })
        .on("broadcast", { event: "ping_game_master" }, () => {
            if (screen === "battleMaster") {
                channel.send({ 
                    type: "broadcast", 
                    event: "game_master_pong", 
                    payload: {
                        teams: battleTeams,
                        scores: battleScores
                    } 
                });
            }
        }).on("broadcast", { event: "game_master_pong" }, (msg) => {
            if (msg.payload) {
                if (msg.payload.teams) {
                    for (let t of msg.payload.teams) {
                        let tTrim = t.trim();
                        if (tTrim && !battleTeams.includes(tTrim)) {
                            battleTeams.push(tTrim);
                        }
                    }
                }
                if (msg.payload.scores) {
                    for (let t in msg.payload.scores) {
                        battleScores[t] = msg.payload.scores[t];
                    }
                }
            }
            if (screen === "title" && titleScreen) {
                console.log("REVEAL BATTLE! yay");
                titleScreen.revealBattleButton();
            }
        })
        .on("broadcast", { event: "new_team_created" }, (msg) => {
            let newTeam = msg.payload.teamName.trim();
            if (newTeam) {
                if (!battleTeams.includes(newTeam)) {
                    battleTeams.push(newTeam);
                    battleScores[newTeam] = 0;
                }
                
                if (screen === "battleMaster" && currentBattleLevelData) {
                    channel.send({
                        type: "broadcast",
                        event: "battle_level",
                        payload: {
                            ...currentBattleLevelData,
                            teams: battleTeams,
                            scores: battleScores,
                            forceReset: false // 💡 Tell active players NOT to wipe their progress
                        }
                    });
                }
            }
        })
        .on("broadcast", { event: "game_master_terminated" }, () => {
            handleGameMasterLeft();
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
            for (let p of leftPresences) {
                if (p.role === "game_master") {
                    handleGameMasterLeft();
                }
            }
        });
    await channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
            if (screen === "title" && titleScreen) {
                channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });
            }
        }
    }); 
}
setupRealtime();

async function broadcastWin() {
    channel.send({
        type: "broadcast",
        event: "win",
        payload: { gameCount: gameCount, battleTeam: battleTeam }
    });
}

// Sent by a player in the "battle" screen when an operation they perform
// yields a negative number, a non-integer, a non-real number, or NaN.
// The battle master listens for this ("battle_invalid_action" handler above)
// and, per its settings, records it as a doubler for that team.
function broadcastBattleInvalidAction(reason) {
    channel.send({
        type: "broadcast",
        event: "battle_invalid_action",
        payload: { team: battleTeam, reason: reason }
    });
}

function broadcastNewBattleLevel() {
    // New round starting: every team's set of doublers resets.
    battleDoublers = {};

    // 1. Find which puzzle sets the Battle Master has active
    let validIndices = [];
    for (let i = 0; i < 9; i++) {
        if (setChecked[i]) validIndices.push(i);
    }
    
    // Fallback protection: if none are checked, default to Classic Easy (0)
    if (validIndices.length === 0) validIndices.push(0);
    
    // Pick a random set index out of the checked ones
    let pickedIndex = random(validIndices);
    
    let isClassic = pickedIndex < 5;
    let setIndex = isClassic ? pickedIndex : pickedIndex - 5;
    let levelSet = isClassic ? classicSets[setIndex] : puzzleSets[setIndex];
    
    // Ensure the set wraps around/shuffles if it runs out of cards
    if (levelSet.length === 0) {
        if (isClassic) {
            classicSets[setIndex] = shuffle([...originalClassicSets[setIndex]]);
            levelSet = classicSets[setIndex];
        } else {
            puzzleSets[setIndex] = shuffle([...originalPuzzleSets[setIndex]]);
            levelSet = puzzleSets[setIndex];
        }
    }
    
    // 2. Fetch the random level args using your system's custom helper
    let currentCards = masterPreviewLevel ? masterPreviewLevel.originalValues.map(c => c.real) : [];
    let defaultOps = isClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS;
    
    let levelArgs = getRandomLevel(levelSet, currentCards, defaultOps, false, false);
    
    // 3. Keep track of it in the global state so new clients can fetch it later
    currentBattleLevelData = {
        cards: levelArgs.cards,
        ops: levelArgs.ops,
        lvl: levelArgs.lvl,
        isClassic: isClassic
    };
    
    // Update the Game Master's bottom-left screen preview block
    masterPreviewLevel = new Level(levelArgs.cards, levelArgs.ops, levelArgs.lvl, isClassic);

    // 4. Send the level data out to everyone and clear their active progress boards!
    channel.send({
        type: "broadcast",
        event: "battle_level",
        payload: {
            ...currentBattleLevelData,
            teams: battleTeams,
            scores: battleScores,
            forceReset: true // 🎯 Forces active players to dump their progress and move forward!
        }
    });
}

window.addEventListener("beforeunload", function (e) {
    if (screen === "battleMaster" && typeof channel !== 'undefined') {
        // Broadcast the exit event cleanly if we have a split second to do so LOL
        channel.send({
            type: "broadcast",
            event: "game_master_terminated",
            payload: {}
        });
    }
});
function handleGameMasterLeft() {
    // 1. If they are actively in a multiplayer battle screen, kick them out
    if (screen === "battle") {
        battleTeam = null;
        battleTeams = []; // ? this should be fine
        battleWaiting = true;
        currentBattleLevelData = null;
        setScreen("title");
    }
    if (titleScreen) {
        titleScreen.showBattle = false;
    }
}