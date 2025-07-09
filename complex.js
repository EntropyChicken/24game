
class Complex {
	constructor(real, imag = 0) {
		this.real = real;
		this.imag = imag;
	}

	equals(other,threshold=EQUALITY_THRESHOLD) {
		return abs(this.real - other.real) < threshold && abs(this.imag - other.imag) < threshold;
	}

	round(threshold=DISPLAY_THRESHOLD) {
		let r = this.real, i = this.imag;
		if (abs(r - Math.round(r)) < threshold) r = Math.round(r);
		if (abs(i - Math.round(i)) < threshold) i = Math.round(i);
		return new Complex(r, i);
	}

	add(o) { return new Complex(this.real + o.real, this.imag + o.imag); }
	subtract(o) { return new Complex(this.real - o.real, this.imag - o.imag); }
	multiply(o) { return new Complex(this.real*o.real - this.imag*o.imag, this.real*o.imag + this.imag*o.real); }
	divide(o) {
		const d = o.real**2 + o.imag**2;
        if(d===0){
            return new Complex(NaN, NaN);
        }
		return new Complex((this.real*o.real + this.imag*o.imag)/d, (this.imag*o.real - this.real*o.imag)/d);
	}
    power(o) {
        // for w = a+bi, z^w = e^(a*ln|z| - b*arg(z)) * (cos(a*arg(z) + b*ln|z|) + i*sin(a*arg(z) + b*ln|z|))
        let r = sqrt(this.real * this.real + this.imag * this.imag);
        let theta = atan2(this.imag, this.real);
        let a = o.real;
        let b = o.imag;

        let modulus = exp(a * log(r) - b * theta);
        let angle = a * theta + b * log(r);

        return new Complex(
            modulus * cos(angle),
            modulus * sin(angle)
        );
    }
    naturalLog(checkReal=false) {
        if(checkReal&&this.round().imag===0){
            return new Complex(log(this.real));
        }
        const r = sqrt(this.real * this.real + this.imag * this.imag); // modulus
        const theta = atan2(this.imag, this.real); // argument
        return new Complex(log(r), theta);
    }

}
