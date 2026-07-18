class TitleScreen {
    constructor() {
        this.showBattleButton = false;
        this.checkingHostBattle = false;
        this.boxes = [];
        this.boxW = min(220, width * 0.35);
        this.boxH = min(80, height * 0.09);
        this.marginY = 2; // min(16, height * 0.016);
        this.padding = 12; // for little corner buttons like language buttons
        this.bubbleBox = new BubbleBox(0,0,width,height,20,0);
        this.duelMode = false;
        this.mainTitleSize = constrain(width*0.08,65,105);
        
        // We only need the loops to capture the indices structurally
        let labels = [];
        for(let i = 0; i<5; i++){
            labels.push({ set: i });
        }
        for(let i = 0; i<5; i++){
            labels.push({ set: i });
        }

        for (let i = 0; i < labels.length; i++) {
            const isClassic = i < 5;

            const col = isClassic ? 0 : 1;
            const row = isClassic ? i : i - 5;
            const x = width * (0.3 + 0.4 * col) - this.boxW / 2;
            const y = height*0.4 + row * (this.boxH + this.marginY);

            this.boxes.push({
                x, y, w: this.boxW, h: this.boxH,
                isClassic: isClassic,
                set: isClassic ? classicSets[labels[i].set] : puzzleSets[labels[i].set],
                setIndex: labels[i].set, // This index allows us to look up translations dynamically
                drawOffset: 0,
                drawAngle: 0,
                drawScale: 1
            });
        }

        this.duelButton = new Button({
            x: 1, y: 1, w: 1, h: 1, // placeholder. will resize
            label: "Duel button",
            style: {
                r: 15, onHoverMovement: 0.0035, textColor: color(111),
                predraw: () => {
                    if(titleScreen.duelMode){
                        titleScreen.duelButton.style.mainColor = theme.selectedColor;
                        titleScreen.duelButton.style.shadeColor = theme.shadeColorCorrect;
                        titleScreen.duelButton.style.hovering = true;
                    } else {
                        titleScreen.duelButton.style.mainColor = color(255,255,255);
                        titleScreen.duelButton.style.shadeColor = theme.shadeColor;
                        titleScreen.duelButton.style.hovering = false;
                    }
                }
            },
            getText: () => TRANSLATIONS[currentLang].titleScreen.duelButton,
            onClick: () => { titleScreen.duelMode = !titleScreen.duelMode }
        });
        this.battleButton = new Button({
            x: 1, y: 1, w: 1, h: 1, // placeholder. will resize
            label: "Battle button",
            style: {
                r: 15, onHoverMovement: 0.0035, textColor: color(111),
                predraw: () => {
                    if (titleScreen.isBattleButtonActive()) {
                        titleScreen.battleButton.style.mainColor = color(255,255,255);
                        titleScreen.battleButton.style.shadeColor = theme.shadeColor;
                    } else {
                        // Greyed out: either offline entirely, or trying to
                        // host from a phone (joining still works normally).
                        titleScreen.battleButton.style.mainColor = color(210,210,210);
                        titleScreen.battleButton.style.shadeColor = color(160,160,160);
                    }
                    titleScreen.battleButton.style.hovering = false;
                }
            },
            getText: () => {
                if (this.showBattleButton) {
                    return TRANSLATIONS[currentLang].titleScreen.joinBattleButton;
                }
                if (this.checkingHostBattle) {
                    return (TRANSLATIONS[currentLang].titleScreen.hostBattleChecking) || "Checking...";
                }
                return (TRANSLATIONS[currentLang].titleScreen.hostBattleButton) || "Host Battle";
            },
            onClick: () => {
                if (!this.isBattleButtonActive()) return; // inactive: do nothing
                if (this.showBattleButton) {
                    // A battle master already exists elsewhere - join their battle.
                    setScreen("battle");
                } else {
                    // No battle master exists - become one.
                    this.hostBattle();
                }
            }
        });
        this.getTitleBasedSizes(true); // set proper sizes

        let langBtnW = min(100, width * 0.13); 
        let langBtnH = 30;
        let langGap = 2; // 10;

        let englishGetText, traditionalChineseGetText, simplifiedChineseGetText;
        if(langBtnW<60){
            englishGetText = showFlagEmojis ? "Eng🇺🇸" : "Eng";
            traditionalChineseGetText = showFlagEmojis ? "繁體🇹🇼" : "繁體";
            simplifiedChineseGetText = showFlagEmojis ? "简体🇨🇳" : "简体";
        }
        else{
            englishGetText = showFlagEmojis ? "English🇺🇸" : "English";
            traditionalChineseGetText = showFlagEmojis ? "繁體中文🇹🇼" : "繁體中文";
            simplifiedChineseGetText = showFlagEmojis ? "简体中文🇨🇳" : "简体中文";
        }

        this.historyButton = new Button({
            x: this.padding, 
            y: height-this.padding-70,
            w: 45,
            h: 70,
            label: "History Button",
            style: {r: 8, onHoverMovement: -0.0035, textColor: color(111)},
            getText: () => TRANSLATIONS[currentLang].titleScreen.historyButton,
            onClick: () => { setScreen("history"); }
        });

        this.englishButton = new Button({
            x: width - langBtnW * 3 - langGap * 2 - this.padding, 
            y: this.padding, 
            w: langBtnW, 
            h: langBtnH,
            label: "English Button",
            style: {
                r: 8, onHoverMovement: 0.0025, textColor: color(111),
                predraw: () => {
                    let s = titleScreen.englishButton.style;
                    if (currentLang === 'english') {
                        s.mainColor = theme.selectedColor;
                        s.shadeColor = theme.shadeColorCorrect;
                        s.hovering = true;
                    } else {
                        s.mainColor = color(255,255,255);
                        s.shadeColor = theme.shadeColor;
                        s.hovering = false;
                    }
                }
            },
            getText: () => englishGetText,
            onClick: () => { changeLanguage('english'); }
        });

        this.traditionalChineseButton = new Button({
            x: width - langBtnW * 2 - langGap - this.padding, 
            y: this.padding, 
            w: langBtnW, 
            h: langBtnH,
            label: "Traditional Chinese Button",
            style: {
                r: 8, onHoverMovement: 0.0025, textColor: color(111),
                predraw: () => {
                    let s = titleScreen.traditionalChineseButton.style
                    if (currentLang === 'chinese_traditional') {
                        s.mainColor = theme.selectedColor;
                        s.shadeColor = theme.shadeColorCorrect;
                        s.hovering = true;
                    } else {
                        s.mainColor = color(255);
                        s.shadeColor = theme.shadeColor;
                        s.hovering = false;
                    }
                }
            },
            getText: () => traditionalChineseGetText,
            onClick: () => { changeLanguage('chinese_traditional'); }
        });

        this.simplifiedChineseButton = new Button({
            x: width - langBtnW - this.padding, 
            y: this.padding, 
            w: langBtnW, 
            h: langBtnH,
            label: "Simplified Chinese Button",
            style: {
                r: 8, onHoverMovement: 0.0025, textColor: color(111),
                predraw: () => {
                    let s = titleScreen.simplifiedChineseButton.style;
                    if (currentLang === 'chinese_simplified') {
                        s.mainColor = theme.selectedColor;
                        s.shadeColor = theme.shadeColorCorrect;
                        s.hovering = true;
                    } else {
                        s.mainColor = color(255);
                        s.shadeColor = theme.shadeColor;
                        s.hovering = false;
                    }
                }
            },
            getText: () => simplifiedChineseGetText,
            onClick: () => { changeLanguage('chinese_simplified'); }
        });
        
        this.workshopButton = new Button({
            x: width - this.historyButton.w*2 - this.padding,
            y: height - this.historyButton.h - this.padding,
            w: this.historyButton.w*2,
            h: this.historyButton.h,
            label: "Workshop Button",
            style: {r: 8, onHoverMovement: -0.0035, textColor: color(111)},
            getText: () => TRANSLATIONS[currentLang].titleScreen.workshopButton,
            onClick: () => { setScreen("workshop") }
        });

        if (typeof channel !== 'undefined') {
            channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });
        }
    }

    getTitleBasedSizes(resizeButtons) { // resizeButtons edits the width of the duel and battle buttons
        textSize(this.mainTitleSize);
        this.gap = 2; // 13;
        this.btnSumW = textWidth(TRANSLATIONS[currentLang].titleScreen.mainTitle); // this.boxW * 1.2 + this.gap;
        this.btnStartX = width / 2 - this.btnSumW / 2;
        this.btnY = height * 0.2;
        this.btnH = this.boxes[0].h;
        // let split = (currentLang === "english" ? 0.6 : 0.5); 
        let split = 0.5;
        this.duelW = (this.btnSumW-this.gap) * split; 
        this.battleW = (this.btnSumW-this.gap) * (1-split);
        if(resizeButtons){
            this.duelButton.x = this.btnStartX;
            this.duelButton.y = this.btnY;
            this.duelButton.w = this.duelW;
            this.duelButton.h = this.btnH;
            this.battleButton.x = this.btnStartX + this.duelW + this.gap;
            this.battleButton.y = this.btnY;
            this.battleButton.w = this.battleW;
            this.battleButton.h = this.btnH;
        }
    }

    revealBattleButton() {
        this.showBattleButton = true;
        this.checkingHostBattle = false;
    }

    // Single source of truth for "is the realtime session actually up".
    // isOnlineSession reflects whether the realtime channel is subscribed;
    // navigator.onLine reflects the browser's own network status. Both need
    // to hold for battle features to work.
    isOnline() {
        return isOnlineSession && navigator.onLine;
    }

    // Hosting is never available on phones, and never while offline.
    canHostBattle() {
        return this.isOnline() && !isPhone;
    }

    // Joining works from any device, but still requires being online.
    canJoinBattle() {
        return this.isOnline();
    }

    isBattleButtonVisible() {
        return this.showBattleButton || SHOW_HOST_BATTLE_BUTTON;
    }

    isBattleButtonActive() {
        return this.showBattleButton ? this.canJoinBattle() : this.canHostBattle();
    }

    hostBattle() {
        // Guard against double-clicks, against hosting when a battle master
        // is already known to exist, and against hosting from a phone or
        // while offline (isBattleButtonActive/canHostBattle already keep the
        // button from being clickable in those cases, but this is a safe
        // fallback in case hostBattle() is ever called directly).
        if (this.showBattleButton || this.checkingHostBattle) return;
        if (!this.canHostBattle()) return;

        this.checkingHostBattle = true;
        attemptBecomeBattleMaster();
    }

    draw() {
        background(255);

        this.drawBubbleBox();

        noStroke();
        background(100,93,85,145)
        
        this.drawBoxes();
        
        this.duelButton.draw();
        
        const battleButtonVisible = this.isBattleButtonVisible();
        this.battleButton.style.transparent = !battleButtonVisible;
        this.battleButton.style.onHoverMovement = this.isBattleButtonActive() ? 0.0045 : 0;
        this.battleButton.draw();

        this.historyButton.draw();
        this.englishButton.draw();
        this.traditionalChineseButton.draw();
        this.simplifiedChineseButton.draw();
        this.workshopButton.draw();

        noStroke();
        for(let y = 2; y>=-2; y-=2){
            for(let x = y/3-1; x<y/3+1.1; x+=1){
                fill(y<0 ? color(255,255,255) : color(100,93,85));
                textAlign(CENTER,CENTER);
                textSize(this.mainTitleSize);
                
                text(TRANSLATIONS[currentLang].titleScreen.mainTitle, width*0.5+x, height*0.14+y);
                
                textSize(constrain(width*0.035,27,45));
                text(TRANSLATIONS[currentLang].titleScreen.randomSetSection,width*0.3+x, height*0.363+y*0.8);
                text(TRANSLATIONS[currentLang].titleScreen.designedSetSection,width*0.7+x, height*0.363+y*0.8);
                textAlign(LEFT,BOTTOM);
                
                let s = constrain(width * 0.035, 27, 35);
                if (isOnlineSession) {
                    if (gameCount !== undefined) {
                        textSize(s);
                        text(TRANSLATIONS[currentLang].titleScreen.getGameCountUpperText(gameCount), this.historyButton.w + 2*this.padding + x, height - s - this.padding + y * 0.8);
                        text(TRANSLATIONS[currentLang].titleScreen.gameCountLowerText, this.historyButton.w + 2*this.padding + x, height - this.padding + y * 0.8);
                        let w = textWidth(" "+TRANSLATIONS[currentLang].titleScreen.getGameCountUpperText(gameCount));
                        textSize(s * (gameCountDrawScale + 0.3));
                        text(gameCount, width - this.historyButton.w - 2*this.padding - w + x + (gameCountDrawScale-1)*4, height - s - this.padding + 2 + y * 0.8 + (gameCountDrawScale-1)*8);
                    }
                } else {
                    textSize(s);
                    text("📡❌", this.historyButton.w + 2*this.padding + x, height - s*1.15 - this.padding + y * 0.8);
                    text(TRANSLATIONS[currentLang].titleScreen.offlineMode, this.historyButton.w + 2*this.padding + x, height - this.padding + y * 0.8);
                }
            }
        }
        gameCountDrawScale = 1 + (gameCountDrawScale - 1) * 0.99;
    }

    drawBubbleBox() {
        let rotateAng = 0.17;
        let scaleFactor = 1.05;
        push();
        translate(width/2,height/2);
        rotate(rotateAng);
        scale(scaleFactor);
        translate(-width/2,-height/2);
        let mAng = atan2(mouseY-height/2,mouseX-width/2)-rotateAng;
        let mDst = dist(mouseX,mouseY,width/2,height/2)/scaleFactor;
        this.bubbleBox.draw(width/2+mDst*cos(mAng),height/2+mDst*sin(mAng));
        pop();
    }
    
    drawBoxes() { // distinct from Level boxes, which are for the number cards
        for (let b of this.boxes) {
            if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
                b.drawOffset += constrain((width*0.7-this.boxW)*0.025,1,5) * (b.isClassic ? 1 : -1);
            }

            push();
            translate(b.x + b.w / 2, b.y + b.h / 2);
            scale(b.drawScale);
            translate(b.drawOffset, 0);
            rotate(b.drawAngle);
            translate(-b.x - b.w / 2, -b.y - b.h / 2);

            if(typeof drawShadedButton === "function"){
                drawShadedButton(b.x, b.y, b.w, b.h, 15, b.isClassic ? color(255,210,160) : color(180,210,255));
            } else {
                fill(255);
                stroke(100, 93, 85);
                strokeWeight(3);
                rect(b.x, b.y, b.w, b.h, 15);
            }

            noStroke();
            textAlign(CENTER, CENTER);
            fill(b.isClassic ? color(255,120,0) : color(30,60,255));

            const maxWidth = b.w - 10;
            const maxHeight = b.h - 10;
            
            // chinese has finer text so show it bigger relative to vertical height
            let fontSize = min(currentLang.startsWith('chinese') ? 30 : 24, b.h * 0.46);
            textSize(fontSize);
            let label = b.isClassic 
                ? TRANSLATIONS[currentLang].titleScreen.randomSets[b.setIndex] 
                : TRANSLATIONS[currentLang].titleScreen.designedSets[b.setIndex];

            let fallbackWidth = textWidth(label);
            let fallbackHeight = fontSize * 1.2;

            if (fallbackWidth <= maxWidth && fallbackHeight <= maxHeight) {
                text(label, b.x + b.w / 2, b.y + b.h / 2);
            } else {
                let lines = [];
                let currentLine = '';

                if (currentLang.startsWith('english')) { // REMEMBER TO ALSO DO THIS FOR OTHER SPACED LANGUAGES IF I EVER ADD THEM
                    // Split word by word
                    let words = label.split(' ');
                    for (let word of words) {
                        let testLine = currentLine === '' ? word : currentLine + ' ' + word;
                        
                        if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                } else { // non-spaced langauge like chinese or japanese
                    for (let char of label) {
                        let testLine = currentLine + char;
                        if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
                            lines.push(currentLine);
                            currentLine = char;
                        } else {
                            currentLine = testLine;
                        }
                    }
                }
                if (currentLine.length > 0) lines.push(currentLine);

                const lineHeight = fontSize * 1.1;
                const startY = b.y + b.h / 2 - (lines.length - 1) * lineHeight / 2;

                lines.forEach((line, j) => {
                    text(line, b.x + b.w / 2, startY + j * lineHeight);
                });
            }

            pop();
            
            b.drawAngle *= 0.8;
            b.drawScale = 1 + (b.drawScale - 1) * 0.9;
            b.drawOffset *= 0.8;
        }
    }

    handleClick(mx, my) {
        for (let b of this.boxes) {
            if (mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h) {
                currentLevelSet = b.set;
                currentLevelSetIndex = b.setIndex;
                currentIsClassic = b.isClassic;
                theme.shadeColor = (b.isClassic ? color(255,210,160) : color(180,210,255));
                theme.backgroundColor = (b.isClassic ? color(255,225,190) : color(210,225,250));
                checkResetSet();
                let levelData = getRandomLevel(currentLevelSet, [], currentIsClassic ? ["+","-","×","÷"] : Level.SYMBOLS, false, false);

                if(this.duelMode){
                    duel = new Duel(levelData.cards,levelData.ops,levelData.lvl);
                    setScreen("duel");
                }
                else{
                    level = new Level(levelData.cards,levelData.ops,levelData.lvl, b.isClassic);
                    Level.setupKeyboard(level);
                    setScreen("game");
                }

                return;
            }
        }
        
        const buttons = [this.duelButton, this.historyButton, this.englishButton, this.traditionalChineseButton, this.simplifiedChineseButton, this.workshopButton];
        if (this.isBattleButtonVisible() && this.isBattleButtonActive()) {
            buttons.push(this.battleButton);
        }

        for(const btn of buttons) {
            if(btn.contains(mx, my)) {
                btn.drawScale -= 0.08;
                btn.onClick();
                return;
            }
        }
    }
}