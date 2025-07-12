class Bubble {
    static PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
    static SPLITTING_TIME = 150;
    constructor(x,y,vel,value,forcedPosition=false,naturalSpeed=Bubble.speed){
        this.x = x;
        this.y = y;
        this.value = value;
        this.naturalSpeed = naturalSpeed;
        if(vel===undefined){
            this.vel = this.angToNaturalVel(random(0,2*PI));
        }
        else{
            this.vel = {x:vel.x,y:vel.y};
        }
        this.splittingTimer = 0;
        this.spawnTimer = random(30,60); //+(40*this.value===24);

        
        let possibleOps;
        if(this.value===24){
            possibleOps = ["-", "×", "÷", "÷"];
        }
        else if(Bubble.PRIMES.includes(this.value)){
            possibleOps = ["+"];
        }
        else{
            possibleOps = ["+", "×", "×", "×"];
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
        this.textXs = [];
        let leftX = -0.5*this.textWidths.reduce((sum,cur)=>sum+cur,0);
        for(let i = 0; i<5; i++){
            this.textXs.push(leftX+this.textWidths[i]/2);
            leftX+=this.textWidths[i];
        }
        if(!forcedPosition){
            this.x -= this.textXs[0];
        }
    }

    physics(){
        this.x += this.vel.x;
        this.y += this.vel.y;
        let d = dist(0,0,this.vel.x,this.vel.y);
        let weight = (d>this.naturalSpeed ? 5 : 11);
        let speed = (this.naturalSpeed+weight*dist(0,0,this.vel.x,this.vel.y))/(weight+1); // speed decays to regulation
        let factor = speed/d;
        this.vel.x *= factor;
        this.vel.y *= factor;
    }
    nature(bubbles){
        if(this.spawnTimer>0){
            this.spawnTimer--;
        }
        else if(this.splittingTimer>0){
            this.splittingTimer--;
            if(this.splittingTimer===0){
                this.endSplit(bubbles);
            }
        }
        else{
            if(this.value>3){
                this.startSplit();
            }
        }
    }
    draw(){
        // fill(255,0,0,40);
        // ellipse(this.x,this.y,Bubble.rad*2,Bubble.rad*2);

        textSize(Bubble.rad/2);
        noStroke();
        textAlign(CENTER,CENTER);
        if(this.splittingTimer>0&&this.splittingTimer*2<=Bubble.SPLITTING_TIME){
            fill(0,255*this.splittingTimer*2/Bubble.SPLITTING_TIME);
        }
        else{
            fill(0);
        }
        text(this.value,this.x+this.textXs[0],this.y);
        if(this.splittingTimer>0){
            let mag = pow(sin(PI*(this.splittingTimer/Bubble.SPLITTING_TIME)),0.75);
            fill(0,255*mag);
            text("=",this.x+this.textXs[1],this.y);
            text(this.partsOp,this.x+this.textXs[3],this.y);
            if(this.splittingTimer*2<=Bubble.SPLITTING_TIME){
                fill(0);
            }
            text(this.parts[0],this.x+this.textXs[2],this.y);
            text(this.parts[1],this.x+this.textXs[4],this.y);
        }

        // noFill();
        // stroke(255,0,0);
        // ellipse(this.visualX(),this.y,this.visualRad()*2,this.visualRad()*2);
    }
    startSplit(){
        this.splittingTimer = Bubble.SPLITTING_TIME;
    }
    endSplit(bubbles){
        // these will process once in the same frame, which is necessary (otherwise there's a white flash at timer zero)
        bubbles.push(new Bubble(this.x+this.textXs[2],this.y,this.vel,this.parts[0],false,this.naturalSpeed));
        bubbles.push(new Bubble(this.x+this.textXs[4],this.y,this.vel,this.parts[1],false,this.naturalSpeed));
        this.shouldDelete = true;
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
                a = floor(random(2,this.value-1)); // works for 1 or higher, funnily enough
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

    visualX(){
        let mag = 0;
        if(this.splittingTimer>0){
            mag = constrain(map(this.splittingTimer,Bubble.SPLITTING_TIME,Bubble.SPLITTING_TIME/2,0,1),0,1);
        }
        let ret = map(mag,0,1,this.x+this.textXs[0],this.x);
        return ret;
    }
    visualRad(){
        let rad = Bubble.rad*2.3;
        if(this.splittingTimer>0){
            rad = Bubble.rad*(2.3+min(0.9,(1-this.splittingTimer/Bubble.SPLITTING_TIME)));
        }
        return rad;
    }
    avoid(bubbles){
        const thisRad = this.visualRad();
        for(let b of bubbles){
            const bRad = b.visualRad();
            if(this===b){
                continue;
            }
            let d = dist(this.visualX(),this.y*1.5,b.visualX(),b.y*1.5); // Y IS STRETCHED TO BE LESS SIGNIFICANT
            if(d<=(thisRad+bRad)/2){
                let mag = pow(1-d/((thisRad+bRad)/2),1.3)*-0.18;
                let avoidance = this.angToNaturalVel(atan2(b.y-this.y,b.x-this.x));
                this.vel.x+=mag*avoidance.x;
                this.vel.y+=mag*avoidance.y;
            }
        }
    }

    angToNaturalVel(ang){
        return {x:cos(ang)*this.naturalSpeed,y:sin(ang)*this.naturalSpeed};
    }

    static get rad(){
        return sqrt(width*height)*0.065;
    }
    static get speed(){
        return dist(0,0,width,height)*0.001;
    }
}