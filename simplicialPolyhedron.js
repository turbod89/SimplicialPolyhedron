const SimplicialPolyhedron = function () {

    const $ = SimplicialPolyhedron

    const isKey = a => (typeof a === 'string') || (typeof a === 'number')
    const isNum = a => (typeof a === 'number')
    const isObj = a => (typeof a === 'object') && !Array.isArray(a)
    const isArr = a => Array.isArray(a)
    const isFloatA = a => (a instanceof Float32Array) || (a instanceof Float64Array)
    const isUintA = a => (a instanceof Uint32Array) || (a instanceof Uint16Array) || (a instanceof Uint8Array)
    const isFun = a => typeof a === 'function'
    const isNull = a => a === null
    const L = a => Array.isArray(a) ? a.length : (typeof a === 'object' ? Object.keys(a).length : null)

    const a = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments))

    const coordinateNames = ['x', 'y', 'z', 't']
    const choose = (a, b) => {

        if (2 * b > a) {
            return choose(a, a - b)
        } else if (b < 0) {
            return 0
        }

        let s = 1
        for (let i = 0; i < b; i++) {
            s *= a - i
        }

        for (let i = 1; i < b; i++) {
            s /= i + 1
        }

        return s
    }

    let dimension = 2
    let env_dimension = 3
    let coordinates = new Float32Array()
    let maximalSimplexes = new Uint32Array()
    let bGeometry = null
    let bGeometryPointsMapping = null


    Object.defineProperties(this, {

        dimension: {
            enumerable: false,
            modificable: false,
            get: () => dimension,
        },

        coordinates: {
            enumerable: false,
            modificable: false,
            get: () => coordinates,
        },

        maximalSimplexes: {
            enumerable: false,
            modificable: false,
            get: () => maximalSimplexes,
        },

        length: {
            enumerable: false,
            modificable: false,
            value: function (dim) {
                if (dim === 0) {
                    return coordinates.length / env_dimension
                } else if (dim === dimension) {
                    return maximalSimplexes.length / (dimension + 1)
                }

                return 0
            },
        },

        envDimension: {
            enumerable: false,
            modificable: false,
            get: () => env_dimension,
        },

        THREE: {
            enumerable: false,
            modificable: false,
            get: () => $.THREE,
            set: function (a) {
                $.THREE = a
                return this
            },
        },

        getSimplexIndex: {
            enumerable: false,
            modificable: false,
            value: function (a) {
                const simplexDimension = a.length - 1
                if (simplexDimension === 0) {
                    return 0
                } else if (simplexDimension < 0) {
                    return -1
                } else if (simplexDimension > dimension) {
                    return -1
                }

                a.sort().reverse()

                let index = 0
                for (let i = 0, n = a.length; i < a.length; i++, n--) {
                    index += choose(a[i], n)
                }

                return index

            },
        },

        getCoordinates: {
            enumerable: false,
            modificable: false,
            value: function (a) {
                const simplexDimension = a.length - 1
                if (simplexDimension < 0) {
                    return null
                } else if (simplexDimension > dimension) {
                    return null
                }

                // observe that a could be a typed array.
                // in that case, map's return is expect to be
                // a number, not a typed array.
                // for this reason we use for loop
                let coords = []
                for (let i = 0; i < a.length; i++) {
                    coords.push(coordinates.subarray(a[i] * env_dimension, a[i] * env_dimension + env_dimension))
                }

                return coords

            },
        },

        buildGeometry: {
            enumerable: false,
            modificable: false,
            value: function () {

                if ( $.THREE === null || dimension !== 2 || env_dimension !== 3) {
                    return this
                }

                bGeometry = new $.THREE.BufferGeometry()
                bGeometryPointsMapping = new Uint32Array(this.length(dimension) * (dimension+1))

                const positions = new Float32Array(this.length(dimension) * (dimension+1) * env_dimension)
                const bAttr = new $.THREE.BufferAttribute(positions,env_dimension)
                bAttr.dynamic = true
                bGeometry.addAttribute('position',bAttr)
                bGeometry.computeVertexNormals()
                bGeometry.computeFaceNormals()

                this.forEachMaximalSimplex( (face, i) => {
                    face.forEach( (point,j) => {
                        bGeometryPointsMapping[i * (dimension + 1) + j] = point 
                    })
                })

                this.updateGeometry()
                return this
            }
        },

        'geometry': {
            enumerable: false,
            modificable: false,
            get: () => bGeometry
        },


        updateGeometry: {
            enumerable: false,
            modificable: false,
            value: function () {

                if ( $.THREE === null || dimension !== 2 || env_dimension !== 3) {
                    return this
                }

                bGeometryPointsMapping.forEach( (point,i) => {
                    for (let j = 0; j < env_dimension; j++) {
                        bGeometry.attributes.position.array[i *env_dimension + j]  = coordinates[point * env_dimension + j]
                    }
                })
                bGeometry.computeVertexNormals()
                bGeometry.computeFaceNormals()
                bGeometry.attributes.position.needsUpdate = true


                return this
            },
        },







        setCoordinates: {
            enumerable: false,
            modificable: false,
            value: function () {
                const a = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments))

                if (L(a) === 0) {
                    // do nothing at all
                } else if (L(a) > 1) {
                    // coordintes are given in the arguments
                    return this.setCoordinates(a)

                } else if (L(a) === 1) {
                    // coordinates are given in a array
                    if (L(a[0]) === 0) {
                        // do nothing at all
                    } else if (isFloatA(a[0]) && L(a[0]) % env_dimension === 0) {
                        // these are the coordinates
                        coordinates = a[0]
                    } else if (isArr(a[0]) && isNum(a[0][0]) && L(a[0]) % env_dimension === 0) {
                        // these are the coordinates
                        coordinates = new Float32Array(a[0])
                    } else if (isArr(a[0]) && isArr(a[0][0])) {
                        coordinates = new Float32Array(L(a[0]) * env_dimension)
                        a[0].forEach((p, i) => p.forEach((x, j) => coordinates[i * env_dimension + j] = x))
                    } else if (isArr(a[0]) && isObj(a[0][0])) {
                        coordinates = new Float32Array(L(a[0]) * env_dimension)
                        a[0].forEach((p, i) => coordinateNames.forEach((coordName, j) => coordinates[i * env_dimension + j] = p[coordName]))
                    } else {
                        console.error('Cannot interpret coordinates')
                    }
                } else {
                    console.error('Cannot interpret coordinates')
                }

                return this
            }
        },

        setMaximalSimplexes: {
            enumerable: false,
            modificable: false,
            value: function () {
                const a = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments))

                if (L(a) === 0) {
                    // do nothing at all
                } else if (L(a) > 1) {
                    // coordintes are given in the arguments
                    return this.setCoordinates(a)

                } else if (L(a) === 1) {
                    // coordinates are given in a array
                    if (L(a[0]) === 0) {
                        // do nothing at all
                    } else if (isUintA(a[0]) && L(a[0]) % (dimension + 1) === 0) {
                        // these are the coordinates
                        maximalSimplexes = a[0]
                    } else if (isArr(a[0]) && isNum(a[0][0]) && L(a[0]) % (dimension + 1) === 0) {
                        // these are the coordinates
                        maximalSimplexes = new Uint32Array(a[0])
                    } else if (isArr(a[0]) && isArr(a[0][0])) {
                        maximalSimplexes = new Uint32Array(L(a[0]) * (dimension+1))
                        a[0].forEach((f, i) => f.forEach((p, j) => maximalSimplexes[i * (dimension+1) + j] = p))

                    } else {
                        console.error('Cannot interpret maximal simplexes')
                    }
                } else {
                    console.error('Cannot interpret maximal simplexes')
                }

                return this
            }
        },

        forEachPoint: {
            enumerable: false,
            modificable: false,
            value: function (f) {
                for (let i = 0; i < coordinates.length; i += env_dimension) {
                    f(coordinates.subarray(i, i + env_dimension), i / env_dimension, this)
                }
                return this
            }
        },

        forEachMaximalSimplex: {
            enumerable: false,
            modificable: false,
            value: function (f) {
                for (let i = 0; i < maximalSimplexes.length; i += dimension + 1) {
                    f(maximalSimplexes.subarray(i, i + dimension + 1), i / (dimension + 1), this)
                }
                return this
            }
        },




        times: {
            enumerable: false,
            modificable: false,
            value: function (B) {
                const A = this
                const C = new SimplicialPolyhedron(A.dimension + B.dimension, A.envDimension + B.envDimension)

                // coordinates
                const coordsC = new Float32Array(A.length(0) * B.length(0) * C.envDimension)
                A.forEachPoint(
                    (pointCoordsA, i) => {
                        B.forEachPoint(
                            (pointCoordsB, j) => {
                                for (let k = 0; k < A.envDimension; k++) {
                                    coordsC[(i * B.length(0) + j) * C.envDimension + k] = pointCoordsA[k]
                                }
                                for (let k = A.envDimension; k < A.envDimension + B.envDimension; k++) {
                                    coordsC[(i * B.length(0) + j) * C.envDimension + k] = pointCoordsB[k - A.envDimension]
                                }
                            }
                        )
                    }
                )
                C.setCoordinates(coordsC)

                // maximal simplexes
                const N = choose(C.dimension, A.dimension)
                const maximalSimplexesC = new Uint32Array(
                    N *
                    A.length(A.dimension) *
                    B.length(B.dimension) *
                    (C.dimension + 1)
                )

                const pathRecursive = function (maximalSimplexA, maximalSimplexB, f) {
                    const n = maximalSimplexA.length - 1
                    const m = maximalSimplexB.length - 1
                    const path = new Array(n + m + 1)
                    let cnt = 0

                    const rec = (a, b, i, sgn) => {
                        path[i] = [maximalSimplexA[a], maximalSimplexB[b]]
                        if (i >= n + m) {
                            f(path, cnt, sgn)
                            cnt++
                            return
                        }

                        if (a < n) {
                            sgn *= b %2 === 1 ? -1 : 1
                            rec(a + 1, b, i + 1, sgn)
                        }
                        if (b < m) {
                            rec(a, b + 1, i + 1, sgn)
                        }
                    }

                    rec(0, 0, 0, 1)
                }

                A.forEachMaximalSimplex((maximalSimplexA, i) => {
                    B.forEachMaximalSimplex((maximalSimplexB, j) => {
                        pathRecursive(maximalSimplexA, maximalSimplexB, (path, k, sgn) => {
                            const maximalSimplexC = path.map(a => a[0] * B.length(0) + a[1])
                            maximalSimplexC.forEach((pointC, l) => {
                                maximalSimplexesC[((i * B.length(B.dimension) + j) * N + k) * (C.dimension + 1) + l] = pointC
                            })

                            if (sgn === -1 && (C.dimension + 1) >= 2) {
                                let a = maximalSimplexesC[((i * B.length(B.dimension) + j) * N + k) * (C.dimension + 1) + (C.dimension + 1) -1]
                                maximalSimplexesC[((i * B.length(B.dimension) + j) * N + k) * (C.dimension + 1) + (C.dimension + 1) -1] = maximalSimplexesC[((i * B.length(B.dimension) + j) * N + k) * (C.dimension + 1) + (C.dimension + 1) -2]
                                maximalSimplexesC[((i * B.length(B.dimension) + j) * N + k) * (C.dimension + 1) + (C.dimension + 1) -2] = a
                            }
                        })
                    })
                })
                C.setMaximalSimplexes(maximalSimplexesC)


                return C
            }
        },


        projectToEnvironment: {
            enumerable: false,
                modificable: false,
                value: function (newEnvDim,projection) {

                const newCoordinates = new Float32Array(this.length(0) * newEnvDim)
                this.forEachPoint( (coordinates,i) => {
                    const newPointCoordinates = projection(coordinates,i,this)
                    for (let j = 0; j < newEnvDim; j++) {
                        newCoordinates[i*newEnvDim + j] = newPointCoordinates[j]
                    }
                })

                coordinates = newCoordinates
                env_dimension = newEnvDim

                return this
            }
        },


    })

    /*
        Constructor
    */

    if (L(a) === 1 && isNum(a[0])) {
        dimension = a[0]
    } else if (L(a) === 2 && isNum(a[0]) && isNum(a[1])) {
        dimension = a[0]
        env_dimension = a[1]
    }

    return this
}

