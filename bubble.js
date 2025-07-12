// future idea: make bubbles avoid each other by modifying angle, not vector, of movement (cross product needed?)

function textAlpha(txt,x,y,alph){
    textSize(Bubble.rad*0.5);
    if(txt===24||txt==="24"){
        // textSize(Bubble.rad*0.6);
        alph = alph+255*0.2*sin(PI*alph/255); // more alpha
        fill(lerpColor(color(255,255,255),color(100,185,70),alph/255));
        text(txt,x,y+1);
        text(txt,x,y);
    }
    else{
        // textSize(Bubble.rad*0.45);
        fill(lerpColor(color(255,255,255),color(120,120,120),alph/255));
        text(txt,x,y);
    }
}
function signOfCloserOrtho(a, b) {
    // sees if the angle between a and b-PI/2 is larger than a and b+PI/2 (returns the sign of the operator)
	const normalizeAngleDiff = (theta1, theta2) =>
		Math.atan2(Math.sin(theta1 - theta2), Math.cos(theta1 - theta2));

	const diff1 = Math.abs(normalizeAngleDiff(a, b - Math.PI / 2));
	const diff2 = Math.abs(normalizeAngleDiff(a, b + Math.PI / 2));

	return (diff1 > diff2 ? -1 : 1);
}


