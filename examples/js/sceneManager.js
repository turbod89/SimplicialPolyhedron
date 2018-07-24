const SceneManager = function (canvas = null) {

    const clock = new THREE.Clock()
    const scenes = {}
    const cameras = {}
    const steps = {}
    const renderer = canvas === null ?
            new THREE.WebGLRenderer({antialias: true})
        :
            new THREE.WebGLRenderer({canvas,antialias: true});

    if (canvas === null) {
        canvas = renderer.domElement
        document.body.appendChild(canvas)
    }
    
    let status = 0
    let selectedScene = null
    let selectedCamera = null
    
    this.schedule = []

    const resize = function () {

        renderer.setSize(renderer.domElement.offsetWidth, renderer.domElement.offsetHeight);
        renderer.setPixelRatio(devicePixelRatio)

        for (let name in cameras) {
            const camera = cameras[name]
            camera.aspect = renderer.domElement.width / renderer.domElement.height
            camera.updateProjectionMatrix()
        }
    }

    const step = () => {
        const t = clock.getElapsedTime()
        this.schedule.forEach( stepName => steps[stepName](t,scenes[selectedScene], cameras[selectedCamera], this) )
        renderer.render(scenes[selectedScene], cameras[selectedCamera]);
        
        if (status === 1) {
            requestAnimationFrame(step)
        }
    }

    Object.defineProperties(this, {
        'start': {
            enumerable: false,
            value: function () {
                status = 1
                step()
            }
        },

        'stop': {
            enumerable: false,
            value: function () {
                status = 0
            }
        },

        'step': {
            enumerable: false,
            value: function () {
                step()
            }
        },

        
        'registerScene': {
            enumerable: false,
            value: function (name,onInit = null) {
                scenes[name] = new THREE.Scene()

                if (selectedScene === null) {
                    selectedScene = name
                }

                if (typeof onInit === 'function') {
                    onInit(scenes[name],this)
                }
                return this
            }
        },
        
        
        'registerCamera': {
            enumerable: false,
            value: function (name,options, onInit = null) {
                const {fov = 50, aspect = renderer.domElement.width / renderer.domElement.height, near = 1, far = 1000, scene = selectedScene} = options
                
                cameras[name] = new THREE.PerspectiveCamera(fov,aspect,near,far)
                cameras[name]['name'] = name

                if (scene in scenes) {
                    scenes[scene].add(cameras[name])
                }
                
                if (selectedCamera === null) {
                    selectedCamera = name
                }

                if (typeof onInit === 'function') {
                    onInit(cameras[name],this)
                }
                return this
            }
        },

        'getScene': {
            enumerable: false,
            value: function (name) {
                return scenes[name]
            }
        },

        'getCurrentScene': {
            enumerable: false,
            value: function () {
                return scenes[selectedScene]
            }
        },

        'getScenes': {
            enumerable: false,
            value: function (name) {
                return Object.keys(scenes)
            }
        },
        
        'getCamera': {
            enumerable: false,
            value: function (name) {
                return cameras[name]
            }
        },

        'getCurrentCamera': {
            enumerable: false,
            value: function () {
                return cameras[selectedCamera]
            }
        },

        'getCameras': {
            enumerable: false,
            value: function (name) {
                return Object.keys(cameras)
            }
        },

        'selectScene': {
            enumerable: false,
            value: function (name) {
                selectedScene = name
            }
        },
        
        'selectCamera': {
            enumerable: false,
            value: function (name) {
                selectedCamera = name
            }
        },

        'selectedScene': {
            enumerable: true,
            get: function () {
                return selectedScene
            }
        },
        
        'selectedCamera': {
            enumerable: true,
            get: function () {
                return selectedCamera
            }
        },

        'renderer': {
            enumerable: true,
            get: function () {
                return renderer
            }
        },

        'registerStep': {
            enumerable: false,
            value: function (name,f) {
                steps[name] = f
                return this
            }
        }
    })





    //
    //  Constructor
    //


    resize()
    window.addEventListener('resize', resize,false)

}