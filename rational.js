class Rational {
    constructor(numerator, denominator) {
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
    
    getColor(){
        return color(0,0,0);
    }
}
