class Sequence {
    static SYMBOLS = ["+","-","×","÷","^","√",'∛',"ln","!","sin","cos","tan","cot","asin","acos","sec","csc","abs","%","round","ceil","floor"];

    constructor(expr, useRational = false) {
        // indexing is crucial for toExpr()
        this.actions = [];
        this.useRational = useRational;

        if(expr !== undefined) {
            this.fromExpr(expr);
        }
    }

    fromExpr(expr) {
        if (/["']/g.test(expr)) return; // doesn't work for the "javascript" puzzles, leave actions empty
        expr = expr.replace(/\s+/g, ''); // remove spaces
        expr = expr.replace(/\*/g, '×').replace(/\//g, '÷'); // fix asterisks or slashes into actual signs
        expr = replaceUnaryMinusWithUnderscore(expr);
        expr = replaceScientificNumbers(expr);

        // sets this.actions to carry out the mathematical expression (guaranteed to be valid, uses parentheses)
        this.actions = []; // a list of objects
        this.fromExprRecursive(expr);
    }
    fromExprRecursive(expr) {
        // 1. Dynamically pick the right class based on the flag
        const NumericClass = this.useRational ? Rational : Complex;

        // expr should be break-down-able at least once: 2+2 is valid. 2 is not valid.
        let parts = topSplitExpr(expr);
        console.assert(parts!==null);
        
        // 2. Use NumericClass instead of hardcoded Complex
        if(parts===null) return new NumericClass(stringToNum(expr));

        // cringe doubled computation but cost is negligible
        let leftVal; // Dynamically Rational or Complex
        let leftSource = -1;
        if(topSplitExpr(parts.left)===null){
            // 3. Swap here
            leftVal = new NumericClass(stringToNum(parts.left)); 
        }
        else{
            leftVal = this.fromExprRecursive(parts.left);
            leftSource = this.actions.length-1; 
        }
        
        let rightVal; // Dynamically Rational or Complex
        let rightSource = -1;
        if(topSplitExpr(parts.right)===null){
            // 4. Swap here
            rightVal = new NumericClass(stringToNum(parts.right));
        }
        else{
            rightVal = this.fromExprRecursive(parts.right);
            rightSource = this.actions.length-1;
        }

        if(symbolIsBinary(parts.splitter)){
            this.actions.push({
                a:leftVal,
                s:parts.splitter,
                b:rightVal,
                aId:leftSource,
                bId:rightSource
            });
            return leftVal.operation(parts.splitter,rightVal);
        }
        else if(symbolIsUnary(parts.splitter)){
            if(parts.splitter==="!"){
                this.actions.push({
                    a:leftVal,
                    s:parts.splitter,
                    aId:leftSource,
                    bId:rightSource
                });
                return leftVal.operation(parts.splitter);
            }
            else{
                this.actions.push({
                    s:parts.splitter,
                    b:rightVal,
                    aId:leftSource,
                    bId:rightSource
                });
                return rightVal.operation(parts.splitter);
            }
        }
        else{
            console.assert(false,"parts.splitter is not an operator");
            // 5. Swap here for the error fallback state
            return new NumericClass(NaN,NaN);
        }
    }
    toExpr() {
        // returns an expression that describes this series of actions (guaranteed to exist)
        // hopefully but not guaranteed to be the inverse of fromExpr)
        
        this.seenIds = [];
        let ret = "";
        for(let i = this.actions.length-1; i>=0; i--){
            if(this.seenIds.includes(i)){
                continue;
            }
            this.seenIds.push(i);
            if(ret!==""){
                ret += ", ";
            }
            ret += this.toExprRecursive(i);
        }
        return ret;
    }
    toExprRecursive(id) {
        this.seenIds.push(id);
        if(id===-1){
            return null;
        }
        console.assert(id<this.actions.length,id,this.actions.length);
        let t = this.actions[id];
        if(t.a===undefined){
            console.assert(t.b!==undefined);
            let right = this.toExprRecursive(t.bId);
            let rs = "";
            if(right===null){
                right = t.b.getText();
                if(t.s==="√"){
                    return t.s + right;
                }
            }
            else{
                rs = topSplitExpr(right).splitter;
            }

            // prefer √√√ over √(√(√(
            if(!(symbolIsUnary(rs)&&right.charAt(0)==="√"&&t.s==="√")){
                // general case: wrap
                right = "("+right+")";
            }
            return t.s + right;
        }
        else if(t.b===undefined){
            console.assert(t.a!==undefined);
            let left = this.toExprRecursive(t.aId);
            let isNumberName = false;
            if(left===null){
                left = t.a.getText();
                isNumberName = true;
            }
            // )!)!)! is clearer than )!!! because it's not a triple factorial
            if(!(t.s==="!"&&isNumberName)){
                left = "("+left+")";
            }
            return left + t.s;
        }
        else{
            console.assert(symbolIsBinary(t.s));
            let precedence = binarySymbolPrecedence(t.s);

            let left = this.toExprRecursive(t.aId);
            let right = this.toExprRecursive(t.bId);
            let leftIsNumberName = false;
            let rightIsNumberName = false;

            if(left===null){
                left = t.a.getText();
                leftIsNumberName = true;
            }
            else{
                let ls = topSplitExpr(left).splitter;
                if(symbolIsBinary(ls)){
                    let leftPrecedence = binarySymbolPrecedence(ls);
                    if(leftPrecedence<precedence){
                        // if they're equal, left will evaluate first so no need
                        left = "("+left+")";
                    }
                }
            }

            if(right===null){
                right = t.b.getText();
                rightIsNumberName = true;
            }
            else{
                let rs = topSplitExpr(right).splitter;
                if(symbolIsBinary(rs)){
                    let rightPrecedence = binarySymbolPrecedence(rs);
                    if(rightPrecedence<=precedence){
                        // if they're equal, right MUST EVALUATE FIRST so NEED PARENTHESES
                        right = "("+right+")";
                    }
                }
            }

            if(t.s==="^"){ // extra clarity for exponentiation
                if(left.charAt(0)!=="("&&(left.charAt(0)==="-"||!leftIsNumberName)){
                    left = "("+left+")";
                }
                if(right.charAt(0)!=="("&&(right.charAt(0)==="-"||!rightIsNumberName)){
                    right = "("+right+")";
                }
            }

            return left + t.s + right;
        }
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
// for big scientific numbers, remove the plus sign. for small scientific numbers, write them out and/or round to 11 decimal points
function replaceScientificNumbers(str) {
	return str.replace(/\b-?\d+(\.\d+)?e[+-]?\d+\b/gi, match => {
		const num = Number(match);

		if (Math.abs(num) >= 1e5) {
			// Keep scientific notation, but strip "+", keep "-"
			return num.toExponential().replace(/e\+/, 'e');
		} else {
			// Convert to decimal form with up to 11 digits of precision (AFTER DECIMAL POINT)
			let fixed = num.toFixed(11);
			// Remove trailing zeros and possible trailing dot
			return fixed.replace(/\.?0+$/, '');
		}
	});
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

function testSolutionsOfProblemSet(problemSet,useRational){
    for(let problem of problemSet){
        for(let sol of problem.sols){
            let aug = sol+"+0";
            let ogAug = aug;

            for(let iter = 6; iter>0; iter--){
                let seq = new Sequence(aug,useRational);
                console.assert(seq.actions.length!==0);
                console.assert(seq.actions[seq.actions.length-1].a.equals24(),problem,sol,seq.actions[seq.actions.length-1].a);
                
                aug = seq.toExpr();
                if(aug===ogAug){
                    break;
                }
            }
        }
    }
}

// evaluates all expressions for all classics and puzzles except for js puzzles, sees if they're 24
function testAllSolutions() {
    for(let problemSet of classicSets){
        testSolutionsOfProblemSet(problemSet,true);
    }
    for(let problemSet of puzzleSets.slice(0,3).concat(puzzleSets.slice(4))){
        testSolutionsOfProblemSet(problemSet,false);
    }
    console.log("finished testing all solutions in all problem sets!");
}