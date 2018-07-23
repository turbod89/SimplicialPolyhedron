const SimplicialPolyhedron = function () {

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
    let THREE = null
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
            get: () => THREE,
            set: function (a) {
                THREE = a
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

                if ( THREE === null || dimension != 2 || env_dimension != 3) {
                    return this
                }

                bGeometry = new THREE.BufferGeometry()
                bGeometryPointsMapping = new Uint32Array(this.length(dimension) * (dimension+1))

                const positions = new Float32Array(this.length(dimension) * (dimension+1) * env_dimension)
                const bAttr = new THREE.BufferAttribute(positions,env_dimension)
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

        getGeometry: {
            enumerable: false,
            modificable: false,
            value: function (B) {

                return bGeometry
            }
        },


        updateGeometry: {
            enumerable: false,
            modificable: false,
            value: function () {

                if ( THREE === null || dimension != 2 || env_dimension != 3) {
                    return this
                }

                bGeometryPointsMapping.forEach( (point,i) => {
                    for (let j = 0; j < env_dimension; j++) {
                        bGeometry.attributes.position.array[i *env_dimension + j]  = coordinates[point * env_dimension + j]
                    }
                })
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
                    } else if (isFloatA(a) && L(a) % env_dimension === 0) {
                        // these are the coordinates
                        coordinates = a[0]
                    } else if (isArr(a) && isNum(a[0][0]) && L(a[0]) % env_dimension === 0) {
                        // these are the coordinates
                        coordinates = new Float32Array(a[0])
                    } else if (isArr(a) && isArr(a[0][0])) {
                        coordinates = new Float32Array(L(a[0]) * env_dimension)
                        a[0].forEach((p, i) => p.forEach((x, j) => coordinates[i * env_dimension + j] = x))
                    } else if (isArr(a) && isObj(a[0][0])) {
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
                    } else if (isUintA(a) && L(a) % (dimension + 1) === 0) {
                        // these are the coordinates
                        maximalSimplexes = a[0]
                    } else if (isArr(a) && isNum(a[0][0]) && L(a[0]) % (dimension + 1) === 0) {
                        // these are the coordinates
                        maximalSimplexes = new Uint32Array(a[0])
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
                            sgn *= b %2 == 1 ? -1 : 1
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

                            if (sgn == -1 && (C.dimension + 1) >= 2) {
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

if (typeof define === 'function' && define.amd) {
    define('SimplicialPolyhedron', function () {
        return SimplicialPolyhedron;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimplicialPolyhedron;
} else {
    window.SimplicialPolyhedron = SimplicialPolyhedron;
}