function inverseRotate(x,y,ang){
    let d = dist(0,0,x,y);
    let a = atan2(y,x)-ang;
    return {
        x:cos(a)*d,
        y:sin(a)*d
    }
}function inverseTransform(x, y, i) {
	if (i === 0) {
		// Undo: translate(width/2, 0) + rotate(PI/2)
		// First undo translate, then rotate -PI/2
		let tx = x - width / 2;
		let ty = y;
		return inverseRotate(tx, ty, PI / 2);
	} else {
		// Undo: translate(width/2, height) + rotate(-PI/2)
		let tx = x - width / 2;
		let ty = y - height;
		return inverseRotate(tx, ty, -PI / 2);
	}
}


class Duel {
	constructor(numbers, opSymbols = Level.SYMBOLS, metaData = {}, scores = [0,0]) {
        this.levels = [];
        for(let i = 0; i<2; i++){
            this.levels.push(new Level(numbers,opSymbols,metaData));
        }
        
        this.scores = scores;
        this.solved = false;
        this.winAlphas = [0.0];

        this.setupLayout();
	}

    setupLayout(){
        for(let i = 0; i<2; i++){
            let l = this.levels[i];
            l.setupLayout(height,width/2);
            l.hintButton.draw = function(w){};
            l.hintButton.onClick = function(){};
            l.solutionButton.draw = function(w){};
            l.solutionButton.onClick = function(){};
            l.homeButton.draw = function(w){};
            l.homeButton.onClick = function(){};
            l.skipButton.draw = function(w){};
            l.skipButton.onClick = function(){};
            
            this.homeButton = new Button({
                x: width * 0.45, y: height * 0.4, w: width * 0.1, h: height * 0.1,
                label: "Home",
                style: {
                    r: 10,
                    onHoverMovement: -0.004,
                    transparentOnWin: true
                },
                getText: () => "Home",
                onClick: () => { setScreen("title"); }
            });
            this.skipButton = new Button({
                x: width * 0.45, y: height * 0.5, w: width * 0.1, h: height * 0.1,
                label: "Skip",
                style: {
                    r: 10,
                    onHoverMovement: 0.004,
                    transparentOnWin: true,
                },
                getText: () => "Skip",
                onClick: () => { this.solved = true; }
            });
        }
    }
    draw(){
        let trueMx = mx;
        let trueMy = my;

        // let sf = min(height/width,width/2/height); // should ideally be between 0.5 and 1
        // console.log(sf);

        background(theme.backgroundColor);
        
        for(let i = 0; i<2; i++){
            push();
            noStroke();
            if(i===0){
                translate(width/2,0);
                rotate(PI/2);
            }
            else{
                translate(width/2,height);
                rotate(-PI/2);
            }
            let it = inverseTransform(trueMx,trueMy,i);
            mx = it.x;
            my = it.y;
            if(this.levels[i].winTimer>0){
                fill(theme.backgroundColorCorrect);
                rect(0,0,height,width/2);
            }
            this.levels[i].draw(false);

            let scoreLoc = this.levels[i].solutionButton;
            textAlign(CENTER,CENTER);
            textSize(height * 0.045);
            fill(0);
            text(this.scores[i]+" point"+(this.scores[i]===1 ? "" : "s"),scoreLoc.x,scoreLoc.y+scoreLoc.h/2);
            // fill(255,0,0);ellipse(mx,my,200,200);
            pop();
        }

        mx = trueMx;
        my = trueMy;

        this.homeButton.draw();
        this.skipButton.draw();

        for(let i = 0; i<2; i++){ // this will actually award both a point if there is a frame perfect tie
            if(this.levels[i].solved){
                this.solved = true;
                this.scores[i]++;
            }
        }
    }
    handleClick(x,y){
        for(let i = 0; i<2; i++){
            let it = inverseTransform(mx,my,i);
            this.levels[i].handleClick(it.x,it.y);
        }
        const buttons = [this.homeButton, this.skipButton];
		for(const btn of buttons) {
			if(btn.contains(mx, my)) {
				btn.drawScale -= 0.08;
				btn.onClick();
				return;
			}
		}
    }
}