class Bubble {
    static PRIMES = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97];
    static SPLITTING_TIME = 130;
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
        this.spawnTimer = random(40,60) + (50*this.value===24);

        this.setupParts();
        this.setupTextXs();

        if(!forcedPosition){
            this.x -= this.textXs[0];
        }
    }

    setupParts(){
        if(this.value>3){
            let possibleOps;
            if(this.value===24){
                possibleOps = ["-", "×", "×", "÷"];
            }
            else if(Bubble.PRIMES.includes(this.value)){
                possibleOps = ["+"];
            }
            else{
                possibleOps = ["-", "+", "×", "×", "×"];
            }
            this.partsOp = possibleOps[floor(random(0,possibleOps.length))];
            this.parts = this.generateParts(this.partsOp);
        }
        else{
            if(random()<0.65){
                this.partsOp = "÷";
                this.parts = [24,24/this.value];
            }
            else{
                this.partsOp = "-";
                if(this.value===2){
                    this.parts = [24,24-this.value];
                }
                else{
                    this.parts = [24+this.value,24];
                }
            }
        }
    }
    setupTextXs(){
        textSize(Bubble.rad/2);
        this.textWidths = [
            textWidth(this.value),
            textWidth("=")*1.2,
            textWidth(this.parts[0]),
            textWidth(this.partsOp)*1.2,
            textWidth(this.parts[1])
        ];
        this.textXs = [];
        let leftX = -0.5*this.textWidths.reduce((sum,cur)=>sum+cur,0);
        for(let i = 0; i<5; i++){
            this.textXs.push(leftX+this.textWidths[i]/2);
            leftX+=this.textWidths[i];
        }
    }

    physics(){
        this.x += this.vel.x;
        this.y += this.vel.y;
        let d = dist(0,0,this.vel.x,this.vel.y);
        let weight = (d>this.naturalSpeed ? 2 : 5);
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
            if(this.value>=4||random(0,250)<1){
                this.startSplit();
            }
        }
    }
    draw(){
        // fill(255,0,0,30);
        // ellipse(this.visualX(),this.y,Bubble.rad,Bubble.rad);

        noStroke();
        textAlign(CENTER,CENTER);
        let alph = 255;
        if(this.splittingTimer>0&&this.splittingTimer*2<=Bubble.SPLITTING_TIME){
            alph = 255*this.splittingTimer*2/Bubble.SPLITTING_TIME;
        }
        textAlpha(this.value,this.x+this.textXs[0],this.y,alph);
        if(this.splittingTimer>0){
            let mag = pow(sin(PI*(this.splittingTimer/Bubble.SPLITTING_TIME)),0.85);
            alph = 255*mag;
            textAlpha("=",this.x+this.textXs[1],this.y,alph);
            textAlpha(this.partsOp,this.x+this.textXs[3],this.y,alph);
            if(this.splittingTimer*2<=Bubble.SPLITTING_TIME){
                alph = 255;
            }
            textAlpha(this.parts[0],this.x+this.textXs[2],this.y,alph);
            textAlpha(this.parts[1],this.x+this.textXs[4],this.y,alph);
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
        const cands = [1, 3, 6, 8, 12, 16, 25];
        let a;
        switch(opType){
            case "+":
                a = cands[floor(random(0,cands.length))];
                if(a<=1||this.value-a<=1||random()<0.3){
                    a = floor(random(2,this.value-1)); // works for 1 or higher, funnily enough
                }
                return [this.value-a,a];
            case "-":
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
            mag = constrain(map(this.splittingTimer,Bubble.SPLITTING_TIME,Bubble.SPLITTING_TIME/2,0,1.5),0,1);
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
    avoidBubbles(bubbles){
        const thisRad = this.visualRad();
        const thisX = this.visualX();
        for(let b of bubbles){
            const bRad = b.visualRad();
            const bX = b.visualX();
            if(this===b){
                continue;
            }
            let d = dist(thisX*0.75,this.y*1.3,bX*0.75,b.y*1.3); // Y IS STRETCHED TO BE LESS SIGNIFICANT
            if(d<=(thisRad+bRad)/2){
                let mag = pow(1-d/((thisRad+bRad)/2),1.2)*(this.spawnTimer>0 ? 0.12 : 0.14);
                let avoidance = this.angToNaturalVel(atan2(b.y-this.y,bX-thisX));
                this.vel.x-=mag*avoidance.x;
                this.vel.y-=mag*avoidance.y;
                
                // alternative system
                // let mag = pow(1-d/((thisRad+bRad)/2),1.2)*(this.spawnTimer>0 ? 0.12 : 0.14);
                // let myAng = atan2(this.vel.y,this.vel.x);
                // let dir = atan2(b.y-this.y,bX-thisX);
                // let sign = signOfCloserOrtho(dir,myAng);
                // let avoidance = this.angToNaturalVel(myAng+sign*PI*0.1);
                // this.vel.x+=mag*avoidance.x;
                // this.vel.y+=mag*avoidance.y;
                
            }
        }
    }
    avoidPos(x,y){
        if(x===undefined||y===undefined){
            return;
        }
        const thisRad = this.visualRad();
        const thisX = this.visualX();
        let d = dist(thisX*0.9,this.y*1.1,x*0.9,y*1.1);
        if(d<=thisRad){
            let mag = pow(1-d/thisRad,0.8)*3.2;
            let avoidance = this.angToNaturalVel(atan2(y-this.y,x-thisX));
            this.vel.x-=mag*avoidance.x;
            this.vel.y-=mag*avoidance.y;
            
            
            // alternative system
            // let mag = pow(1-d/(thisRad*0.5),1.2)*2;
            // let myAng = atan2(this.vel.y,this.vel.x);
            // let dir = atan2(y-this.y,x-thisX);
            // let sign = signOfCloserOrtho(dir,myAng);
            // let avoidance = this.angToNaturalVel(myAng+sign*PI*0.1);
            // let rejection = this.angToNaturalVel(dir+180);
            // this.vel.x+=mag*avoidance.x;
            // this.vel.y+=mag*avoidance.y;
            // this.vel.x+=mag*rejection.x/2;
            // this.vel.y+=mag*rejection.y/2;
        }
    }

    angToNaturalVel(ang){
        return {x:cos(ang)*this.naturalSpeed,y:sin(ang)*this.naturalSpeed};
    }

    static get rad(){
        return sqrt(width*height)*0.075;
    }
    static get speed(){
        return dist(0,0,width,height)*0.0008;
    }
}