function inverseRotate(x,y,ang){
    let d = dist(0,0,x,y);
    let a = atan2(y,x)-ang;
    return {
        x:cos(a)*d,
        y:sin(a)*d
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
            l.setupLayout(this.height,this.width/2);
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
                onClick: () => { setScreen("title"); }
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
                onClick: () => { this.solved = true; }
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
            if(this.levels[i].winTimer>0){
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

        let iot = this.inverseOuterTransform(trueMx, trueMy);
        mx = iot.x;
        my = iot.y;

        this.homeButton.draw();
        this.skipButton.draw();

        mx = trueMx;
        my = trueMy;

        for(let i = 0; i<2; i++){ // this will actually award both a point if there is a frame perfect tie
            if(this.levels[i].solved){
                this.solved = true;
                this.scores[i]++;
            }
        }
        pop();
    }
    handleClick(mx,my){
        for(let i = 0; i<2; i++){
            let it = this.inverseTransform(mx,my,i);
            this.levels[i].handleClick(it.x,it.y);
        }
        
        let iot = this.inverseOuterTransform(mx,my);
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
}