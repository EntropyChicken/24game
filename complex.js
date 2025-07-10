function numToString(x) {
	if (!Number.isFinite(x)) return x.toString(); // for Infinity, NaN
	// Fix to 11 decimal places, then remove trailing zeros and optional "."
	return parseFloat(x.toFixed(11)).toString();
}

class Complex {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    equals(other, threshold = EQUALITY_THRESHOLD) {
        return abs(this.real - other.real) < threshold && abs(this.imag - other.imag) < threshold;
    }

    round(threshold = DISPLAY_THRESHOLD) {
        let r = this.real, i = this.imag;
        if (abs(r - Math.round(r)) < threshold) r = Math.round(r);
        if (abs(i - Math.round(i)) < threshold) i = Math.round(i);
        return new Complex(r, i);
    }

    add(o) { return new Complex(this.real + o.real, this.imag + o.imag); }
    subtract(o) { return new Complex(this.real - o.real, this.imag - o.imag); }
    multiply(o) { return new Complex(this.real * o.real - this.imag * o.imag, this.real * o.imag + this.imag * o.real); }
    divide(o) {
        const d = o.real ** 2 + o.imag ** 2;
        if (d === 0) {
            return new Complex(NaN, NaN);
        }
        return new Complex((this.real * o.real + this.imag * o.imag) / d, (this.imag * o.real - this.real * o.imag) / d);
    }
    power(o) {
        let r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        let theta = Math.atan2(this.imag, this.real);
        let a = o.real;
        let b = o.imag;
        let modulus = Math.exp(a * Math.log(r) - b * theta);
        let angle = a * theta + b * Math.log(r);
        return new Complex(
            modulus * Math.cos(angle),
            modulus * Math.sin(angle)
        );
    }
    naturalLog(checkReal = false) {
        if (checkReal && this.round().imag === 0) {
            return new Complex(Math.log(this.real));
        }
        const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        const theta = Math.atan2(this.imag, this.real);
        return new Complex(Math.log(r), theta);
    }    
    exp() {
        const r = Math.exp(this.real);
        return new Complex(
            r * Math.cos(this.imag),
            r * Math.sin(this.imag)
        );
    }

    factorial() {
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

    sqrt() {
        return this.power(new Complex(0.5));
        // const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        // const realPart = Math.sqrt((r + this.real) / 2);
        // const imagPart = Math.sign(this.imag) * Math.sqrt((r - this.real) / 2);
        // return new Complex(realPart, imagPart);
    };

    // Sin(z) = (e^{i z} - e^{-i z}) / (2i)
    sin() {
        const i = new Complex(0, 1);
        const negI = new Complex(0, -1);
        const iz = i.multiply(this);
        const ePos = iz.exp();
        const eNeg = negI.multiply(this).exp();
        const numerator = ePos.subtract(eNeg);
        const denom = new Complex(0, 2);
        return numerator.divide(denom.multiply(i)); // divide by 2i
    };

    // Cos(z) = (e^{i z} + e^{-i z}) / 2
    cos() {
        const i = new Complex(0, 1);
        const negI = new Complex(0, -1);
        const iz = i.multiply(this);
        const ePos = iz.exp();
        const eNeg = negI.multiply(this).exp();
        return ePos.add(eNeg).divide(new Complex(2, 0));
    };

    // Tan(z) = sin(z) / cos(z)
    tan() {
        return this.sin().divide(this.cos());
    };

    // Cot(z) = cos(z) / sin(z)
    cot() {
        return this.cos().divide(this.sin());
    };

    // Acos(z) = -i * ln(z + sqrt(z^2 - 1))
    acos() {
        const one = new Complex(1, 0);
        const z2 = this.multiply(this);
        const insideSqrt = z2.subtract(one);
        const root = insideSqrt.sqrt();
        const sum = this.add(root);
        const ln = sum.naturalLog();
        const negI = new Complex(0, -1);
        return ln.multiply(negI);
    };
    
    getText(){
        let txt = "";
        fill(this.getColor());
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
            if (abs(this.imag)>DISPLAY_THRESHOLD) {
                if(txt!==""&&rounded.imag>=0) {
                    txt += "+";
                }
                if(numToString(rounded.imag)!=="1"){
                    txt += numToString(rounded.imag);
                }
                txt += "i";
            }
            if(txt===""){
                txt = "0";
            }
        }
        return txt;
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
