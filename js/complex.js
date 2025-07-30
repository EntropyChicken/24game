function numToString(x) {
	if (!Number.isFinite(x)) return x.toString(); // for Infinity, NaN
	// Fix to 11 decimal places, then remove trailing zeros and optional "."
	return parseFloat(x.toFixed(11)).toString();
}
function factorialRecursive(int){
    if(int>0){
        return int*factorialRecursive(int-1);
    }
    if(int===0){
        return 1;
    }
    return NaN;
}

class Complex {
    constructor(real, imag = 0) {
        if(isNaN(real)){
            imag = NaN;
        }
        if(isNaN(imag)){
            real = NaN;
        }
        this.real = real;
        this.imag = imag;
    }

    equals(other, threshold = EQUALITY_THRESHOLD) {
        return abs(this.real - other.real) < threshold && abs(this.imag - other.imag) < threshold;
    }
    equals24() {
        return this.equals(new Complex(24));
    }

    round(threshold = DISPLAY_THRESHOLD) {
        let r = this.real, i = this.imag;
        if (abs(r - Math.round(r)) < threshold) r = Math.round(r);
        if (abs(i - Math.round(i)) < threshold) i = Math.round(i);
        return new Complex(r, i);
    }

    isNaN() {
        return isNaN(this.real) || isNaN(this.imag);
    }
    add(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        return new Complex(this.real + o.real, this.imag + o.imag);
    }
    subtract(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        return new Complex(this.real - o.real, this.imag - o.imag);
    }
    multiply(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        if(this.imag===0&&o.imag===0){
            return new Complex(this.real * o.real);
        }
        return new Complex(this.real * o.real - this.imag * o.imag, this.real * o.imag + this.imag * o.real);
    }
    divide(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        const d = o.real ** 2 + o.imag ** 2;
        if (d === 0) {
            return new Complex(NaN, NaN);
        }
        if(o.equals(new Complex(0),DISPLAY_THRESHOLD)){
            return new Complex(NaN,NaN);
        }
        if(o.imag===0){
            // assuming o being 0 is already confirmed to be false
            return new Complex(this.real / o.real, this.imag / o.real);
        }
        return new Complex((this.real * o.real + this.imag * o.imag) / d, (this.imag * o.real - this.real * o.imag) / d);
    }
    power(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        if(this.equals(new Complex(0),DISPLAY_THRESHOLD)){
            if(o.real>0){
                return new Complex(0);
            }
            return new Complex(NaN,NaN);
        }
        if(o.real===0&&o.imag===0){
            // except if this is zero, which is handled above
            return new Complex(1);
        }
        if (this.imag === 0 && o.imag === 0 && o.real >= 0 && this.real >= 0) {
            return new Complex(pow(this.real, o.real));
        }

        
        // complex
        let r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        let theta = Math.atan2(this.imag, this.real);
        let a = o.real;
        let b = o.imag;
        let modulus = Math.exp(a * Math.log(r) - b * theta);
        let angle;
        if(b===0){
            // guard for square root negative infinity
            angle = a * theta;
        }
        else{
            angle = a * theta + b * Math.log(r);
        }

        // guards for square root negative infinity
        let real = cos(angle);
        if(abs(real)>DISPLAY_THRESHOLD){real *= modulus;}
        else{real = 0;}
        let imag = sin(angle);
        if(abs(imag)>DISPLAY_THRESHOLD){imag *= modulus;}
        else{imag = 0;}
        return new Complex(real,imag);
    }
    sqrt() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        return this.power(new Complex(0.5));
    };

    
    negate() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        return new Complex(-this.real, -this.imag);
    }
    naturalLog(checkReal = false) {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(this.equals(new Complex(0),DISPLAY_THRESHOLD)){
            return new Complex(NaN,NaN);
        }
        if (checkReal && this.round().imag === 0) {
            return new Complex(Math.log(this.real));
        }
        const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        const theta = Math.atan2(this.imag, this.real);
        return new Complex(Math.log(r), theta);
    }    
    exp() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const r = Math.exp(this.real);
        return new Complex(
            r * Math.cos(this.imag),
            r * Math.sin(this.imag)
        );
    }

    factorial() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(this.imag===0){
            if(this.real===Infinity){
                return new Complex(Infinity);
            }
            if(this.real===-Infinity){
                return new Complex(NaN,NaN);
            }
            if(this.real>=0&&this.real<=100&&this.real===round(this.real)){
                return new Complex(factorialRecursive(round(this.real)));
            }
        }
        return Complex.gamma(this.add(new Complex(1)));
    }

    static gamma(z) {
        const THRESHOLD = 1e-10;
        const PI = Math.PI;

        // Check for poles (non-positive integers)
        if (Math.abs(z.imag) < THRESHOLD) {
            const realRounded = Math.round(z.real);
            if (Math.abs(z.real - realRounded) < THRESHOLD && realRounded <= 0) {
                return new Complex(NaN, NaN);
            }
        }

        if (z.real < 0.5) {
            // Reflection formula: gamma(z) = PI / (sin(PI * z) * gamma(1 - z))
            const sinPIz = new Complex(
                Math.sin(PI * z.real) * Math.cosh(PI * z.imag),
                Math.cos(PI * z.real) * Math.sinh(PI * z.imag)
            );

            // Check for sinPIz being zero (indicating pole)
            if (Math.abs(sinPIz.real) < THRESHOLD && Math.abs(sinPIz.imag) < THRESHOLD) {
                return new Complex(NaN, NaN);
            }

            const oneMinusZ = new Complex(1 - z.real, -z.imag);
            const gamma1MinusZ = Complex.gamma(oneMinusZ);
            const piComplex = new Complex(PI);
            return piComplex.divide(sinPIz.multiply(gamma1MinusZ));
        } else {
            // Lanczos approximation parameters
            const g = 7;
            const p = [
                0.99999999999980993,
                676.5203681218851,
                -1259.1392167224028,
                771.32342877765313,
                -176.61502916214059,
                12.507343278686905,
                -0.13857109526572012,
                9.9843695780195716e-6,
                1.5056327351493116e-7
            ];

            const zMinus1 = z.subtract(new Complex(1));
            const t = zMinus1.add(new Complex(g + 0.5));

            // Sum coefficients
            let A = new Complex(p[0]);
            for (let i = 1; i < p.length; i++) {
                const denom = zMinus1.add(new Complex(i));
                A = A.add(new Complex(p[i]).divide(denom));
            }

            // Compute t^(z - 0.5) = exp((z - 0.5) * log(t))
            const logT = t.naturalLog();
            const exponent = zMinus1.add(new Complex(0.5)).multiply(logT);
            const term1 = exponent.exp();

            // Compute exp(-t)
            const term2 = (new Complex(-t.real, -t.imag)).exp();

            // Compute sqrt(2*PI)
            const sqrt2PI = new Complex(Math.sqrt(2 * PI));

            return A.multiply(term1).multiply(term2).multiply(sqrt2PI);
        }
    }

    sin() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const iz = new Complex(-this.imag, this.real);
        const eiz = iz.exp();
        const e_iz = iz.negate().exp();
        return eiz.subtract(e_iz).divide(new Complex(0, 2));
    }

    cos() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const iz = new Complex(-this.imag, this.real);
        const eiz = iz.exp();
        const e_iz = iz.negate().exp();
        return eiz.add(e_iz).multiply(new Complex(0.5, 0));
    }

    tan() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const s = this.sin();
        const c = this.cos();
        return s.divide(c);
    }

    cot() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const s = this.sin();
        const c = this.cos();
        return c.divide(s);
    }
    asin() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const i = new Complex(0, 1);
        const zSquared = this.multiply(this);
        const oneMinusZSquared = (new Complex(1, 0)).subtract(zSquared);

        // Handle edge case where |z| ≈ 1 (e.g., z = 1 or z = -1)
        if (oneMinusZSquared.round().equals(new Complex(0),DISPLAY_THRESHOLD)) {
            return new Complex(Math.PI / 2 * Math.sign(this.real), 0);
        }

        const root = oneMinusZSquared.power(new Complex(0.5, 0));
        const inner = i.multiply(this).add(root);
        return i.negate().multiply(inner.naturalLog());
    }
    acos() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        const i = new Complex(0, 1);
        const zSquared = this.multiply(this);
        const oneMinusZSquared = (new Complex(1, 0)).subtract(zSquared);

        if (oneMinusZSquared.round().equals(new Complex(0),DISPLAY_THRESHOLD)) {
            return new Complex((this.real > 0) ? 0 : Math.PI, 0);
        }

        const root = oneMinusZSquared.power(new Complex(0.5));
        const inner = this.add(i.multiply(root));
        return i.negate().multiply(inner.naturalLog());
    }

    abs() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(this.imag===0){
            return new Complex(abs(this.real));
        }
        return new Complex(sqrt(this.real*this.real+this.imag*this.imag));
    }
    modulo(o) {
        if(this.isNaN()||o.isNaN()) return new Complex(NaN,NaN);
        if(abs(this.imag)<DISPLAY_THRESHOLD&&abs(o.imag)<DISPLAY_THRESHOLD){
            return new Complex(this.real-o.real*Math.floor(this.real/o.real));
        }
        return new Complex(NaN,NaN);
    }
    floor() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(abs(this.imag)<DISPLAY_THRESHOLD){
            return new Complex(floor(this.real));
        }
        return new Complex(NaN,NaN);
    }
    // distinct from this.round(); which is for precision purposes
    mathDotRound() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(abs(this.imag)<DISPLAY_THRESHOLD){
            return new Complex(round(this.real));
        }
        return new Complex(NaN,NaN);
    }
    ceil() {
        if(this.isNaN()) return new Complex(NaN,NaN);
        if(abs(this.imag)<DISPLAY_THRESHOLD){
            return new Complex(ceil(this.real));
        }
        return new Complex(NaN,NaN);
    }

    operation(s,b) {
        switch (s) {
            case '+': return this.add(b);
            case '-': return this.subtract(b);
            case '×': return this.multiply(b);
            case '÷': return this.divide(b);
            case '^': return this.power(b);
            case '√': return this.sqrt();
            case 'ln': return this.naturalLog();
            case '!': return this.factorial();
            case 'sin': return this.sin();
            case 'cos': return this.cos();
            case 'tan': return this.tan();
            case 'cot': return this.cot();
            case 'acos': return this.acos();
            case 'asin': return this.asin();
            case 'abs': return this.abs();
            case '%': return this.modulo(b);
            case 'floor': return this.floor();
            case 'round': return this.mathDotRound();
            case 'ceil': return this.ceil();
            default:
                console.log("Invalid operator char");
                return new Complex("Invalid operator char");
        }
    }
    
    getText(){
        if(typeof(this.real)==="string"&&this.imag===0){
            return "\""+this.real+"\"";
        }

        let txt = "";
        if(keyIsDown(32)){
            txt = this.real.toString()+"+"+this.imag.toString()+"i";
            fill(0,100,0);
        }
        else if(isNaN(this.real)||isNaN(this.imag)){
            txt = "🤯⁉️";
        }
        else if(this.equals(new Complex(Math.PI),DISPLAY_THRESHOLD)){
            txt = "π";
        }
        else if(this.equals(new Complex(Math.E),DISPLAY_THRESHOLD)){
            txt = "e";
        }
        else{
            let rounded = this.round(DISPLAY_THRESHOLD);
            if(abs(this.real)>DISPLAY_THRESHOLD) {
                txt = numToString(rounded.real);
            }
            if(abs(this.imag)>DISPLAY_THRESHOLD) {
                if(txt!==""&&rounded.imag>=0) {
                    txt += "+";
                }
                let sri = numToString(rounded.imag);
                if(sri!=="1"){
                    if(sri==="-1"){
                        txt += "-";
                    }
                    else{
                        txt += sri;
                    }
                }
                txt += "𝑖"; // or fallback to i
            }
            if(txt===""){
                txt = "0";
            }
        }
        return txt.replaceAll("Infinity", "∞");
    }

    getColor(){
        if(isNaN(this.real)||isNaN(this.imag||typeof(this.real)!=="number"||typeof(this.imag)!=="number")||!isFinite(this.real)||!isFinite(this.imag)){
            return color(120,120,120);
        }
        if(abs(this.imag)>DISPLAY_THRESHOLD){
            if(abs(this.real)>DISPLAY_THRESHOLD){
                return color(180,0,240);
            }
            else{
                return color(0,0,200);
            }
        }
        else{
            if(this.real>-DISPLAY_THRESHOLD){
                if(abs(this.real-round(this.real))<DISPLAY_THRESHOLD){
                    return color(0,0,0);
                }
                else{
                    return color(200,120,0);
                }
            }
            else{
                return color(255,0,100);
            }
        }
    }
}
