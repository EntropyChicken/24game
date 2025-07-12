class BubbleBox {
    static PHYSICS_ITERATIONS = 2;
    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
		this.bubbles = [];
    }
    
	draw() {
		if(this.bubbles.length<12&&random(0,20)<1){
			this.spawnBubble();
		}
		
		// let newBubbles = [];
		// for(let b of this.bubbles){
		// 	// console.log(b);
		// 	newBubbles.push(...b.process());
		// }
		// for(let i = this.bubbles.length-1; i>=0; i--){
		// 	this.bubbles[i].spliceOutsideBox(this.bubbles,0,0,width,height);
		// }
		// this.bubbles.push(...newBubbles);
		
        
        for(let iter = 0; iter<BubbleBox.PHYSICS_ITERATIONS; iter++){
            for(let b of this.bubbles){
                b.avoid(this.bubbles);
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

    spawnBubble(value=24){
        let sx, sy;
        if(random()<0.5){
            sx = random()<0.5 ? this.x-Bubble.rad : this.x+this.w+Bubble.rad;
            sy = random(this.y,this.y+this.h);
        }
        else{
            sy = random()<0.5 ? this.y-Bubble.rad : this.y+this.h+Bubble.rad;
            sx = random(this.x,this.x+this.w);
        }
        let ang = atan2(this.y+this.h/2-sy,this.x+this.w/2-sx) + random(-PI/6,PI/6);
        sx += 0.8*Bubble.rad; // to anticipate the counter effect to make .value centered
        let speed = Bubble.speed/BubbleBox.PHYSICS_ITERATIONS;
        let newBubble = new Bubble(sx,sy,{x:speed*cos(ang),y:speed*sin(ang)},value,true,speed);
        newBubble.spawnTimer += 60;

        const stepSize = 5;
        for(let steps = 0; steps<10; steps++){
            let visualX = newBubble.visualX();
            if(visualX<this.x-Bubble.rad*0.5||newBubble.y<this.y-Bubble.rad*0.3||visualX>this.x+this.w+Bubble.rad*0.5||newBubble.y>this.y+this.h+Bubble.rad*0.3){
                newBubble.x += newBubble.vel.x * stepSize;
                newBubble.y += newBubble.vel.y * stepSize;
            }
        }
        this.bubbles.push(newBubble);
    }
}