class TitleScreen {
    constructor() {
        this.showBattleButton = false;
        this.boxes = [];
        this.boxW = min(220, width * 0.35);
        this.boxH = min(80, height * 0.1);
        this.marginY = min(16, height * 0.016);
        this.bubbleBox = new BubbleBox(0,0,width,height,20,0);
        this.duelMode = false;
        
        // We only need the loops to capture the indices structurally
        let labels = [];
        for(let i = 0; i<5; i++){
            labels.push({ set: i });
        }
        for(let i = 0; i<4; i++){
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

        this.gap = 13;
        this.btnSumW = this.boxW * 1.2 + this.gap;
        this.btnStartX = width / 2 - this.btnSumW / 2;
        this.btnY = height * 0.2;
        this.btnH = this.boxes[0].h;
        
        this.duelW = (this.btnSumW-this.gap) * 0.64; 
        this.battleW = (this.btnSumW-this.gap) * 0.36;

        this.duelButton = new Button({
            x: this.btnStartX, 
            y: this.btnY, w: this.duelW, h: this.btnH,
            label: "Duel button",
            style: {
                r: 15, onHoverMovement: 0.003, textColor: color(111),
                predraw: () => {
                    if(titleScreen.duelMode){
                        titleScreen.duelButton.style.mainColor = color(225,255,180);
                        titleScreen.duelButton.style.shadeColor = theme.shadeColorCorrect;
                        titleScreen.duelButton.style.hovering = true;
                    } else {
                        titleScreen.duelButton.style.mainColor = color(255,255,255);
                        titleScreen.duelButton.style.shadeColor = theme.shadeColor;
                        titleScreen.duelButton.style.hovering = false;
                    }
                }
            },
            getText: () => TRANSLATIONS[currentLang].duelButton,
            onClick: () => { titleScreen.duelMode = !titleScreen.duelMode }
        });

        this.battleButton = new Button({
            x: this.btnStartX + this.duelW + this.gap, y: this.btnY, w: this.battleW, h: this.btnH,
            label: "Battle button",
            style: {
                r: 15, onHoverMovement: 0.003, textColor: color(111),
                predraw: () => {
                    titleScreen.battleButton.style.mainColor = color(255,255,255);
                    titleScreen.battleButton.style.shadeColor = theme.shadeColor;
                    titleScreen.battleButton.style.hovering = false;
                }
            },
            getText: () => TRANSLATIONS[currentLang].battleButton,
            onClick: () => {
                if (isOnlineSession && navigator.onLine) {
                    setScreen("battle"); 
                } else {
                    alert("Connection lost! Please reconnect and reload to play Team Battle");
                    this.showBattleButton = false;
                    isOnlineSession = false;
                }
            } 
        });

        let langBtnW = min(120, width * 0.15); 
        let langBtnH = 35;
        let padding = 15;
        let langGap = 10;

        this.engButton = new Button({
            x: width - langBtnW * 2 - langGap - padding, 
            y: padding, 
            w: langBtnW, 
            h: langBtnH,
            label: "English Toggle",
            style: {
                r: 8, onHoverMovement: 0.003, textColor: color(111),
                predraw: () => {
                    if (currentLang === 'english') {
                        titleScreen.engButton.style.mainColor = color(225,255,180);
                        titleScreen.engButton.style.shadeColor = theme.shadeColorCorrect;
                        titleScreen.engButton.style.hovering = true;
                    } else {
                        titleScreen.engButton.style.mainColor = color(255,255,255);
                        titleScreen.engButton.style.shadeColor = theme.shadeColor;
                        titleScreen.engButton.style.hovering = false;
                    }
                }
            },
            getText: () => flagEmojiFallback ? " English " : "English 🇺🇸",
            onClick: () => { changeLanguage('english'); }
        });

        this.chiButton = new Button({
            x: width - langBtnW - padding, 
            y: padding, 
            w: langBtnW, 
            h: langBtnH,
            label: "Chinese Toggle",
            style: {
                r: 8, onHoverMovement: 0.003, textColor: color(111),
                predraw: () => {
                    if (currentLang === 'chinese') {
                        titleScreen.chiButton.style.mainColor = color(225,255,180);
                        titleScreen.chiButton.style.shadeColor = theme.shadeColorCorrect;
                        titleScreen.chiButton.style.hovering = true;
                    } else {
                        titleScreen.chiButton.style.mainColor = color(255,255,255);
                        titleScreen.chiButton.style.shadeColor = theme.shadeColor;
                        titleScreen.chiButton.style.hovering = false;
                    }
                }
            },
            getText: () => flagEmojiFallback ? "   中文   " : "  中文 🇨🇳  ",
            onClick: () => { changeLanguage('chinese'); }
        });

        if (typeof channel !== 'undefined') {
            channel.send({ type: "broadcast", event: "ping_game_master", payload: {} });
        }
    }

    revealBattleButton() {
        this.showBattleButton = true;
    }

    draw() {
        background(255);

        this.drawBubbleBox();

        noStroke();
        fill(100,93,85,125);
        rect(-1,-1,width+2,height+2);
        
        this.drawBoxes();
        
        this.duelButton.draw();
        
        this.battleButton.style.transparent = !this.showBattleButton;
        this.battleButton.style.onHoverMovement = this.showBattleButton ? 0.0045 : 0;
        this.battleButton.draw();

        this.engButton.draw();
        this.chiButton.draw();

        noStroke();
        for(let y = 2; y>=-2; y-=2){
            for(let x = y/3-1; x<y/3+1.1; x+=1){
                fill(y<0 ? color(255,255,255) : color(100,93,85));
                textAlign(CENTER,CENTER);
                textSize(constrain(width*0.07,55,90));
                
                let mainTitle = currentLang === 'chinese' ? "24点000" : "Make 24";
                text(mainTitle, width*0.5+x, height*0.14+y);
                
                textSize(constrain(width*0.035,27,45));
                text(TRANSLATIONS[currentLang].randomSetSection,width*0.3+x, height*0.363+y*0.8);
                text(TRANSLATIONS[currentLang].designedSetSection,width*0.7+x, height*0.363+y*0.8);
                textAlign(RIGHT,BOTTOM);
                if (isOnlineSession) {
                    if (gameCount !== undefined) {
                        let s = constrain(width * 0.035, 27, 35);
                        textSize(s);
                        text(TRANSLATIONS[currentLang].gameCountUpperText, width - 15 + x, height - s - 15 + y * 0.8);
                        text(TRANSLATIONS[currentLang].gameCountLowerText, width - 15 + x, height - 15 + y * 0.8);
                        let w = textWidth(" games");
                        textSize(s * (gameCountDrawScale + 0.2));
                        text(gameCount, width - 15 - w + x, height - s - 15 + y * 0.8);
                    }
                } else {
                    let s = constrain(width * 0.035, 27, 35);
                    textSize(s);
                    text("📡❌", width - 15 + x, height - s - 15 + y * 0.8);
                    text("Offline mode", width - 15 + x, height - 15 + y * 0.8);
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
                b.drawOffset += height * (b.isClassic ? 0.007 : -0.007);
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
            let fontSize = min(currentLang === 'chinese' ? 30 : 24, b.h * 0.46);
            textSize(fontSize);
            let label = b.isClassic 
                ? TRANSLATIONS[currentLang].randomSets[b.setIndex] 
                : TRANSLATIONS[currentLang].designedSets[b.setIndex];

            let fallbackWidth = textWidth(label);
            let fallbackHeight = fontSize * 1.2;

            if (fallbackWidth <= maxWidth && fallbackHeight <= maxHeight) {
                text(label, b.x + b.w / 2, b.y + b.h / 2);
            } else {
                let lines = [];
                let currentLine = '';
                for (let char of label) {
                    let testLine = currentLine + char;
                    if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
                        lines.push(currentLine);
                        currentLine = char;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine.length > 0) lines.push(currentLine);

                const lineHeight = fontSize * 1.1;
                const startY = b.y + b.h / 2 - (lines.length - 1) * lineHeight / 2 + 3;

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
        
        const buttons = [this.duelButton, this.engButton, this.chiButton];
        if (this.showBattleButton) {
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