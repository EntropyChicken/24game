// top left: workbench ui for editing
// bottom left: workbench level, playable
// right: list of created levels

class WorkshopScreen {
	constructor() {
        // let split = width > 450 ? 0.65 : 0.45;
        let split = 0.5;
        this.workbenchWidth = width*split;
        this.workbenchHeight = height*(1-split);
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

        // same size/position formula as Level's homeButton
		this.numberDeleteButton = new Button({
			x: this.padding, y: this.numberInput.y+this.numberInput.height, w: max(50, this.workbenchWidth * 0.15), h: this.workbenchHeight * 0.2,
			label: "Number Delete Button",
			style: {r: 10, onHoverMovement: 0.003},
			getText: () => TRANSLATIONS[currentLang].workshopScreen.numberDeleteButton,
			onClick: () => {
                workshopScreen.workbench.cards.pop();
                workshopScreen.generateWorkbenchLevel();
            }
		});
        this.operationToggleButtons = [];
        { // generate operation toggles
            let x = this.padding;
            let y = this.numberDeleteButton.y+this.numberDeleteButton.h+this.padding;
            let w = 45;
            let h = 35;
            for(let s of Sequence.SYMBOLS){
                this.operationToggleButtons.push(new Button({
                    x:x,y:y,w:w,h:h,
                    label: s+"Toggle Button",
                    style: {r: 10, onHoverMovement: -0.003},
                    getText: () => s,
                    onClick: () => {
                        let has = false;
                        for(let i = 0; i<workshopScreen.workbench.ops.length; i++){
                            if(workshopScreen.workbench.ops[i] === s){
                                has = true;
                                workshopScreen.workbench.ops.splice(i,1);
                                break;
                            }
                        }
                        if(!has){
                            workshopScreen.workbench.ops.push(s);
                        }
                        workshopScreen.generateWorkbenchLevel();
                    }
                }));
                x += w;
                if(x+w>=this.workbenchWidth){
                    x = this.padding;
                    y += h;
                }
            }
        }



        // there should also be a grid of checkboxes for every possible symbol in Sequence.SYMBOLS

        this.workbench = {
            // same format as the designed puzzle JSONs
            cards:[1,2,3],
            ops:["+","-"],
            hint:{
                universal:""
            }, // only hint.universal will exist and be used (no language-specific hints)
            sols:[], // only sols[0] will exist and be used (no alternative solutions listed)
        };
        this.workbenchLevel = null;
        this.generateWorkbenchLevel();
	}
    drawWorkbench() {

    }
    drawList() {

    }
    draw() {
        // background(210,225,250); // color of designed puzzle modes
        background(0);
        
        this.numberDeleteButton.draw();
        for(let btn of this.operationToggleButtons){
            btn.draw();
        }

        push();
        translate(0,this.workbenchHeight);
        scale(this.workbenchWidth/width,(height-this.workbenchHeight)/height);
        let trueMx = mx; // sus trick, temoprarily making mx fake so that it works for the transformed Level
        let trueMy = my;
        mx = map(mx,0,this.workbenchWidth,0,width);
        my = map(my,this.workbenchHeight,height,0,height);
        this.workbenchLevel.draw(false);
        mx = trueMx;
        my = trueMy;
        pop();
    }

    generateWorkbenchLevel() {
        this.workbenchLevel = new Level(this.workbench.cards,this.workbench.ops,this.workbench,false);
    }
    createCard(value) { // create card. the argument should be value === this.numberInput.value()
        this.workbench.cards.push(+value);
        this.generateWorkbenchLevel();
    }
    handleClick(mx, my) {
        this.workbenchLevel.handleClick(map(mx,0,this.workbenchWidth,0,width), map(my,this.workbenchHeight,height,0,height));
        
        const buttons = this.operationToggleButtons.concat([this.numberDeleteButton]);
        for(const btn of buttons) {
            if(btn.contains(mx, my)) {
                btn.drawScale -= 0.08;
                btn.onClick();
                return;
            }
        }
    }
    hide() {
        this.numberInput.hide();
    }
    show() {
        this.numberInput.show();
    }
}