// When true: the battle button shows "Host Battle" (and lets anyone become
// battle master) when no battle master currently exists.
// When false: the battle button is hidden entirely when no battle master
// exists, matching the original behavior - the only way to become battle
// master is the slash + backslash shortcut (see sketch.js), which always
// works regardless of this flag.
const SHOW_HOST_BATTLE_BUTTON = true;

let battleTeams = []; 
let battleTeam = null;
let battleScores = {};
let battleWaiting = true;
let currentBattleLevelData = null;
let battleMasterVictoryFlash = 0;
let battleMasterWinningTeam = "";
let battleMasterWinningPoints = 0;
let battleVictoryFlash = 0;
let battleLossFlash = 0;
let battleMasterBackgroundImg;
let teamInput; 
let battleMasterCheckTimeout = null;

let battleSetLabels = [
    "Random Easy", "Random Medium", "Random Hard", "Random Tricky", "Random Very Hard",
    "Designed Discovery", "Designed Insight", "Designed Theory", "Designed Javascript 😭", "Designed Crazy Hard"
];
let battleSetChecked = [true, false, false, false, false, false, false, false, false, false];
let battleMasterAwardForNegativeNumber = true;
let battleMasterAwardForNonInteger = true;
let battleMasterAwardForNonReal = true;
let battleMasterAwardForNaN = true;
let battleMasterAwardForOver24 = true;
let battleMasterAwardForOver9000 = true;

let battleDoublers = {};
const BATTLE_DOUBLER_LABELS = {
    negative_number: "Negative", // obtain a negative real number (examples: -1, -3.14)
    non_integer: "Non-Integer", // obtain a non-integer number (examples: 0.5, 1+i)
    non_real: "Non-Real", // obtain a non-real number (examples: i, 1+2i)
    invalid_number: "NaN", // obtain something mathematically undefined, indeterminate, or too big for javascript to handle (examples: division by zero, zero to the power of zero, natural log of zero, factorial of negative integers)
    over_24: "Over 24", // obtain something with an absolute value or modulus strictly greater than 9000 (examples: 20+20i, -24.01)
    over_9000: "IT'S OVER 9000" // obtain something with an absolute value or modulus strictly greater than 24 (examples: 8000+8000i, -9000.01)
};
const DOUBLER_REASON_KEYS = Object.keys(BATTLE_DOUBLER_LABELS);

function isDoublerReasonEnabled(reasonKey) {
    switch (reasonKey) {
        case "negative_number": return battleMasterAwardForNegativeNumber;
        case "non_integer": return battleMasterAwardForNonInteger;
        case "non_real": return battleMasterAwardForNonReal;
        case "invalid_number": return battleMasterAwardForNaN;
        case "over_24": return battleMasterAwardForOver24;
        case "over_9000": return battleMasterAwardForOver9000;
        default: return false;
    }
}

function toggleDoublerReasonEnabled(reasonKey) {
    switch (reasonKey) {
        case "negative_number": battleMasterAwardForNegativeNumber = !battleMasterAwardForNegativeNumber; break;
        case "non_integer": battleMasterAwardForNonInteger = !battleMasterAwardForNonInteger; break;
        case "non_real": battleMasterAwardForNonReal = !battleMasterAwardForNonReal; break;
        case "invalid_number": battleMasterAwardForNaN = !battleMasterAwardForNaN; break;
        case "over_24": battleMasterAwardForOver24 = !battleMasterAwardForOver24; break;
        case "over_9000": battleMasterAwardForOver9000 = !battleMasterAwardForOver9000; break;
    }
}

async function setupRealtime() { // this function won't even be called if channel is undefined at the time of this script being run (offline mode)
    channel
        .on("broadcast", { event: "win" }, (msg) => {
            gameCount = msg.payload.gameCount;
            gameCountDrawScale = 2.15; // this is just, in general. for the game count
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

                battleMasterWinningTeam = winningTeam;
                battleMasterWinningPoints = pointsWon;
                battleMasterVictoryFlash = 50; 

                broadcastNewBattleLevel();
            }
        })
        .on("broadcast", { event: "battle_invalid_action" }, (msg) => {
            if (screen === "battleMaster" && msg.payload) {
                const team = msg.payload.team;
                // Support both the new "reasons" array (a value can satisfy several
                // doublers at once) and the legacy single "reason" field.
                const reasons = msg.payload.reasons || (msg.payload.reason ? [msg.payload.reason] : []);
                if (team && reasons.length) {
                    if (!battleDoublers[team]) {
                        battleDoublers[team] = new Set();
                    }
                    for (const reason of reasons) {
                        battleDoublers[team].add(reason);
                    }
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

                    // The level's starting numbers count toward doublers too,
                    // not just numbers produced later by operations.
                    maybeBroadcastBattleDoublersForInitialValues(level);
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
                titleScreen.revealBattleButton();
            }
            if (battleMasterCheckTimeout) {
                clearTimeout(battleMasterCheckTimeout);
                battleMasterCheckTimeout = null;
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
                            forceReset: false
                        }
                    });
                }
            }
        }).on("broadcast", { event: "request_current_level" }, (msg) => {
            if (screen === "battleMaster" && currentBattleLevelData) {
                channel.send({
                    type: "broadcast",
                    event: "battle_level",
                    payload: {
                        ...currentBattleLevelData,
                        teams: battleTeams,
                        scores: battleScores,
                        forceReset: false
                    }
                });
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
            isOnlineSession = true; // sketchy?
            if (screen === "title" && titleScreen) {
                channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });
            }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            isOnlineSession = false;
        }
    }); 
}

