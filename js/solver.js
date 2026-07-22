// for space efficiency, perhaps i don't have to store the action information for every node, but just figure out what happened in makePath. however this pretty much duplicates code and it also requires stringToCards to work properly

class Solver {
    static FRACTION_DIGITS = 14; // should be more precise than display threshold. we assume we round this at every calculation

	constructor(numbers,opSymbols) { // pass in numbers, not Complex
        this.values = numbers.map(n => new Complex(n)); // DO NOT MUTATE
		this.opSymbols = opSymbols; // DO NOT MUTATE

        this.from = new Map(); // node (key) from which any node (key) was added
        this.actions = new Map(); // action (unlike in Sequence, this does not have id. need to reverse engineer later in makePath) by which any node (key) was added
        this.queue = []; // never actually deletes the front. but it's not as big as the map so whatever
        this.queueId = 0; // the next index to pull from the queue
        this.path = [];
        this.solutionSequence = new Sequence(undefined,false);
    }

    static cardsToString(cards){ // cards is an array of Complex. do not mutate
        let s = "";
        for(let card of cards){
            if(typeof card.real.toFixed !== "function"){
                console.log("FAILED");
                console.log(cards);
                console.log(card);
            } 
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
    queueUp(cardsUnsorted,previousKey,action){ // takes unsorted array of Complex. returns true if made 24
        // check this outside, since it's slightly faster to just check the 1 new card then go through them all
        // for (let card of cardsUnsorted) {
        //     if (card.isNaN()) {
        //         return false;
        //     }
        // }

        // make deep copy, sorted
        let cardsSorted = cardsUnsorted.map(c => new Complex(c.real, c.imag)).sort((a, b) => {
            if (a.real !== b.real) return a.real - b.real;
            return a.imag - b.imag;
        });

        let newKey = Solver.cardsToString(cardsSorted);
        if(this.from.has(newKey)) return false;
        this.from.set(newKey,previousKey);
        this.actions.set(newKey,action);
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
            this.makeSolutionSequence();
            return;
        }
        this.makePath(previousKey);
    }
    makeSolutionSequence(){ // assumes this.path is made, and that it starts with the original state
        this.solutionSequence = new Sequence(undefined,false);
        let cards = [...this.values]; // mutate this along
		let sourceIdOfPos = cards.map(n => -1);
        for(let p = 1; p<this.path.length; p++){
            let actionData = this.actions.get(this.path[p]);
            if(actionData.a===undefined){
                for(let i = 0; i<cards.length; i++){
                    if(cards[i].equals(actionData.b)){
                        this.solutionSequence.actions.push({
                            s:actionData.s,
                            b:actionData.b,
                            bId:sourceIdOfPos[i]
                        });
                        cards[i] = cards[i].operation(actionData.s);
                        sourceIdOfPos[i] = this.solutionSequence.actions.length-1;
                        break;
                    }
                }
            }
            else if(actionData.b===undefined){
                for(let i = 0; i<cards.length; i++){
                    if(cards[i].equals(actionData.a)){
                        this.solutionSequence.actions.push({
                            a:actionData.a,
                            s:actionData.s,
                            aId:sourceIdOfPos[i]
                        });
                        cards[i] = cards[i].operation(actionData.s);
                        sourceIdOfPos[i] = this.solutionSequence.actions.length-1;
                        break;
                    }
                }
            }
            else{ // is binary operation
                let aPos = -1, bPos = -1;
                for(let i = 0; i<cards.length; i++){
                    if(cards[i].equals(actionData.a)){
                        aPos = i;
                        break;
                    }
                }
                for(let i = 0; i<cards.length; i++){
                    if(i!==aPos&&cards[i].equals(actionData.b)){
                        bPos = i;
                        break;
                    }
                }
                console.assert(aPos!==-1&&bPos!==-1);
                this.solutionSequence.actions.push({
                    a:actionData.a,
                    s:actionData.s,
                    b:actionData.b,
                    aId:sourceIdOfPos[aPos],
                    bId:sourceIdOfPos[bPos]
                });
                cards[bPos] = cards[aPos].operation(actionData.s,cards[bPos]);
                cards[aPos] = new Complex(NaN,NaN); // placeholders to maintain correct indices in cards
                sourceIdOfPos[bPos] = this.solutionSequence.actions.length-1;
            }
        }
    }

    solveLoop(maxIterations) { // returns -1 if did not find a solution, -2 if deemed impossible, or the iteration number (between 1 and maxIterations, inclusive). if it finds a solution, it will eventually call makeSolutionSequence
        for(let iteration = 1; iteration <= maxIterations && this.queueId < this.queue.length; iteration++){
            let cards = this.queue[this.queueId]; // do not mutate the cards themselves
            this.queueId++;
            let currentKey = Solver.cardsToString(cards);

            for(let op of this.opSymbols){
                if(symbolIsBinary(op)){
                    for(let i = 0; i<cards.length; i++){
                        let end = (symbolIsCommutative(op) ? i : cards.length);
                        for(let j = 0; j<end; j++){
                            if(i===j) continue;
                            let cardsCopy = [...cards];
                            cardsCopy[j] = cards[i].operation(op,cards[j]); // replace with new card
                            if(cardsCopy[j].isNaN()) continue;
                            cardsCopy.splice(i,1);
                            if(this.queueUp(cardsCopy,currentKey,{
                                a:cards[i],
                                s:op,
                                b:cards[j]
                            })) return iteration;
                        }
                    }
                }
                else{
                    for(let i = 0; i<cards.length; i++){
                        let cardsCopy = [...cards];
                        cardsCopy[i] = cards[i].operation(op); // replace with new card
                        if(cardsCopy[i].isNaN()) continue;
                        if(op==="!"){
                            if(this.queueUp(cardsCopy,currentKey,{
                                a:cards[i],
                                s:op
                            })) return iteration;
                        }
                        else{
                            if(this.queueUp(cardsCopy,currentKey,{
                                s:op,
                                b:cards[i]
                            })) return iteration;
                        }
                    }
                }
            }
        }
        if(this.queueId === this.queue.length){
            return -2; // exhausted all of BFS possibilities and therefore it is impossible
        }
        return -1; // not found yet. perhaps there is a solution or perhaps not
    }
    getSolution(maxIterations) { // return a solution as an expression string, or "not found yet" if no solution found, or "impossible" if determined impossible
        this.from = new Map();
        this.actions = new Map();
        this.path = [];
        this.solutionSequence = new Sequence(undefined,false);
        this.queue = [this.values];
        this.queueId = 0;
        let s = Solver.cardsToString(this.values);
        this.from.set(s,"origin");
        this.actions.set(s,{});
        let result = this.solveLoop(maxIterations);
        if(result === -2) {
            return "impossible";
        }
        else if(result === -1) {
            return "not found yet";
        }
        else {
            return this.solutionSequence.toExpr();
        }
    }
}


function findSolutionsOfProblemSet(problemSet,maxIterations=10000){
    for(let problem of problemSet){
        let ops = problem.ops;
        if(ops === undefined) {
            ops = ["+","-","×","÷"];
        }
        let solver = new Solver(problem.cards,ops);
        let solution = solver.getSolution(maxIterations);
        console.log(solution);
        if(solution==="impossible"||solution==="not found yet"){
            console.assert(false,"solution: "+solution);
            console.log(problem.cards);
            console.log(ops);
        }
        else{
            let sequence = new Sequence(solution+"+0");
            console.assert(sequence.actions[sequence.actions.length-1].a.equals24(),"the created solution expression does not equal 24");
        }
    }
}

function findAllSolutions(maxIterations=10000) {
    // for(let problemSet of classicSets){
    //     findSolutionsOfProblemSet(problemSet);
    // }
    for(let problemSet of puzzleSets.slice(0,3).concat(puzzleSets.slice(4))){
        findSolutionsOfProblemSet(problemSet,maxIterations);
    }
    console.log("finished solving all problem sets!");
}