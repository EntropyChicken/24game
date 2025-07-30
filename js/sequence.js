class Sequence {
    constructor(expr) {
        this.actions = [];
        if(expr !== undefined) {
            this.actions = Sequence.parseExpr(expr);
        }
    }

    static parseExpr(expr) {
        // returns a Sequence that carries out the mathematical expression
        
    }
}