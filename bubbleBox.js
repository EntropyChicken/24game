class BubbleBox {
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
		
		for(let b of this.bubbles){
			b.avoid(this.bubbles);
		}
		for(let b of this.bubbles){
			b.process(this.bubbles);
		}
        this.deleteShouldDelete();
        this.deleteOutside();
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
            if(b.x>this.x+this.w+Bubble.rad||b.x<this.x-Bubble.rad||b.y>this.y+this.h+Bubble.rad||b.y<this.y-Bubble.rad){
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
        let ang = atan2(this.y+this.h/2-sy,this.x+this.w/2-sx) + random(-PI/5,PI/5);
        let newBubble = new Bubble(sx,sy,Bubble.velOfAng(ang),value,true);
        newBubble.spawnTimer += 90;
        newBubble.vel.x *= 20;
        newBubble.vel.y *= 20;
        this.bubbles.push(newBubble);
    }
}