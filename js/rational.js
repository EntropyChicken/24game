class Rational {
    constructor(numerator, denominator) {
        // If only one argument is provided, convert it from a float to a fraction
        if (denominator === undefined && !isNaN(numerator)) {
            if (Number.isInteger(numerator)) {
                denominator = 1;
            } else {
                // Find how many decimal places there are (e.g., 2.56 -> 2 decimal places)
                const fractionDigits = numerator.toString().split('.')[1]?.length || 0;
                const factor = Math.pow(10, fractionDigits);
                numerator = Math.round(numerator * factor);
                denominator = factor;
            }
        }
        
        if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
            this.numerator = NaN;
            this.denominator = NaN;
        } else {
            const gcd = Rational.gcd(Math.abs(numerator), Math.abs(denominator));
            this.numerator = Math.sign(denominator) * numerator / gcd;
            this.denominator = Math.abs(denominator) / gcd;
        }
    }

    static gcd(a, b) {
        if(isNaN(a) || isNaN(b)){
            return NaN;
        }
        return b === 0 ? a : Rational.gcd(b, a % b);
    }

    add(other) {
        const numerator = this.numerator * other.denominator + other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new Rational(numerator, denominator);
    }

    subtract(other) {
        const numerator = this.numerator * other.denominator - other.numerator * this.denominator;
        const denominator = this.denominator * other.denominator;
        return new Rational(numerator, denominator);
    }

    multiply(other) {
        const numerator = this.numerator * other.numerator;
        const denominator = this.denominator * other.denominator;
        return new Rational(numerator, denominator);
    }

    divide(other) {
        if (other.numerator === 0) {
            return new Rational(NaN, NaN);
        }
        const numerator = this.numerator * other.denominator;
        const denominator = this.denominator * other.numerator;
        return new Rational(numerator, denominator);
    }

    toString() {
        if (isNaN(this.numerator) || isNaN(this.denominator)) {
            return "NaN";
        }
        if (this.denominator === 1) {
            return `${this.numerator}`;
        }
        return `${this.numerator}/${this.denominator}`;
    }

    isInteger() {
        return this.denominator === 1;
    }

    equals(other) {
        if (!(other instanceof Rational)) {
            return false;
        }
        return this.numerator === other.numerator && this.denominator === other.denominator;
    }
    equals24() {
        return this.isInteger()&&this.numerator===24;
    }
    
    operation(s,b) {
        switch (s) {
            case '+': return this.add(b);
            case '-': return this.subtract(b);
            case '×': return this.multiply(b);
            case '÷': return this.divide(b);
            default:
                console.log ("Invalid operator char");
                return new Complex("Invalid operator char");
        }
    }

    getText(checkDebug) {
        // redundant but meh
        if (typeof(this.numerator) === "string") {
            return `"${this.numerator}"`;
        }
        if (checkDebug && typeof keyIsDown === "function" && keyIsDown(32)) {
            if (typeof fill === "function") fill(0, 100, 0); 
            return `${this.numerator}/${this.denominator}`;
        }
        if (isNaN(this.numerator) || isNaN(this.denominator)) {
            return "🤯⁉️";
        }
        let txt = "";
        if (this.denominator === 1) {
            txt = `${this.numerator}`;
        } else {
            txt = `(${this.numerator}/${this.denominator})`;
        }
        return txt.replaceAll("Infinity", "∞");
    }

    getColor(){
        if(isNaN(this.numerator)||isNaN(this.denominator||typeof(this.numerator)!=="number"||typeof(this.denominator)!=="number")||!isFinite(this.numerator)||!isFinite(this.denominator)){
            return color(120,120,120);
        }
        if(this.numerator<0){
            return color(255,0,100);
        }
        if(!this.isInteger()){
            return color(200,120,0);
        }
        return color(0,0,0);
    }
}
