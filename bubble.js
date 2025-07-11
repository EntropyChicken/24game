class Bubble {
    constructor(x,y,velAng,value,forcedPosition){
        this.x = x;
        this.y = y;
        if(velAng===undefined){
            this.velAng = random(0,2*PI);
        }
        else{
            this.velAng = velAng;
        }
        this.value = value;
        this.splittingTimer = 0;
        
        let possibleOps;
        if(this.value===24){
            possibleOps = ["+", "-", "×", "÷"];
        }
        else{
            possibleOps = ["+", "×", "×"];
        }
        this.partsOp = possibleOps[floor(random(0,possibleOps.length))];
        this.parts = this.generateParts(this.partsOp);

        textSize(Bubble.rad/2);
        this.textWidths = [
            textWidth(this.value),
            textWidth("="),
            textWidth(this.parts[0]),
            textWidth(this.partsOp),
            textWidth(this.parts[1])
        ];
        this.textXs = []
        let leftX = -0.5*this.textWidths.reduce((sum,cur)=>sum+cur,0);
        for(let i = 0; i<5; i++){
            this.textXs.push(leftX+this.textWidths[i]/2);
            leftX+=this.textWidths[i];
        }
        if(!forcedPosition){
            this.x -= this.textXs[0];
        }
    }

    process(bubbles){
        this.x += cos(this.velAng) * Bubble.speed;
        this.y += sin(this.velAng) * Bubble.speed;
        if(this.splittingTimer>0){
            this.splittingTimer--;
            if(this.splittingTimer===0){
                this.endSplit(bubbles);
            }
        }
        else{
            if(this.value>=4&&random(0,400)<1){
                this.startSplit();
            }
        }
        this.draw();
    }
    draw(){
        // noFill();
        // strokeWeight(3);
        // stroke(100,93,85);

        // fill(255,0,0,40);

        // ellipse(this.x,this.y,Bubble.rad*2,Bubble.rad*2);

        textSize(Bubble.rad/2);
        fill(0);
        noStroke();
        textAlign(CENTER,CENTER);
        text(this.value,this.x+this.textXs[0],this.y);
        if(this.splittingTimer>0){
            text("=",this.x+this.textXs[1],this.y);
            text(this.parts[0],this.x+this.textXs[2],this.y);
            text(this.partsOp,this.x+this.textXs[3],this.y);
            text(this.parts[1],this.x+this.textXs[4],this.y);
        }
    }
    startSplit(){
        this.splittingTimer = 90;
    }
    endSplit(bubbles){
        // these will process once in the same frame, which is necessary (otherwise there's a white flash at timer zero)
        bubbles.push(new Bubble(this.x+this.textXs[2],this.y,this.velAng+random(-PI/5,PI/5),this.parts[0],false));
        bubbles.push(new Bubble(this.x+this.textXs[4],this.y,this.velAng+random(-PI/5,PI/5),this.parts[1],false));
        this.x=-Infinity;
        this.y=-Infinity;
    }

    generateFactor(maxTries=300){
        if(sqrt(this.value)<maxTries){
            let cands = [];
            for(let i = 2; i*i<=this.value; i++){
                cands.push(i);
            }
            cands = shuffle(cands);
            for(let cand of cands){
                if(this.value%cand===0){
                    return cand;
                }
            }
        }
        else{
            for(let tries = 0; tries<maxTries; tries++){
                let cand = ceil(random(1,sqrt(this.value)));
                if(this.value%cand===0){
                    return cand;
                }
            }
        }
        return 1;
    }
    generateParts(opType,maxTries=300){
        let a;
        switch(opType){
            case "+":
                a = floor(random(1,this.value));
                return [this.value-a,a];
            case "-":
                const cands = [1, 3, 6, 8, 12, 16, 25];
                a = cands[floor(random(0,cands.length))];
                return [this.value+a,a];
            case "×":
                a = this.generateFactor(maxTries);
                return [this.value/a,a];
            case "÷":
                a = floor(random(1,3.6));
                return [this.value*a,a];
        }
    }

    // DON'T USE IN THE MIDDLE OF FOR LOOP (preferably trigger external splicing)
    splice(bubbles){
        let index = bubbles.indexOf(this);
        if(index===-1){
            console.log("Bubble not in bubbles parameter for splice");
        }
        else{
            bubbles.splice(index,1);
        }
    }
    spliceOutsideBox(bubbles,x,y,w,h){
        if(this.x>x+w+Bubble.rad||this.x<x-Bubble.rad||this.y>y+h+Bubble.rad||this.y<y-Bubble.rad){
            this.splice(bubbles);
        }
    }
    

    static spawnBubbleInBox(bubbles,x,y,w,h,value=24){
        let sx, sy;
        if(random()<0.5){
            sx = random()<0.5 ? x-Bubble.rad : x+w+Bubble.rad;
            sy = random(y,y+h);
        }
        else{
            sy = random()<0.5 ? y-Bubble.rad : y+h+Bubble.rad;
            sx = random(x,x+w);
        }
        let ang = atan2(y+h/2-sy,x+w/2-sx) + random(-PI/5,PI/5);
        bubbles.push(new Bubble(sx,sy,ang,value,true));
    }
    static get rad(){
        return min(width,height)*0.07;
    }
    static get speed(){
        return dist(0,0,width,height)*0.0007;
    }
}