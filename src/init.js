// import { img } from "./img.png";
// import vertexShader from "./vertex.glsl";
// import fragmentShader from "./fragment.glsl";


function main() {
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = canvas.clientWidth * pixelRatio | 0;
        const height = canvas.clientHeight * pixelRatio | 0;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });

    const fov = 75;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 30;

    const scene = new THREE.Scene();

    const color = 0x000000;
    const intensity = 0.8;
    const light = new THREE.DirectionalLight(0xEEEE44, intensity);
    const light2 = new THREE.DirectionalLight(0x2222FF, 0.3);
    // const color2 = 0x9b6dff;
    const color2 = 0xf7c9c9;
    const light3 = new THREE.DirectionalLight(color2, 1);
    light.position.set(-1, 2, 4);
    light2.position.set(3, 2, 4);
    light3.position.set(10, 10, -1);
    scene.add(light);
    scene.add(light2);
    scene.add(light3);

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const GOLD = 0xFFD700;
    const material = new THREE.MeshPhongMaterial({ color: 0xFFD700 });

    var texture = THREE.ImageUtils.loadTexture('img.png');

    // const vertexShader = `
    //       varying vec3 vUv; 

    //       void main() {
    //         vUv = position; 

    //         vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    //         gl_Position = projectionMatrix * modelViewPosition; 
    //       }
    //     `

    // const vertexShader = `
    //     varying vec2 vUv;
    //     void main() {
    //       vUv = uv;
    //       gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    //     }
    //     `;

    // const fragmentShader = `
    //     void main() {
    //         gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    //     }
    // `

    const vertexShader =
        `
        precision mediump float;

        varying vec2 vUv;
        uniform float uTime;

        vec3 mod289(vec3 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
            return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
            return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r)
        {
            return 1.79284291400159 - 0.85373472095314 * r;
        }

        float snoise(vec3 v) {
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

            // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 =   v - i + dot(i, C.xxx) ;

            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //   x0 = x0 - 0.0 + 0.0 * C.xxx;
            //   x1 = x0 - i1  + 1.0 * C.xxx;
            //   x2 = x0 - i2  + 2.0 * C.xxx;
            //   x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

            // Permutations
            i = mod289(i);
            vec4 p = permute( permute( permute(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
            //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

            // Normalise gradients
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

            // Mix final noise value
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                            dot(p2,x2), dot(p3,x3) ) );
        }


        void main() {
            vUv = uv;

            vec3 pos = position;
            float noiseFreq = 3.5;
            float noiseAmp = 0.15; 
            vec3 noisePos = vec3(pos.x * noiseFreq + uTime, pos.y, pos.z);
            pos.z += snoise(noisePos) * noiseAmp;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
        }`

    const fragmentShader =
        `
        precision mediump float;

        varying vec2 vUv;
        uniform sampler2D uTexture;

        void main() {
            vec3 texture = texture2D(uTexture, vUv).rgb;
            gl_FragColor = vec4(texture, 1.);
        }`


    var shaderMat = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uTime: { value: 0.0 },
            uTexture: { value: new THREE.TextureLoader().load('img.png') }
        },
        wireframe: true,
        side: THREE.DoubleSide
    })
    // var shaderGeo = new THREE.PlaneGeometry(0.4, 0.6, 16, 16);
    var shaderGeo = new THREE.PlaneGeometry(5, 2, 128, 128);
    // const shaderGeo = new THREE.BoxGeometry(1, 1, 1);
    var backgroundMesh = new THREE.Mesh(shaderGeo, shaderMat);


    // var backgroundMesh = new THREE.Mesh(
    // new THREE.PlaneGeometry(2, 2, 0),
    // new THREE.MeshBasicMaterial({
    //     map: texture
    // }));

    // backgroundMesh.material.depthTest = false;
    // backgroundMesh.material.depthWrite = false;

    // Create your background scene
    var backgroundScene = new THREE.Scene();
    // var backgroundCamera = new THREE.PerspectiveCamera();
    const backgroundCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    backgroundCamera.position.z = 1;
    backgroundCamera.position.y = 0.2;
    backgroundScene.add(backgroundCamera);
    backgroundScene.add(backgroundMesh);
    // backgroundCamera.far = 100;

    // const cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);
    var side1 = new THREE.Object3D();
    var side2 = new THREE.Object3D();
    var circle = new THREE.Object3D();

    function addCubesAll() {
        addCube({ name: 'test', x: 0, y: 0, z: -3.6 });
        addCube({ name: 'test', x: 1.2, y: 0, z: -3.6 });
        addCube({ name: 'test', x: 2.4, y: 0, z: -3.6 });
        addCube({ name: 'test', x: 3.6, y: 0, z: -3.6 });
        addCube({ name: 'test', x: -1.2, y: 0, z: -3.6 });
        addCube({ name: 'test', x: -2.4, y: 0, z: -3.6 });
        addCube({ name: 'test', x: -3.6, y: 0, z: -3.6 });

        addCube({ name: 'test', x: 3.6, y: 0, z: 1.2 });
        addCube({ name: 'test', x: -3.6, y: 0, z: 1.2 });
        addCube({ name: 'test', x: 3.6, y: 0, z: -1.2 });
        addCube({ name: 'test', x: -3.6, y: 0, z: -1.2 });

        addCube({ name: 'test', x: 3.6, y: 0, z: 2.4 });
        addCube({ name: 'test', x: -3.6, y: 0, z: 2.4 });
        addCube({ name: 'test', x: 3.6, y: 0, z: -2.4 });
        addCube({ name: 'test', x: -3.6, y: 0, z: -2.4 });

        addCube({ name: 'test', x: 3.6, y: 0, z: 3.6 });
        addCube({ name: 'test', x: -3.6, y: 0, z: 3.6 });
        addCube({ name: 'test', x: 3.6, y: 0, z: -3.6 });
        addCube({ name: 'test', x: -3.6, y: 0, z: -3.6 });

        addCube({ name: 'test', x: 0, y: 0, z: 3.6 });
        addCube({ name: 'test', x: 1.2, y: 0, z: 3.6 });
        addCube({ name: 'test', x: 2.4, y: 0, z: 3.6 });
        addCube({ name: 'test', x: 3.6, y: 0, z: 3.6 });
        addCube({ name: 'test', x: -1.2, y: 0, z: 3.6 });
        addCube({ name: 'test', x: -2.4, y: 0, z: 3.6 });
        addCube({ name: 'test', x: -3.6, y: 0, z: 3.6 });

        scene.add(side1);
        scene.add(side2);
        side1.position.set(0, 0, -3);
        side2.position.set(0, 3.6, -3);
    }

    function addSpheresAll() {
        addSphere({ x: 0, y: 0.7, z: 0 });
        addSphere({ x: 0, y: -0.7, z: 0 });
        addSphere({ x: 0.7, y: 0, z: 0 });
        addSphere({ x: -0.7, y: 0, z: 0 });
        scene.add(circle);
        circle.position.set(0, 1.5, -1.5)
    }

    addCubesAll();
    addSpheresAll();

    function addCube(data) {
        var cube = new THREE.Mesh(geometry, material);
        cube.position.x = data.x
        cube.position.y = data.y
        cube.position.z = data.z
        cube.rotation.set(0, 0, 0);
        cube.name = data.name;
        side1.add(cube);

        var cube1 = new THREE.Mesh(geometry, material);
        cube1.position.x = data.x
        cube1.position.y = data.y
        cube1.position.z = data.z
        cube1.rotation.set(0, 0, 0);
        cube1.name = data.name;
        side2.add(cube1);
    }

    function addSphere(data) {
        var sgeo = new THREE.SphereGeometry(0.4, 32, 32);
        var smat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        var s = new THREE.Mesh(sgeo, smat);
        s.position.x = data.x;
        s.position.y = data.y;
        s.position.z = data.z;
        s.rotation.set(0, 0, 0);
        circle.add(s);
    }

    var pivot = new THREE.Group();
    scene.add(pivot);
    pivot.add(side1);
    pivot.position.set(0, 0, -30);

    var pivot1 = new THREE.Group();
    scene.add(pivot1);
    pivot.add(side2);

    var clock = new THREE.Clock();
    var timeTrack = clock.startTime;
    console.log(timeTrack)
    var interval = 1;
    var switcherX = 1;
    var switcherY = 1;
    var switcher = 1;
    var rotation = 0.4;


    function makeDrone(x, y, z) {
        var side = 0.5;
        var geometry = new THREE.BoxGeometry(side, side, side);
        var material = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        scene.add(mesh);
        return mesh;
    }

    function Drone(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.d = makeDrone(x, y, z);

        this.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        this.update = function () {
            const speed = 0.8;
            let dist_x = Math.abs(this.d.position.x - this.x);
            let dist_y = Math.abs(this.d.position.y - this.y);
            let dist_z = Math.abs(this.d.position.z - this.z);

            let dir_x = (this.d.position.x < this.x) ? 1 : -1;
            let dir_y = (this.d.position.y < this.y) ? 1 : -1;
            let dir_z = (this.d.position.z < this.z) ? 1 : -1;

            this.d.position.x += Math.min(speed, dist_x) * dir_x;
            this.d.position.y += Math.min(speed, dist_y) * dir_y;
            this.d.position.z += Math.min(speed, dist_z) * dir_z;
        }
    }

    var drones = [];
    for (let i = 0; i < 50; i++) {
        drones.push(new Drone(-3, 0, 0));
    }

    var drone_pos = [-5, -3, -20]

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    function flipSwitch() {
        if (getRandomInt(0, 1) == 1) {
            return 1
        } else {
            return -1
        }
    }

    function getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    function render(time) {
        time *= 0.001;  // convert time to seconds

        // cube.rotation.x = time;
        // cube.rotation.y = time;
        pivot.rotation.y += rotation;
        pivot1.rotation.y += 0.6;
        pivot.rotation.x += 0.001;
        circle.rotation.z += 0.6;
        // circle.rotation.y += 0.1;
        shaderMat.uniforms.uTime.value = clock.getElapsedTime();
        if (clock.getElapsedTime() - timeTrack > interval) {
            timeTrack = clock.getElapsedTime();
            drone_pos = [getRandomInt(-20, 20), getRandomInt(-10, 10), getRandomInt(-20, -10)]
            switcherX = flipSwitch();
            switcherY = flipSwitch();
            switcher *= -1;
            interval = getRandomArbitrary(1, 2)
            rotation = getRandomArbitrary(0.01, 1.5);
            pivot.position.set(drone_pos[0], drone_pos[1], drone_pos[2] + getRandomInt(-20, 20))
        }

        resizeRendererToDisplaySize(renderer);

        // var h = rmapped * 0.1 % 1;
        // light.color.setHSL(h, 1.0, 1.0);
        // rmapped++;
        light.intensity += 0.05 * Math.sin(time * 2)

        drones.forEach((d, ndx) => {
            d.set(
                switcher * ndx + drone_pos[0] + 2 * Math.cos(time + ndx * 100),
                switcher * 0.5 * ndx + drone_pos[1] + Math.cos(ndx + time) + Math.cos(time * 4),
                drone_pos[2] + Math.sin(ndx + time))
            d.update();
        })

        renderer.autoClear = false;
        renderer.clear();
        renderer.render(backgroundScene, backgroundCamera);
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}

main();
