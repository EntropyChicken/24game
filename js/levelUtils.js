// Level Generation Helpers
function getRandomLevel(levelSet, previousCards, defaultOps = Level.SYMBOLS, overrideOps = false, shuffleCards) {
    for (let i = 0; i < levelSet.length; i++) {
        let lvl = levelSet[i];

        if (!sameCards(lvl.cards, previousCards)) {
            levelSet.splice(i, 1); 
            return buildLevel(lvl, defaultOps, overrideOps, shuffleCards);
        }
    }

    let lvl = levelSet.pop();
    return buildLevel(lvl, defaultOps, overrideOps, shuffleCards);
}

function buildLevel(lvl, defaultOps, overrideOps, shuffleCards) {
    let ops = defaultOps;
    if (!overrideOps && lvl.ops !== undefined) {
        ops = lvl.ops;
    }

    let cards = shuffleCards ? shuffle(lvl.cards) : lvl.cards;

    return {
        cards: cards,
        ops: ops,
        lvl: lvl
    };
}

function sameCards(a, b) {
    if (!a || !b || a.length !== b.length) return false;

    let sa = a.toSorted();
    let sb = b.toSorted();
    return sa.every((v, i) => v === sb[i]);
}

function checkResetSet() {
    if (currentLevelSet.length === 0) {
        if(currentIsClassic){
            classicSets[currentLevelSetIndex] = shuffle([...originalClassicSets[currentLevelSetIndex]]);
            currentLevelSet = classicSets[currentLevelSetIndex];
        }
        else{
            puzzleSets[currentLevelSetIndex] = shuffle([...originalPuzzleSets[currentLevelSetIndex]]);
            currentLevelSet = puzzleSets[currentLevelSetIndex];
        }
    }
}

function symbolIsUnary(symbol) {
    const unaryOperators = ['√', '∛', 'ln', '!', 'sin', 'cos', 'tan', 'cot', 'asin', 'acos', 'sec', 'csc', 'abs', 'floor', 'round', 'ceil'];
    return unaryOperators.includes(symbol);
}

function symbolIsBinary(symbol) {
    const binaryOperators = ['+', '-', '×', '÷', '%', '^'];
    return binaryOperators.includes(symbol);
}

function symbolIsCommutative(symbol) {
    return symbol === '+' || symbol === '×';
}

function getFinalStep(expr) {
    expr = expr.replace(/\s+/g, "");

    const tokenize = s => {
        let t = [], num = "";
        for (let c of s) {
            if (/\d/.test(c)) {
                num += c;
            } else {
                if (num) { t.push(num); num = ""; }
                t.push(c);
            }
        }
        if (num) t.push(num);
        return t;
    };

    let lastOp = null;
    function applyOp(tokens, i) {
        const a = Number(tokens[i - 1]);
        const op = tokens[i];
        const b = Number(tokens[i + 1]);
        let res;
        switch (op) {
            case '×': res = a * b; break;
            case '÷': res = a / b; break;
            case '+': res = a + b; break;
            case '-': res = a - b; break;
        }
        lastOp = { a, op, b };
        tokens.splice(i - 1, 3, String(res));
    }

    function reduceTokens(tokens) {
        let open;
        while ((open = tokens.lastIndexOf('(')) !== -1) {
            let close = tokens.indexOf(')', open + 1);
            const inner = tokens.slice(open + 1, close);
            reduceTokens(inner);
            tokens.splice(open, close - open + 1, inner[0]);
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '×' || tokens[i] === '÷') {
                applyOp(tokens, i);
                i--;
            }
        }
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '+' || tokens[i] === '-') {
                applyOp(tokens, i);
                i--;
            }
        }
    }

    function truncateTo8Decimals(x) {
        if (typeof x !== 'number') return x;
        const truncated = Math.floor(x * 1e8) / 1e8;
        return parseFloat(truncated.toString());
    }

    let tokens = tokenize(expr);
    lastOp = null;
    reduceTokens(tokens);

    if (!lastOp) return "getFinalStep failed";

    const step = `${truncateTo8Decimals(lastOp.a)}${lastOp.op}${truncateTo8Decimals(lastOp.b)}`;

    return finalStepEquals24(step)
        ? step
        : "getFinalStep failed to equal 24";
}

function finalStepEquals24(expression) {
    const ops = ['+', '-', '×', '÷'];
    let opFound = null;
    let opIndex = -1;
    for (let op of ops) {
        opIndex = expression.indexOf(op);
        if (opIndex !== -1) {
            opFound = op;
            break;
        }
    }
    if (!opFound) return false;
    let a = expression.substring(0, opIndex).trim();
    let b = expression.substring(opIndex + opFound.length).trim();
    a = parseFloat(a);
    b = parseFloat(b);
    if (isNaN(a) || isNaN(b)) return false;
    let result;
    switch (opFound) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '×': result = a * b; break;
        case '÷': if (b === 0) return false; result = a / b; break;
        default: return false;
    }
    return Math.abs(result - 24) < EQUALITY_THRESHOLD;
}