SimplicialPolyhedron.prototype = Object.create({}, {})

/*
*
*   Static
*
* */

Object.defineProperties(SimplicialPolyhedron, {
    THREE: {
        enumerable: true,
        modificable: true,
        value: this.THREE ? this.THREE : (THREE ? THREE : null)
    },

    Segment: {
        enumerable: false,
        modificable: false,
        value: function (a,b,n = 1) {
            const length = (Math.max(a,b) - Math.min(a,b)) / n
            const coords = new Float32Array(n+1)
            for (let i = 0; i < coords.length; i++) {
                coords[i] = Math.min(a,b) + i*length
            }
            const faces = new Uint32Array(2*n)
            for (let i = 0; i < n; i++) {
                faces[2*i] = i
                faces[2*i+1] = i+1
            }

            const segment = new SimplicialPolyhedron(1,1)
            segment
                .setCoordinates(coords)
                .setMaximalSimplexes(faces)

            return segment
        }
    },

    S1: {
        enumerable: false,
        modificable: false,
        value: function (R = 1,n = 3, startAngle = 0) {

            const coords = new Float32Array(2*n)
            for (let i = 0; i < n; i++) {
                coords[2*i] = R * Math.cos( i/n * 2 * Math.PI + startAngle)
                coords[2*i + 1] = R * Math.sin( i/n * 2 * Math.PI + startAngle)
            }

            const faces = new Uint32Array(2*n)
            for (let i = 0; i < n; i++) {
                faces[2*i] = i
                faces[2*i+1] = (i+1)%n
            }

            const s1 = new SimplicialPolyhedron(1,2)
            s1
                .setCoordinates(coords)
                .setMaximalSimplexes(faces)

            return s1
        }
    },


    TorusAlong: {
        enumerable: false,
        modificable: false,
        value: function (g,R = 1,n = 3, m = 3, startAngle = 0) {

            const normSq = v => v.reduce( (acc,curr) => acc + curr*curr,0)
            const norm = v => Math.sqrt(normSq(v))
            const dot = (v,w) => [0,1,2].reduce( (acc,i) => acc + v[i] * w[i],0)
            const mult = (scalar, v) => {
                v.forEach( (x,i) => v[i] *= scalar)
                return v
            }
            const vprod = (a,b) => [
                a[1]*b[2] - a[2]*b[1],
                a[2]*b[0] - a[0]*b[2],
                a[0]*b[1] - a[1]*b[0],
            ]

            const coords = new Float32Array(3*n*m)
            let lastN = null;
            for (let k = 0; k < n; k++) {
                const iprev = (k-1+n)%n
                const i = k%n
                const ipost = (k+1)%n

                const pprev= g(iprev/n)
                const p= g(i/n)
                const ppost= g(ipost/n)

                const tg = [0,1,2].map(j => (pprev[j]-ppost[j])/2)
                mult(1/norm(tg),tg)

                const N = [0,1,2].map(j => (pprev[j]+ppost[j])/2 - p[j])
                const nDotTg = dot(N,tg)
                N.forEach( (x,j) => N[j] -= tg[j]*nDotTg)
                mult(1/norm(N),N)
                if (lastN !== null && dot(N,lastN) < 0) {
                    mult(-1,N)
                }
                lastN = N

                const tau = vprod(tg,N)

                for (let j = 0; j < m; j++) {
                    for (let l = 0; l < 3; l++) {
                        coords[(i * m + j) * 3 + l] =
                            p[l]
                            + N[l] * R * Math.cos(j / m * 2 * Math.PI + startAngle)
                            + tau[l] * R * Math.sin(j / m * 2 * Math.PI + startAngle)
                    }
                }
            }

            const faces = new Uint32Array(3*2*n*m)
            for (let i = 0; i < n; i++) {
                const ip = (i+1)%n
                for (let j = 0; j < m; j++) {
                    const jp = (j+1)%m
                    faces[ ( (i*m+j)*2 + 0)*3+ 0] = i*m + j
                    faces[ ( (i*m+j)*2 + 0)*3+ 1] = i*m + jp
                    faces[ ( (i*m+j)*2 + 0)*3+ 2] = ip*m + jp

                    faces[ ( (i*m+j)*2 + 1)*3+ 0] = i*m + j
                    faces[ ( (i*m+j)*2 + 1)*3+ 1] = ip*m + jp
                    faces[ ( (i*m+j)*2 + 1)*3+ 2] = ip*m + j

                }
            }

            const torus = new SimplicialPolyhedron(2,3)
            torus
                .setCoordinates(coords)
                .setMaximalSimplexes(faces)

            return torus
        }
    },


})


/*
*
*   Include
*
* */

if (typeof define === 'function' && define.amd) {
    define('SimplicialPolyhedron', function () {
        return SimplicialPolyhedron;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplicialPolyhedron;
} else {
    window.SimplicialPolyhedron = SimplicialPolyhedron;
}