# Simplicial Polyhedron
### What is it?
It's a JS class that allows you to work with a simplicial polyhedron.

Further more it allowes to connect to THREE.js and manage buffer geometries as easy as just manipulate the polyhedron.

## Methods
- ### Constructor
    ```javascript
    const p = new SimplicialPolyhedron(dim = 2, envDim = 3)
    ```
    where
    - `dim` stands for the dimension of the polyhedron
    - `envDim` stands for the dimension of the Euclidian space where polyhedron is embedded.
    
    *Working* Actually, only works for dimension 0 and maximal dimension.

- ### length
    ```javascript
    p.length(dim)
    ```
    Returns the number of simplexes of dimension `dim`.
- ### getCoordinates
    ```javascript
    p.getCoordinates()
    ```
    Returns the `Float32Array` with the coordinates of all points.