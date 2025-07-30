function inverseRotate(x,y,ang){
    let d = dist(0,0,x,y);
    let a = atan2(y,x)-ang;
    return {
        x:cos(a)*d,
        y:sin(a)*d
    }
}

class Duel {
    static SKIP_LOSER = false;
    static LOSER_WIN_ANIMATION = false;
    static WIN_TIMER_FREEZE = 3;

	constructor(numbers, opSymbols = Level.SYMBOLS, metaData = {}, scores = [0,0]) {
        this.levels = [];
        for(let i = 0; i<2; i++){
            this.levels.push(new Level(numbers,opSymbols,metaData,currentIsClassic));
        }
        
        this.scores = scores;
        this.solved = false;
        this.winAlphas = [0.0];

        this.reSetupLayout();
	}

    reSetupLayout(){
        if(width>=height){
            this.width = width;
            this.height = height;
            this.ang = 0;
        }
        else{
            this.width = height;
            this.height = width;
            this.ang = -PI/2;
        }

        for(let i = 0; i<2; i++){
            let l = this.levels[i];
            l.reSetupLayout(this.height,this.width/2);
            l.hintButton.draw = function(w){};
            l.hintButton.onClick = function(){};
            l.solutionButton.draw = function(w){};
            l.solutionButton.onClick = function(){};
            l.homeButton.draw = function(w){};
            l.homeButton.onClick = function(){};
            l.skipButton.draw = function(w){};
            l.skipButton.onClick = function(){};
            
            this.homeButton = new Button({
                x: this.width * 0.45, y: this.height * 0.4, w: this.width * 0.1, h: this.height * 0.1,
                label: "Home",
                style: {
                    r: 10,
                    onHoverMovement: -0.004,
                    transparentOnWin: true
                },
                getText: () => "Home",
                onClick: () => {
                    if((!Duel.SKIP_LOSER)||this.levels[0].winTimer===0&&this.levels[1].winTimer===0){
                        setScreen("title");
                    }
                    else{
                        this.homeButton.drawAngle -= 0.16;
                    }
                }
            });
            this.skipButton = new Button({
                x: this.width * 0.45, y: this.height * 0.5, w: this.width * 0.1, h: this.height * 0.1,
                label: "Skip",
                style: {
                    r: 10,
                    onHoverMovement: 0.004,
                    transparentOnWin: true,
                },
                getText: () => "Skip",
                onClick: () => {
                    if((!Duel.SKIP_LOSER)||this.levels[0].winTimer===0&&this.levels[1].winTimer===0){
                        this.solved = true;
                    }
                    else{
                        this.skipButton.drawAngle -= 0.16;
                    }
                }
            });
        }
    }
    draw(){
        push();
        if(this.ang===-PI/2){
            translate(0,this.width);
            rotate(this.ang);
        }

        let trueMx = mx;
        let trueMy = my;

        // let sf = min(this.height/this.width,this.width/2/this.height); // should ideally be between 0.5 and 1
        // console.log(sf);

        background(theme.backgroundColor);
        
        for(let i = 0; i<2; i++){
            if((!Duel.SKIP_LOSER)&&this.isSolved(i)&&this.levels[i].winTimer<=Duel.WIN_TIMER_FREEZE){
                this.levels[i].winTimer = Duel.WIN_TIMER_FREEZE;
            }
            push();
            noStroke();
            if(i===0){
                translate(this.width/2,0);
                rotate(PI/2);
            }
            else{
                translate(this.width/2,this.height);
                rotate(-PI/2);
            }
            let it = this.inverseTransform(trueMx,trueMy,i);
            mx = it.x;
            my = it.y;
            if(this.levels[i].winTimer>0){ // since this is before draw() this won't apply on the first frame of win
                fill(theme.backgroundColorCorrect);
                rect(0,0,this.height,this.width/2);
            }
            this.levels[i].draw(false);

            let scoreLoc = this.levels[i].solutionButton;
            textAlign(CENTER,CENTER);
            textSize(this.height * 0.045);
            fill(0);
            text(this.scores[i]+" point"+(this.scores[i]===1 ? "" : "s"),scoreLoc.x,scoreLoc.y+scoreLoc.h/2);
            // fill(255,0,0);ellipse(mx,my,200,200);
            pop();
        }
        fill(100,93,85,30);
        noStroke();
        rect(this.width*0.49,0,this.width*0.02,this.height);

        let iot = this.inverseOuterTransform(trueMx, trueMy);
        mx = iot.x;
        my = iot.y;

        this.homeButton.draw();
        this.skipButton.draw();

        mx = trueMx;
        my = trueMy;
        pop();

        if(Duel.SKIP_LOSER){
            for(let i = 0; i<2; i++){ // this will actually award both a point if there is a frame perfect tie
                if(this.levels[i].solved){
                    this.solved = true;
                    this.scores[i]++;
                }
            }
        }
        else{
            if(this.isJustSolved(0)&&this.isJustSolved(1)){ // frame perfect tie
                this.scores[0]++;
                this.scores[1]++;
                this.solved = true;
            }
            else{
                for(let i = 0; i<2; i++){
                    if(this.isJustSolved(i)){
                        if(this.isSolved(1-i)){
                            if(!Duel.LOSER_WIN_ANIMATION){
                                this.solved = true;
                            }
                        }
                        else{
                            this.scores[i]++;
                        }
                    }
                }
            }
            if(Duel.LOSER_WIN_ANIMATION){
                if(this.isSolved(0)&&this.isSolved(1)&&this.levels[0].winTimer<=Duel.WIN_TIMER_FREEZE&&this.levels[1].winTimer<=Duel.WIN_TIMER_FREEZE){
                    this.solved = true;
                }
            }
        }
    }
    handleClick(mx,my){
        let iot = this.inverseOuterTransform(mx,my);
        {
            let i = (iot.x>this.width/2)+0;
            let it = this.inverseTransform(mx,my,i);
            this.levels[i].handleClick(it.x,it.y);
        }
        
        const buttons = [this.homeButton, this.skipButton];
		for(const btn of buttons) {
			if(btn.contains(iot.x, iot.y)) {
				btn.drawScale -= 0.08;
				btn.onClick();
				return;
			}
		}
    }
    inverseOuterTransform(x, y) {
        return inverseRotate(x,this.ang===-PI/2 ? y-this.width : y,this.ang);
    }
    inverseTransform(x, y, i) {
        let iot = this.inverseOuterTransform(x,y);
        x = iot.x;
        y = iot.y;
        if (i === 0) {
            let tx = x - this.width / 2;
            let ty = y;
            return inverseRotate(tx, ty, PI / 2);
        } else {
            let tx = x - this.width / 2;
            let ty = y - this.height;
            return inverseRotate(tx, ty, -PI / 2);
        }
    }
    isJustSolved(i){
        if(this.levels===undefined||i>=this.levels.length){
            return false;
        }
        // if(Level.WIN_TIMER_START>1){
            return this.levels[i].winTimer === Level.WIN_TIMER_START-1;
        // }
        // else{
        //     return this.levels[i].solved; // scuffed
        // }
    }
    isSolved(i){
        return this.levels[i].solved||this.levels[i].winTimer>0;
    }
}