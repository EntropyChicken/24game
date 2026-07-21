class Solver {
    static FRACTION_DIGITS = 14; // should be more precise than display threshold. we assume we round this at every calculation

	constructor(level) {
        this.level = level; // do not mutate
        this.from = new Map();
        this.queue = []; // never actually deletes the front. but it's not as big as the map so whatever
        this.queueId = 0; // the next index to pull from the queue
        this.path = [];

        let s = Solver.cardsToString(this.level.values);
        let c = Solver.stringToCards(s);
        console.log(s);
        console.log(c);
        for(let i = 0; i<this.level.values.length; i++){
            if(!this.level.values[i].equals(c[i])){
                console.log("INEQUAL:"+this.level.values[i]+" "+c[i]);
            }
        }

        this.queueUp(level.values,"origin");
        console.log(this.solveLoop(100));
        console.log(this.path);
    }

    static cardsToString(cards){ // cards is an array of Complex. do not mutate
        let s = "";
        for(let card of cards){
            s += `${card.real.toFixed(Solver.FRACTION_DIGITS)},${card.imag.toFixed(Solver.FRACTION_DIGITS)};`;
        }
        return s;
    }
    static stringToCards(string){
        let c = [];
        let cardStrings = string.split(";");
        if(cardStrings.length > 0 && cardStrings[cardStrings.length-1]===""){
            cardStrings.pop(); // remove the empty string at the end
        }
        for(let cardString of cardStrings){
            let parts = cardString.split(",");
            c.push(new Complex(parseFloat(parts[0]),parseFloat(parts[1])));
        }
        return c;
    }
    queueUp(cardsUnsorted,previousKey){ // takes unsorted array of Complex. returns true if made 24
        // make deep copy
        let cardsSorted = cardsUnsorted.map(c => new Complex(c.real, c.imag)).sort((a, b) => {
            if (a.real !== b.real) return a.real - b.real;
            return a.imag - b.imag;
        });

        let newKey = Solver.cardsToString(cardsSorted);
        if(this.from.has(newKey)) return false;
        this.from.set(newKey,previousKey);
        this.queue.push(cardsSorted);
        
        if(cardsSorted.length===1&&cardsSorted[0].equals24()){
            this.path = [];
            this.makePath(newKey);
            return true;
        }
        return false;
    }
    makePath(currentKey){
        this.path.push(currentKey);
        let previousKey = this.from.get(currentKey);
        if(previousKey === "origin" || previousKey === null || previousKey === undefined){
            this.path.reverse();
            return;
        }
        this.makePath(previousKey);
    }

    solveLoop(iterations) {
        for(let iter = 0; iter < iterations && this.queueId < this.queue.length; iter++){
            let cards = this.queue[this.queueId]; // do not mutate the cards themselves
            this.queueId++;
            let currentKey = Solver.cardsToString(cards);

            for(let op of this.level.opSymbols){
                if(symbolIsUnary(op)){
                    for(let i = 0; i<cards.length; i++){
                        let cardsCopy = [...cards];
                        cardsCopy[i] = cards[i].operation(op); // replace with new card
                        if(this.queueUp(cardsCopy,currentKey)) return true;
                    }
                }
                else{
                    for(let i = 0; i<cards.length; i++){
                        let end = (symbolIsCommutative(op) ? i : cards.length);
                        for(let j = 0; j<end; j++){
                            if(i===j) continue;
                            let cardsCopy = [...cards];
                            cardsCopy[j] = cards[i].operation(op,cards[j]); // replace with new card
                            cardsCopy.splice(i,1);
                            if(this.queueUp(cardsCopy,currentKey)) return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    solve() { // return a solution as an expression string, or "indeterminate" if no solution found, or "impossible" if determined impossible

    }
}