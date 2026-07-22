// for space efficiency, perhaps i don't have to store the action information for every node, but just figure out what happened in makePath. however this pretty much duplicates code and it also requires stringToCards to work properly

// BFS to find shortest solutions to making 24 for any given numbers and opSymbols
class Solver {
    static FRACTION_DIGITS = 14; // should be more precise than display threshold. we assume we round this at every calculation

	constructor(numbers,opSymbols) { // pass in numbers, not Complex
        this.values = numbers.map(n => new Complex(n)); // DO NOT MUTATE
		this.opSymbols = opSymbols; // DO NOT MUTATE

        this.from = new Map(); // node (key) from which any node (key) was added
        this.actions = new Map(); // action (unlike in Sequence, this does not have id. need to reverse engineer later in makePath) by which any node (key) was added
        this.queue = new Queue();
        this.path = [];
        this.solutionSequence = new Sequence(undefined,false);
        this.solutionSequenceExpr = "";
        this.iterations = 0; // increases during .iterate()
        this.conclusion = "not found yet";

        this.initializeBFS();
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

    initializeBFS() { // reset variables and initalize queue and maps
        this.from = new Map();
        this.actions = new Map();
        this.queue = new Queue();
        this.queue.push(this.values);
        this.path = [];
        this.solutionSequence = new Sequence(undefined,false);
        this.solutionSequenceExpr = "";
        this.iterations = 0;
        this.conclusion = "not found yet";
        
        let s = Solver.cardsToString(this.values);
        this.from.set(s,"origin");
        this.actions.set(s,{});
    }
    iterate(maxIterations) {
        if(this.conclusion === "solved"){
            return "solved";
        }
        for(let iter = 0; iter < maxIterations && this.queue.size(); iter++){
            this.iterations++; // total iterations this Solver has ever done for this solve

            let cards = this.queue.pop(); // do not mutate the cards themselves
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
                            })){
                                this.conclusion = "solved";
                                this.solutionSequenceExpr = this.solutionSequence.toExpr();
                                return "solved"
                            };
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
                            })){
                                this.conclusion = "solved";
                                this.solutionSequenceExpr = this.solutionSequence.toExpr();
                                return "solved"
                            };
                        }
                        else{
                            if(this.queueUp(cardsCopy,currentKey,{
                                s:op,
                                b:cards[i]
                            })){
                                this.conclusion = "solved";
                                this.solutionSequenceExpr = this.solutionSequence.toExpr();
                                return "solved"
                            };
                        }
                    }
                }
            }
        }
        if(this.queue.size()===0){
            this.conclusion = "impossible";
            return "impossible"; // exhausted all of BFS possibilities and therefore it is impossible
        }
        this.conclusion = "not found yet";
        return "not found yet"; // perhaps there is a solution or perhaps not
    }
    getSolution(maxIterations) { // return a solution as an expression string, or "not found yet" if no solution found, or "impossible" if determined impossible
        this.initializeBFS();
        let result = this.iterate(maxIterations);
        if(result === "impossible" || result === "not found yet") {
            return result;
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

class Queue {
    constructor(){
        this.in = [];
        this.out = [];
    }
    push(element){
        this.in.push(element);
    }
    front(){
        if(this.out.length===0){
            this.in.reverse();
            this.out = this.in;
            this.in = [];
        }
        return this.out[this.out.length-1];
    }
    pop(){
        if(this.out.length===0){
            this.in.reverse();
            this.out = this.in;
            this.in = [];
        }
        return this.out.pop();
    }
    size(){
        return this.in.length + this.out.length;
    }
}