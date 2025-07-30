class Sequence {
    static SYMBOLS = ["+","-","×","÷","^","√","ln","!","sin","cos","tan","cot","asin","acos","abs","%","round","ceil","floor"];

    constructor(expr) {
        this.actions = [];
        if(expr !== undefined) {
            this.fromExpr(expr);
        }
    }

    fromExpr(expr) {
        if (/["']/g.test(expr)) return; // doesn't work for the "javascript" puzzles, leave actions empty
        expr = expr.replace(/\s+/g, ''); // remove spaces
        expr = expr.replace(/\*/g, '×').replace(/\//g, '÷'); // fix asterisks or slashes into actual signs
        expr = replaceUnaryMinusWithUnderscore(expr);

        // sets this.actions to carry out the mathematical expression (guaranteed to be valid, uses parentheses)
        this.actions = []; // a list of objects
        this.fromExprRecursive(expr);
    }
    fromExprRecursive(expr) {
        // expr should be break-down-able at least once: 2+2 is valid. 2 is not valid.
        let parts = topSplitExpr(expr);
        // console.log("BREAK DOWN ",expr);
        // console.log(parts);
        console.assert(parts!==null);
        if(parts===null) return new Complex(stringToNum(expr));

        
        // cringe doubled computation but cost is negligible
        let leftVal; // Complex
        if(topSplitExpr(parts.left)===null){
            leftVal = new Complex(stringToNum(parts.left)); // this is actually ZERO if the string is empty, but it is ignored for unary operator case anyway
        }
        else{
            leftVal = this.fromExprRecursive(parts.left);
        }
        let rightVal; // Complex
        if(topSplitExpr(parts.right)===null){
            rightVal = new Complex(stringToNum(parts.right));
        }
        else{
            rightVal = this.fromExprRecursive(parts.right);
        }


        if(symbolIsBinary(parts.splitter)){
            let r = leftVal.operation(parts.splitter,rightVal);
            this.actions.push({
                a:leftVal,
                s:parts.splitter,
                b:rightVal,
                r:r
            });
            return r;
        }
        else if(symbolIsUnary(parts.splitter)){
            if(parts.splitter==="!"){
                // content is to the left
                let r = leftVal.operation(parts.splitter);
                this.actions.push({
                    a:leftVal,
                    s:parts.splitter,
                    r:r
                });
                return r;
            }
            else{
                // content is to the right
                let r = rightVal.operation(parts.splitter);
                this.actions.push({
                    s:parts.splitter,
                    b:rightVal,
                    r:r
                });
                return r;
            }
        }
        else{
            console.assert(false,"parts.splitter is not an operator");
            return new Complex(NaN,NaN);
        }
    }
    toExpr() {
        // returns the expression that describes this series of actions (guaranteed to exist)
    }
}

function splitExpr(expr, splitStart, splitEnd) {
    return {
        left:expr.substring(0,splitStart),
        splitter:expr.substring(splitStart,splitEnd),
        right:expr.substring(splitEnd,expr.length)
    };
}
// currently only supports binary symbols
function topSplitExpr(expr) {
    // remove outermost parentheses so that the target symbol is guaranteed at depth 0
    let minDepth = -1;
    let depth = 0;
    for(let i = 0; i<expr.length; i++){
        let c = expr.charAt(i);
        if(c==="("){depth++;}
        if(c===")"){depth--;}
        console.assert(depth>=0);
        for(s of Sequence.SYMBOLS){
            if(expr.substring(i,min(expr.length,i+s.length))===s){
                if(minDepth===-1||depth<minDepth){
                    minDepth = depth;
                }
            }
        }
    }
    console.assert(depth===0);
    if(minDepth===-1){
        // no symbols at all, so it's in the form ((())), not ()()
        // this might be redundant though, since ((6)) is interpretted as 6 by stringToNum
        while(expr.length>0&&expr.charAt(0)==="("&&expr.charAt(expr.length-1)===")"){
            expr = expr.substring(1,expr.length-1);
        }
    }
    else{
        for(let i = 0; i<minDepth; i++){
            console.assert(expr.charAt(0)==="("&&expr.charAt(expr.length-1)===")");
            expr = expr.substring(1,expr.length-1);
        }
    }

    // list out all binary symbols at depth zero
    depth = 0;
    let symbols = []; // LOCATIONS of symbols
    let minPrecedence = 100; // 1 (addition), 2 (multiplication), 3 (exponentiation)
    for(let i = 0; i<expr.length; i++){
        let c = expr.charAt(i);
        if(c==="("){depth++;}
        if(c===")"){depth--;}
        if(depth===0){
            if(symbolIsBinary(c)){
                symbols.push(i);
                minPrecedence = min(minPrecedence,binarySymbolPrecedence(c));
            }
        }
    }

    // the binary symbol with weakest precendence is the target
    // reversed loop so that it does left to right when commutative
    for(let i = symbols.length-1; i>=0; i--){
        if(binarySymbolPrecedence(expr.charAt(symbols[i]))===minPrecedence){
            return splitExpr(expr,symbols[i],symbols[i]+1);
        }
    }

    // since there were no binary symbols, check for unary symbols (they must be at the front)
    // example: ln(stuff)
    for(s of Sequence.SYMBOLS){
        if(expr.substring(0,min(expr.length,s.length))===s){
            console.assert(symbolIsUnary(s));
            return splitExpr(expr,0,s.length);
        }
    }
    // or there could be factorial at the end. (stuff)!
    if(expr.charAt(expr.length-1)==="!"){
        return splitExpr(expr,expr.length-1,expr.length);
    }

    return null;
}
function binarySymbolPrecedence(symbol){
    // bigger precedence happens first
    if(symbol==="+"||symbol==="-"){
        return 1;
    }
    if(symbol==="×"||symbol==="÷"||symbol==="%"){
        return 2;
    }
    if(symbol==="^"){
        return 3;
    }
}
function realBinaryOperation(a,symbol,b){
    switch(symbol){
        case "+": return a+b;
        case "-": return a-b;
        case "×": return a*b;
        case "÷": return a/b;
        case "%": return a%b;
        case "^": return pow(a,b);
    }
    return NaN;
}

// MAKE SURE TO USE PARENTHESES or else -1^2 will be equal to 1 since -1 is treated as a name of a number
function replaceUnaryMinusWithUnderscore(expr) {
	let result = "";
	let i = 0;

	while (i < expr.length) {
		let char = expr[i];

		if (char === "-") {
			let isUnary = false;

			if (i === 0 || expr[i - 1] === "(") {
				isUnary = true;
			} else {
				for (let sym of Sequence.SYMBOLS) {
					let start = i - sym.length;
					if (start >= 0 && expr.slice(start, i) === sym) {
						isUnary = true;
						break;
					}
				}
			}

			if (isUnary) {
				result += "_";
				i++;
				continue;
			}
		}

		result += char;
		i++;
	}

	return result;
}
function stringToNum(s){
    while(s.length>0&&s.charAt(0)==="("&&s.charAt(s.length-1)===")"){
        s = s.substring(1,s.length-1);
    }
    let val;
    let negate = 1;
    if(s.charAt(0)==="_"){
        negate = -1;
        s = s.substring(1,s.length);
    }
    if(s==="π"){
        val = Math.PI;
    }
    else if(s==="e"){
        val = Math.E;
    }
    else{
        val = +s;
    }
    return val*negate;
}

// evaluates all expressions for all classics and puzzles except for js puzzles, sees if they're 24
function testSolutions() {
    let problemSets = puzzleSets.slice(0, 3).concat(puzzleSets.slice(4), classicSets);

    for(let problemSet of problemSets){
        for(let problem of problemSet){
            for(let sol of problem.sols){
                let aug = sol+"+0";
                console.log(aug);
                let seq = new Sequence(aug);
                if(seq.actions.length!==0){
                    console.log(seq.actions);
                    console.assert(seq.actions[seq.actions.length-1].a.equals24());

                    // more obvious in console
                    if(!seq.actions[seq.actions.length-1].a.equals24()){
                        for(let asdf = 0; asdf<100; asdf++){
                            console.log(random());
                        }
                    }
                }
            }
        }
    }
}