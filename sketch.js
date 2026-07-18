let isOnlineSession = false; // true only if ALL online stuff works (firebase, supabase)
let currentLang = localStorage.getItem('user_lang_preference') || getUserLanguage();
const USE_FLAG_EMOJIS = false;
let showFlagEmojis = false;

let screen = "title";
let level, duel, titleScreen, masterPreviewLevel, historyScreen, workshopScreen;
let originalClassicSets = [[], [], [], [], []];
let originalPuzzleSets = [[], [], [], []];
let classicSets = []; 
let puzzleSets = [];
let currentLevelSet = null;
let currentLevelSetIndex = null; 
let currentIsClassic = true;

let theme = {};
let canHover;
let isPhone;
let mx = -1, my = -1;
let canSetThemeColor = true;
let processedTouchIds = new Set();

function preload() {
    loadJSON("levelData/classicLevelsEasy.json", data => { originalClassicSets[0] = data; });
    loadJSON("levelData/classicLevelsMedium.json", data => { originalClassicSets[1] = data; });
    loadJSON("levelData/classicLevelsHard.json", data => { originalClassicSets[2] = data; });
    loadJSON("levelData/classicLevelsTricky.json", data => { originalClassicSets[3] = data; });
    loadJSON("levelData/classicLevelsVeryHard.json", data => { originalClassicSets[4] = data; });
    loadJSON("levelData/puzzleLevelsDiscovery.json", data => { originalPuzzleSets[0] = data; });
    loadJSON("levelData/puzzleLevelsInsight.json", data => { originalPuzzleSets[1] = data; });
    loadJSON("levelData/puzzleLevelsTheory.json", data => { originalPuzzleSets[2] = data; });
    loadJSON("levelData/puzzleLevelsJavaScriptWeirdness.json", data => { originalPuzzleSets[3] = data; });
    loadJSON("levelData/puzzleLevelsCrazyHard.json", data => { originalPuzzleSets[4] = data; });
}

function setup() {
    for(let s of originalClassicSets){
        classicSets.push(shuffle([...s]));
    }
    for(let s of originalPuzzleSets){
        puzzleSets.push(shuffle([...s]));
    }
    // testAllSolutions();

    canHover = window.matchMedia('(hover: hover)').matches;
    // Touch-primary input + a small viewport is our best available signal
    // for "this is a phone" (as opposed to a desktop/laptop, or a tablet,
    // which has more room for the battle-master screen).
    isPhone = window.matchMedia('(pointer: coarse)').matches && min(windowWidth, windowHeight) < 768;
    if(canHover){
        canSetThemeColor = false;
    }
    
    theme = {
        shadeColor : color(255,0,255),
        shadeColorCorrect : color(155,200,155),
        backgroundColor : color(210,225,250),
        backgroundColorCorrect : color(160,205,120),
        selectedColor : color(225,255,180)
    };

    createCanvas(windowWidth, windowHeight);
    
    teamInput = createInput('');
    teamInput.attribute('placeholder', TRANSLATIONS[currentLang].battleScreen.teamSelection.inputBox);
    teamInput.style('font-size', '20px');
    teamInput.style('padding', '10px');
    teamInput.style('border-radius', '8px');
    teamInput.style('border', '2px solid #323232');
    teamInput.style('text-align', 'center');
    teamInput.style('box-sizing', 'border-box');
    teamInput.style('font-family', 'Arial, sans-serif');

    historyScreen = new HistoryScreen();
    workshopScreen = new WorkshopScreen();

    let inputWidth = teamInput.elt.offsetWidth;
    let inputHeight = teamInput.elt.offsetHeight;
    let safeX = (windowWidth - inputWidth) / 2;
    let targetY = windowHeight - 150;
    let padding = 15; 
    let safeY = constrain(targetY, padding, windowHeight - inputHeight - padding);
    
    teamInput.position(safeX, safeY);
    teamInput.elt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            handleTeamSubmit();
            teamInput.elt.blur(); 
        }
    });
    teamInput.hide(); 

    if(USE_FLAG_EMOJIS){
        showFlagEmojis = systemSupportsFlagEmojis();
    }
    else{
        showFlagEmojis = false;
    }
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
        // Secret shortcut: always works to become battle master, regardless
        // of SHOW_HOST_BATTLE_BUTTON, and intentionally bypasses the
        // "is someone already battle master" check that the Host Battle
        // button performs.
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
    } else if (screen === "history") {
        historyScreen.draw();
    } else if (screen === "workshop") {
        workshopScreen.draw();
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
            let cy = 125 + i * 40; 
            
            stroke(255);
            strokeWeight(2);
            if (battleSetChecked[i]) fill(0,150,255); 
            else fill(0);                           
            rect(cx, cy, 30, 30, 5);
            
            noStroke();
            fill(255);
            textSize(24);
            textAlign(LEFT, CENTER);
            text(battleSetLabels[i], cx + 45, cy + 15);
        }

        textSize(28);
        fill(140);
        text("SIDE QUESTS (DOUBLERS):", width / 2, 510);
        fill(255);
        for (let i = 0; i < DOUBLER_REASON_KEYS.length; i++) {
            let cx = width / 2;
            let cy = 540 + i * 40;
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

        if (keyIsDown(72) && typeof masterPreviewLevel !== 'undefined') {
            push();
            textSize(20);
            fill(255, 230, 150);
            textAlign(CENTER, LEFT);

            let hintText = "Hint: " + masterPreviewLevel.getHint();
            text(hintText, width * 0.1, height * 0.85, width * 0.8, height * 0.12);
            pop();
        }
        
        if (battleMasterVictoryFlash > 0.005) {
            push();
            let alphaVal = 255 * min(1, battleMasterVictoryFlash * 1.5); 

            // interestingly, color(theme.backgroundColorCorrect) returns a reference, not a deep copy, so this is necessary to avoid mutation:
            let flashColor = color(red(theme.backgroundColorCorrect),green(theme.backgroundColorCorrect),blue(theme.backgroundColorCorrect),alphaVal * 0.95); 
            fill(flashColor);
            noStroke();
            rect(0, 0, width, height);

            fill(0, 0, 0, alphaVal);
            textAlign(CENTER, CENTER);
            let winString = battleMasterWinningTeam + " (+" + battleMasterWinningPoints+")";
            
            textSize(100); 
            let tw = textWidth(winString);
            let dynamicSize = (width * 0.8) / tw * 100;
            dynamicSize = min(dynamicSize, height * 0.4); 
            
            textSize(dynamicSize);
            text(winString, width / 2, height / 2);
            pop();

            battleMasterVictoryFlash *= 0.94;
        }
    }
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
    
    if(screen !== "history"){
        historyScreen.hide();
    }

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
        level = null; 
        channel.send({
            type: "broadcast",
            event: "request_current_level",
            payload: {}
        });
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
    else if(screen === "history"){
        historyScreen.show();
    }
    else{
        setThemeColor(color(0,0,0));
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
    if(masterPreviewLevel!==undefined){
        masterPreviewLevel.reSetupLayout();
    }
    if(historyScreen!==undefined){
        historyScreen.reSetupLayout();
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
    } else if (screen === "history") {
        historyScreen.handleClick(mouseX, mouseY);
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
                handleTeamSubmit();
                return;
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
            let cy = 125 + i * 40;
            
            if (mouseX > cx - 15 && mouseX < cx + 300 && mouseY > cy - 10 && mouseY < cy + 35) {
                battleSetChecked[i] = !battleSetChecked[i];
                if (!battleSetChecked.includes(true)) {
                    battleSetChecked[i] = true; 
                }
                break; 
            }
        }

        for (let i = 0; i < DOUBLER_REASON_KEYS.length; i++) {
            let cx = width / 2;
            let cy = 540 + i * 40;

            if (mouseX > cx - 15 && mouseX < cx + 300 && mouseY > cy - 10 && mouseY < cy + 35) {
                toggleDoublerReasonEnabled(DOUBLER_REASON_KEYS[i]);
                break;
            }
        }
    }
}

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
            } else if (screen === "history") {
                historyScreen.handleClick(t.x, t.y);
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
                        handleTeamSubmit();
                        return false;
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
    if (screen === "history") {
        return true; // for the html boxes
    }
    return false;
}

