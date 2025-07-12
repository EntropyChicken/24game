class BubbleBox {
    static PHYSICS_ITERATIONS = 2;
    constructor(x,y,w,h,startCount,startIters=12) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
		this.bubbles = [];
        this.minBubbles = 10;
        if(startCount===undefined){
            startCount = round(2+sqrt(w*h)*0.012);
        }
        for(let i = 0; i<startCount; i++){
            this.spawnBubble(false,24,random(0,120));
        }
        for(let i = 0; i<startIters; i++){
            for(let b of this.bubbles){
                b.avoidBubbles(this.bubbles);
            }
            for(let b of this.bubbles){
                b.physics();
            }
        }
    }
    
	draw(mx,my) {
        // to debug that reversed transforms are right lol
        // fill(255,0,0);
        // rect(mx-10,my-10,20,20);

		if(this.bubbles.length<this.minBubbles&&random(0,10)<1){
			this.spawnBubble(true);
		}

        for(let iter = 0; iter<BubbleBox.PHYSICS_ITERATIONS; iter++){
            for(let b of this.bubbles){
                b.avoidPos(mx,my);
            }
            for(let b of this.bubbles){
                b.avoidBubbles(this.bubbles);
            }
            for(let b of this.bubbles){
                b.physics();
            }
            this.deleteOutside();
        }
        for(let b of this.bubbles){
            b.nature(this.bubbles);
        }
        this.deleteShouldDelete();

		for(let b of this.bubbles){
			b.draw();
		}
	}
    deleteShouldDelete(){
        for(let i = this.bubbles.length-1; i>=0; i--){
            let b = this.bubbles[i];
            if(b.shouldDelete===true){
                this.bubbles.splice(i,1);
                continue;
            }
        }
    }
    deleteOutside(){
        for(let i = this.bubbles.length-1; i>=0; i--){
            let b = this.bubbles[i];
            if(b.x>this.x+this.w+Bubble.rad*2||b.x<this.x-Bubble.rad*2||b.y>this.y+this.h+Bubble.rad*2||b.y<this.y-Bubble.rad*2){
                this.bubbles.splice(i,1);
                continue;
            }
        }
    }

    spawnBubble(onEdge=false, value=24, spawnTimerOveride){
        let sx = random(this.x,this.x+this.w);
        let sy = random(this.y,this.y+this.h);
        let ang = random(0,2*PI);
        if(onEdge){
            if(random()<0.5){
                sx = random()<0.5 ? this.x-Bubble.rad : this.x+this.w+Bubble.rad;
            }
            else{
                sy = random()<0.5 ? this.y-Bubble.rad : this.y+this.h+Bubble.rad;
            }
            ang = atan2(this.y+this.h/2-sy,this.x+this.w/2-sx) + random(-PI/6,PI/6);
        }
        sx += 0.8*Bubble.rad; // to anticipate the counter effect to make .value centered
        
        let speed = Bubble.speed/BubbleBox.PHYSICS_ITERATIONS;
        let newBubble = new Bubble(sx,sy,{x:speed*cos(ang),y:speed*sin(ang)},value,true,speed);
        if(spawnTimerOveride!==undefined){
            newBubble.spawnTimer = spawnTimerOveride;
        }
        
        if(onEdge){
            const stepSize = 4;
            for(let steps = 0; steps<12; steps++){
                let visualX = newBubble.visualX();
                if(visualX<this.x-Bubble.rad*0.5||newBubble.y<this.y-Bubble.rad*0.3||visualX>this.x+this.w+Bubble.rad*0.5||newBubble.y>this.y+this.h+Bubble.rad*0.3){
                    newBubble.x += newBubble.vel.x * stepSize;
                    newBubble.y += newBubble.vel.y * stepSize;
                }
            }
        }
        this.bubbles.push(newBubble);
    }
}