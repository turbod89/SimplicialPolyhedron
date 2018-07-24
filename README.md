# Simplicial Polyhedron
### What is it?
It's a JS class that allows you to work with a simplicial polyhedron.

Furthermore it allowes to connect to THREE.js and manage buffer geometries as easy as just manipulate the polyhedron.

## Methods
### Constructor
```javascript
const p = new SimplicialPolyhedron(dim = 2, envDim = 3)
```
where
- `dim` stands for the dimension of the polyhedron
- `envDim` stands for the dimension of the Euclidian space where polyhedron is embedded.

*Working* Actually, only works for dimension 0 and maximal dimension.

### length
```javascript
p.length(dim)
```
Returns the number of simplexes of dimension `dim`.
    
### getCoordinates
```javascript
p.getCoordinates(simplex)
```
where `simplex = [p0,p1,...,pn]` is an array containing the points that define the n-simplex.

Returns an array of length `(n+1)*envDim` with a copy of the coordinates of the simplex's points.

### setCoordinates
```javascript
p.setCoordinates(...)
```
Set the points and their coordinates. Examples are auto-explicative about the argument format.

The following examples set the same points of a square:
```javascript
p.setCoordinates([[0,0],[1,0],[0,1],[1,1]])
p.setCoordinates([0,0],[1,0],[0,1],[1,1])
p.setCoordinates([0,0,1,0,0,1,1,1])
p.setCoordinates(0,0,1,0,0,1,1,1)
p.setCoordinates([{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}])
p.setCoordinates({x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1})
```

### setMaximalSimplexes
```javascript
p.setMaximalSimplexes(...)
```
Set the maximal simplexes of the polyhedron. Examples are auto-explicative about the argument format.

With points as example above, the following examples set the same two 2-simplexes that triangulate an square:
```javascript
p.setMaximalSimplexes([[0,1,3],[0,3,2]])
p.setMaximalSimplexes([0,1,3],[0,3,2])
p.setMaximalSimplexes([0,1,3,0,3,2])
p.setMaximalSimplexes(0,1,3,0,3,2)
```

### forEachPoint
```javascript
p.forEachPoint( (X,point,p) => {} )
```
Loop over points and for each one calls back a callback function passed as argument.
Callback function expects three parameters
- Coordinates of the point
- The point (i.e. a number)
- The polihedron itself
Examples:
```javascript
p.forEachPoint( (X,point) => console.log('Point '+p+' has coordinates', X))
```
```javascript
// translation
const t = [2,-1,4]
p.forEachPoint( X => t.forEach( (x,i) => X[i] += x))
```
```javascript
// twist
p.forEachPoint( X => {
    const x = X[0]
    X[0] = X[1]
    X[1] = x
})
```


  