window.addEventListener("touchend", (e) => {
    for (let t of e.changedTouches) {
        processedTouchIds.delete(t.identifier);
    }
});

function isOnlineAvailable() {
    return window.firebaseAppReady && 
           window.firebaseAppReady.isOnlineMode === true && 
           typeof supabase !== 'undefined';
}

function getUserLanguage() {
    const preferences = navigator.languages || [navigator.language || ''];
    for (const lang of preferences) {
        if (lang.startsWith('zh')) {
            return (lang.startsWith('zh-TW') || lang.startsWith('zh-HK') || lang.startsWith('zh-MO') || lang.includes('Hant'))
                ? 'chinese_traditional'
                : 'chinese_simplified';
        }
        if (lang.startsWith('en')) return 'english';
    }
    try {
        const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
        if (intlLocale.startsWith('zh')) {
            return (intlLocale.startsWith('zh-TW') || intlLocale.startsWith('zh-HK') || intlLocale.startsWith('zh-MO') || intlLocale.includes('Hant'))
                ? 'chinese_traditional'
                : 'chinese_simplified';
        }
        if (intlLocale.startsWith('en')) return 'english';
    } catch (e) {}
    
    // everyone else just sees english by default
    return 'english';
}

function changeLanguage(newLang) {
    currentLang = newLang;
    if(titleScreen!==undefined){
        titleScreen.getTitleBasedSizes(true);
    }
    localStorage.setItem('user_lang_preference', newLang);
}

function systemSupportsFlagEmojis() {
    const canvas = document.createElement('canvas');
    canvas.width = 30;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // Draw the emoji flag on our hidden canvas
    ctx.textBaseline = 'top';
    ctx.font = '16px sans-serif';
    ctx.fillText('🇺🇸', 0, 0);

    // Grab the pixel data of the drawn area
    const imgData = ctx.getImageData(0, 0, 24, 24).data;
    
    // Check if the pixel data contains multiple distinct color channels 
    // (A real flag emoji will have vibrant, differing RGB values like red/blue)
    let hasColorVariation = false;
    for (let i = 0; i < imgData.length; i += 4) {
        let r = imgData[i];
        let g = imgData[i+1];
        let b = imgData[i+2];
        let a = imgData[i+3];

        if (a > 0) { // If the pixel isn't transparent
            // If R, G, and B are significantly different, it's a colorful asset, not monochrome text
            if (abs(r - g) > 40 || abs(r - b) > 40 || abs(g - b) > 40) {
                hasColorVariation = true;
                break;
            }
        }
    }
    return hasColorVariation;
}