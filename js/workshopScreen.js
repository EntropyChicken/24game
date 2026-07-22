// top left: workbench ui for editing
// bottom left: workbench level, playable
// right: list of created levels

class WorkshopScreen {
	constructor() {
        this.mode = "working"; // "working" to create the level, and "playing" to play the level in fullscreen

        this.workbench = {
            // same format as the designed puzzle JSONs
            cards:[1,2],
            ops:["+","-","×","÷"],
            hint:{english:""}, // only hint.english will exist and be used as default (no language-specific hints)
            sols:[], // only sols[0] will exist and be used (no alternative solutions listed)
        };

        this.backgroundColor = color(222,180,200);
        this.updateShadeColor();

        // let split = width > 450 ? 0.65 : 0.45;
        let split = 0.65;
        this.workbenchWidth = width; // should be width, actually. it'll take up the full upper part of screen
        this.workbenchHeight = height*(1-split);
        this.workbenchLevelHeight = height*split;
        this.workbenchLevelWidth = width*split;
        this.padding = 15;

        this.numberInput = createInput('');
        this.numberInput.attribute('placeholder', TRANSLATIONS[currentLang].workshopScreen.numberInput);
        this.numberInput.style('font-size', '20px');
        this.numberInput.style('padding', '10px');
        this.numberInput.style('border-radius', '8px');
        this.numberInput.style('border', '2px solid #323232');
        this.numberInput.style('text-align', 'center');
        this.numberInput.style('box-sizing', 'border-box');
        this.numberInput.style('font-family', 'Arial, sans-serif');

        this.numberInput.position(this.padding, this.padding);
        this.numberInput.size(this.workbenchWidth-2*this.padding,40);
        this.numberInput.elt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                workshopScreen.createCard(this.numberInput.value());
                teamInput.elt.blur();
            }
        });
        this.numberInput.hide();

        // same size/position formula as Level's homeButton
		this.numberDeleteButton = new Button({
			x: this.padding, y: this.numberInput.y+this.numberInput.height, w: max(70, this.workbenchWidth * 0.2), h: this.workbenchHeight * 0.15,
			label: "Number Delete Button",
			style: {r: 10, onHoverMovement: 0.003},
			getText: () => TRANSLATIONS[currentLang].workshopScreen.numberDeleteButton,
			onClick: () => {
                workshopScreen.workbench.cards.pop();
                workshopScreen.generateWorkbenchLevel(true);
            }
		});
        this.operationToggleButtons = [];
        { // generate operation toggles
            let x = this.padding;
            let y = this.numberDeleteButton.y+this.numberDeleteButton.h+this.padding;
            let w = (width > 600 ? 55 : 43);
            let h = (width > 600 ? 35 : 32);
            for(let s of Sequence.SYMBOLS){
                let i = this.operationToggleButtons.length;
                this.operationToggleButtons.push(new Button({
                    x:x,y:y,w:w,h:h,
                    label: s+" Toggle Button",
                    style: {
                        r: 10,
                        onHoverMovement: -0.003
                    },
                    getText: () => s,
                    onClick: () => {
                        for(let j = 0; j<workshopScreen.workbench.ops.length; j++){
                            if(workshopScreen.workbench.ops[j] === s){
                                workshopScreen.operationToggleButtons[i].style.mainColor = color(255,255,255);
                                workshopScreen.operationToggleButtons[i].style.shadeColor = theme.shadeColor;
                                workshopScreen.operationToggleButtons[i].style.hovering = false;
                                workshopScreen.workbench.ops.splice(j,1);
                                workshopScreen.generateWorkbenchLevel(true);
                                return;
                            }
                        }
                        workshopScreen.workbench.ops.push(s);
                        workshopScreen.operationToggleButtons[i].style.mainColor = theme.selectedColor;
                        workshopScreen.operationToggleButtons[i].style.shadeColor = theme.shadeColorCorrect;
                        workshopScreen.operationToggleButtons[i].style.hovering = true;
                        workshopScreen.generateWorkbenchLevel(true);
                    }
                }));
                x += w;
                if(x+w>=this.workbenchWidth){
                    x = this.padding;
                    y += h;
                }
            }
        }

        this.workbenchLevel = null; // Level
        this.workbenchSolver = null; // Solver
        this.updateOperationToggleButtonStyles(true); // calls this.generateWorkbenchLevel(true);
	}
    updateOperationToggleButtonStyles(clearHintAndSolution = false) {
        for(let btn of this.operationToggleButtons){
            let s = btn.getText();
            // off by default
            btn.style.mainColor = color(255,255,255); 
            btn.style.shadeColor = theme.shadeColor;
            btn.style.hovering = false;
            for(let j = 0; j<this.workbench.ops.length; j++){
                if(this.workbench.ops[j] === s){
                    // is on
                    btn.style.mainColor = theme.selectedColor;
                    btn.style.shadeColor = theme.shadeColorCorrect;
                    btn.style.hovering = true;
                    break;
                }
            }
        }
        this.generateWorkbenchLevel(clearHintAndSolution);
    }
    draw() {
        this.updateShadeColor();

        if(this.workbenchLevel.solved){
            if(this.mode === "working"){
                // if it's an empty puzzle then don't move on (probably started with just 24 or pressed skip or something)
                if(this.workbenchLevel.watcherSequence.actions.length){
                    this.workbench.sols = [this.workbenchLevel.watcherSequence.toExpr()];
                    let finalAction = this.workbenchLevel.watcherSequence.actions[this.workbenchLevel.watcherSequence.actions.length-1];
                    let h = finalAction.s;
                    if(finalAction.a!==undefined){
                        h = finalAction.a.getText(false) + h;
                    }
                    if(finalAction.b!==undefined){
                        h += finalAction.b.getText(false);
                    }
                    h += "=24";
                    this.workbench.hint = {
                        english: "A possible final step is "+h
                    }
                    this.mode = "playing";
                }
            }
            else{
                this.mode = "working";
            }
            this.generateWorkbenchLevel();
        }

        if(this.mode === "playing"){
            this.numberInput.hide();
            background(this.backgroundColor);
            this.workbenchLevel.draw(false);
        }
        else{
            background(lerpColor(color(0),color(210,225,250),0.3)); // color of designed puzzle modes
            
            this.numberInput.show();
            this.numberDeleteButton.draw();
            for(let btn of this.operationToggleButtons){
                btn.draw();
            }

            fill(this.backgroundColor);
            noStroke();
            rect(0,this.workbenchHeight,this.workbenchLevelWidth,this.workbenchLevelHeight,20);
            push();
            translate(0,this.workbenchHeight);
            scale(this.workbenchLevelWidth/width,this.workbenchLevelHeight/height);
            let trueMx = mx; // sus trick, temoprarily making mx fake so that it works for the transformed Level
            let trueMy = my;
            mx = map(mx,0,this.workbenchLevelWidth,0,width);
            my = map(my,this.workbenchHeight,height,0,height);
            this.workbenchLevel.draw(false);
            mx = trueMx;
            my = trueMy;
            pop();

            fill(255);
            textAlign(LEFT,TOP);
            textSize(constrain(width*0.05,15,30));
            text("solve your puzzle to verify that it is possible",this.workbenchLevelWidth+this.padding,this.workbenchHeight+this.padding,width-this.workbenchLevelWidth-2*this.padding);
        }
    }

    updateShadeColor() {
        theme.shadeColor = lerpColor(color(255),lerpColor(color(0),this.backgroundColor,1.4),0.6);
    }
    generateWorkbenchLevel(clearHintAndSolution = false) {
        if(clearHintAndSolution){
            this.workbench.sols = [];
            this.workbench.hint = {};
        }
        this.workbenchLevel = new Level(this.workbench.cards,this.workbench.ops,this.workbench,false);
        Level.setupKeyboard(this.workbenchLevel);
        this.workbenchSolver = new Solver(this.workbenchLevel.values,this.workbenchLevel.opSymbols);
    }
    createCard(value) { // create card. the argument should be value === this.numberInput.value()
        this.workbench.cards.push(+value);
        this.generateWorkbenchLevel();
    }
    handleClick(mx, my) {
        if(this.mode === "working"){ // do transform
            this.workbenchLevel.handleClick(map(mx,0,this.workbenchLevelWidth,0,width), map(my,this.workbenchHeight,height,0,height));
            const buttons = this.operationToggleButtons.concat([this.numberDeleteButton]);
            for(const btn of buttons) {
                if(btn.contains(mx, my)) {
                    btn.drawScale -= 0.08;
                    btn.onClick();
                    return;
                }
            }
        }
        else{
            this.workbenchLevel.handleClick(mx,my);
        }
    }
    hide() {
        this.numberInput.hide();
    }
    show() {
        this.numberInput.show();
    }
}