if(channel !== undefined){
    setupRealtime();
}

// --- BATTLE HELPER LOGIC ---
async function broadcastWin() {
    channel.send({
        type: "broadcast",
        event: "win",
        payload: { gameCount: gameCount, battleTeam: battleTeam }
    });
}

function attemptBecomeBattleMaster() {
    // Ask if anyone out there is already the battle master. Any existing
    // battle master will respond with "game_master_pong", which reveals the
    // "Join Battle" state (see setupRealtime above) and cancels this check.
    channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });

    if (battleMasterCheckTimeout) {
        clearTimeout(battleMasterCheckTimeout);
    }

    battleMasterCheckTimeout = setTimeout(() => {
        battleMasterCheckTimeout = null;
        if (titleScreen) {
            titleScreen.checkingHostBattle = false;
        }
        // Only claim the role if nobody answered our ping - i.e. there is
        // still no known battle master. This keeps there from ever being
        // two battle masters at once.
        if (screen === "title" && titleScreen && !titleScreen.showBattleButton) {
            setScreen("battleMaster");
        }
    }, 600);
}

function broadcastBattleDoublerAction(reasons) {
    // Accept either a single reason (legacy) or an array of reasons, so that
    // one value satisfying multiple doublers simultaneously reports all of them.
    const reasonList = Array.isArray(reasons) ? reasons : [reasons];
    if (!reasonList.length) return;
    channel.send({
        type: "broadcast",
        event: "battle_invalid_action",
        payload: { team: battleTeam, reasons: reasonList }
    });
}

function broadcastNewBattleLevel() {
    battleDoublers = {};
    let validIndices = [];
    for (let i = 0; i < 9; i++) {
        if (battleSetChecked[i]) validIndices.push(i);
    }
    
    if (validIndices.length === 0) validIndices.push(0);
    
    let pickedIndex = random(validIndices);
    
    let isClassic = pickedIndex < 5;
    let setIndex = isClassic ? pickedIndex : pickedIndex - 5;
    let levelSet = isClassic ? classicSets[setIndex] : puzzleSets[setIndex];
    
    if (levelSet.length === 0) {
        if (isClassic) {
            classicSets[setIndex] = shuffle([...originalClassicSets[setIndex]]);
            levelSet = classicSets[setIndex];
        } else {
            puzzleSets[setIndex] = shuffle([...originalPuzzleSets[setIndex]]);
            levelSet = puzzleSets[setIndex];
        }
    }
    
    let currentCards = masterPreviewLevel ? masterPreviewLevel.originalValues.map(c => c.real) : [];
    let defaultOps = isClassic ? ["+", "-", "×", "÷"] : Level.SYMBOLS;
    
    let levelArgs = getRandomLevel(levelSet, currentCards, defaultOps, false, false);
    
    currentBattleLevelData = {
        cards: levelArgs.cards,
        ops: levelArgs.ops,
        lvl: levelArgs.lvl,
        isClassic: isClassic
    };
    
    masterPreviewLevel = new Level(levelArgs.cards, levelArgs.ops, levelArgs.lvl, isClassic);

    channel.send({
        type: "broadcast",
        event: "battle_level",
        payload: {
            ...currentBattleLevelData,
            teams: battleTeams,
            scores: battleScores,
            forceReset: true
        }
    });
}

function handleGameMasterLeft() {
    if (screen === "battle") {
        battleTeam = null;
        battleTeams = [];
        battleWaiting = true;
        currentBattleLevelData = null;
        setScreen("title");
    }
    if (titleScreen) {
        titleScreen.showBattleButton = false;
    }
}

window.addEventListener("beforeunload", function (e) {
    if (screen === "battleMaster" && typeof channel !== 'undefined') {
        channel.send({
            type: "broadcast",
            event: "game_master_terminated",
            payload: {}
        });
    }
});

// --- BATTLE UI DRAWING METHODS ---
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
    text(TRANSLATIONS[currentLang].battleScreen.teamSelection.instructions, 0, -5);
    
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

    let inputW = 260;
    let inputH = 50;
    let btnW = 120;
    let btnH = 50;
    let padding = 15;

    let inputX = width / 2 - inputW / 2;
    let targetInputY = height / 2 + centralOrbitRadius + 40;
    
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
    text(TRANSLATIONS[currentLang].battleScreen.teamSelection.join, btnX + btnW / 2, btnY + btnH / 2);
}

 // from teamInput, team is set to teamInput.value()
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
    text(TRANSLATIONS[currentLang].battleScreen.waitingRoom.team+team+"\n"+TRANSLATIONS[currentLang].battleScreen.waitingRoom.waiting, width / 2, height / 2);
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
    battleVictoryFlash*=0.9;
    battleLossFlash*=0.95;
}