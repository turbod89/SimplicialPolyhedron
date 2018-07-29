const BucherTableaux = function (n) {
    const order = n;

    this.a = new Float32Array(n*n);
    this.b = new Float32Array(n);
    this.c = new Float32Array(n);


    Object.defineProperties(this,{
        'order': {
            enumerable: true,
            modificable: false,
            get: () => order,
        },

        'makeItConsistent': {
            enumerable: true,
            modificable: false,
            writable: false,
            value: function () {

                for (let i = 0; i < this.order; i++) {
                    this.c[i] = 0;
                    for (let j = 0; j < this.order; j++) {
                        this.c[i] += this.a[i*this.order + j];
                    }
                }

                return this;
            }
        },

        'makeItBinomial': {
            enumerable: true,
            modificable: false,
            writable: false,
            value: function () {

                this.b[0] = 1;

                for (let i = 1; i < this.order; i++) {
                    this.b[i] = this.b[i-1];
                    for (let j = i -1; j > 0; j--) {
                        this.b[j] += this.b[j-1];
                    }
                }

                this.b.forEach( (value,i) => this.b[i] = 1/value);

                return this;
            }
        },
    });

};

Object.defineProperties(BucherTableaux, {
    'RK4': {
        enumerable: true,
        modificable: false,
        get: function () {

            const RK4 = new BucherTableaux(4);
            RK4.a[1 * RK4.order + 0] = 0.5;

            RK4.a[2 * RK4.order + 1] = 0.5;
            RK4.a[3 * RK4.order + 2] = 1;
            RK4.makeItConsistent();
            RK4.b[0] = 1.0/3;
            RK4.b[1] = 1.0/6;
            RK4.b[2] = 1.0/6;
            RK4.b[3] = 1.0/3;

            return RK4;

        },
    },
});

BucherTableaux.prototype.inspect = function(depth, opts) {
    let s = 'Butcher Matrix';

    return s;
};



/*
*
* @param p Simplicial Polyhedron
* @param bt Butcher Tableaux
*
* */

const RKDynamics = function (p,bt) {

    /*
    *
    * */

    // tools
    const module2 = a => a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
    const module = a => Math.sqrt(module2(a));
    const d2 = (a,b) => (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) + (a[2]-b[2])*(a[2]-b[2]);
    const d = (a,b) => Math.sqrt(d2(a,b));
    const clear = a => {
        a[0] = 0;
        a[1] = 0;
        a[2] = 0;
        return a;
    };
    const copy = (a,b) => {
        b.forEach((x, i) => a[i] = x)
        return a;
    };
    const add = (a,b) => {
        b.forEach( (x,i) => a[i] += x)
        return a
    };
    const subs = (a,b) => {
        a[0] -= b[0];
        a[1] -= b[1];
        a[2] -= b[2];
        return a
    };
    const mult = (lambda,a) => {
        a.forEach((x, i) => a[i] = lambda * x)
        return a
    };
    const addMult = (a,lambda,b) => {
        b.forEach( (x,i) => a[i] += lambda * x)
        return a
    };
    const getMult = (lambda,a) => [
        a[0] * lambda,
        a[1] * lambda,
        a[2] * lambda,
    ];
    const getDiff = (a,b) => [
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
    ];


    let l = p.length(0);
    const envDim = p.envDimension;

    const positions = Array(bt.order).fill(0).map ( i => i === 0 ? p.coordinates : new Float32Array(envDim * l));
    const velocities = Array(bt.order).fill(0).map ( i => new Float32Array(envDim * l));
    const accelerations = Array(bt.order).fill(0).map ( i => new Float32Array(envDim * l));

    const tempPositions = new Float32Array(envDim * l);
    const tempVelocities = new Float32Array(envDim * l);

    const tempPhysicProperties = new Array(l);

    p.forEachPoint((x, point) => {
        tempPhysicProperties[point] = {
            x: tempPositions.subarray(envDim * point, envDim * point + envDim),
            dx: tempVelocities.subarray(envDim * point, envDim * point + envDim),
            mass: 1 / l,
        }
    });

    const K = n => (h,t) => {

        copy(tempPositions,positions[0]);
        copy(tempVelocities,velocities[0]);

        for (let m = 0; m < bt.order; m++) {
            //
            // on explicit methods, if m >= n, a := 0
            //
            if (bt.a[ n * bt.order + m] !== 0) {
                addMult(tempPositions, h*bt.a[ n * bt.order + m], velocities[m]);
                addMult(tempVelocities, h*bt.a[ n * bt.order + m], accelerations[m]);
            }
        }

        p.forEachPoint ( (x,point) => {
            const acc = accelerations[n].subarray(envDim * point, envDim * point + envDim);
            this.force(acc, point, t + bt.c[n] * h, tempPhysicProperties);
            mult(1/tempPhysicProperties[point].mass,acc);
        });
        copy(velocities[n],tempVelocities);

    };


    Object.defineProperties(this, {

        'force': {
            enumerable: true,
            modificable: true,
            writable: true,
            value: function (targetForce, point, t, physicProperties) {
                return this;
            },
        },

        'step': {
            enumerable: true,
            modificable: false,
            writable: false,
            value: function (h,t) {

                for (let i = 0; i < bt.order; i++) {
                    K(i)(h,t);
                }

                for (let i = 0; i < bt.order; i++) {
                    addMult(positions[0],h*bt.b[i],velocities[i]);
                    addMult(velocities[0],h*bt.b[i],accelerations[i]);
                }

                return this;

            }
        }
    })
};

