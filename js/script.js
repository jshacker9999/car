if (!Detector.webgl) Detector.addGetWebGLMessage();

var FOLLOW_CAMERA = false;

var MARGIN = 100;

var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

var SHADOW_MAP_WIDTH = 1024,
    SHADOW_MAP_HEIGHT = 1024;

var CUBE_HEIGHT = 0;

var container, stats;

var camera, scene, renderer;
var renderTarget, renderTargetParameters;

var spotLight, ambientLight;

var cubeCamera;

var oldTime = new Date().getTime();

var controlsGallardo = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};

var controlsVeyron = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};

var mlib;

var gallardo, veyron, currentCar;

var effectDirt, hblur, vblur, effectBloom, effectKeep, effectBlend, effectFXAA;

var config = {
    "veyron": {
        r: 0.5,
        model: null,
        backCam: new THREE.Vector3(550, 100, -1000)
    },
    "gallardo": {
        r: 0.35,
        model: null,
        backCam: new THREE.Vector3(550, 0, -1500)
    }
};

var flareA, flareB;
var sprites = [];

var ground, groundBasic;

var blur = false;

var v = 0.9,
    vdir = 1;

init();
animate();

function init() {

    container = document.getElementById('container');

    // SCENE CAMERA

    camera = new THREE.Camera(18, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 100000);
    camera.position.set(2000, 0, 2000);

    // SCENE

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0xffffff, 3000, 10000);
    scene.fog.color.setHSV(0.51, 0.5, 0.9);

    createScene();

    // LIGHTS

    ambientLight = new THREE.AmbientLight(0x555555);
    scene.add(ambientLight);

    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 1800, 1500);
    spotLight.target.position.set(0, 0, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);

    directionalLight2 = new THREE.PointLight(0xff9900, 0.25);
    directionalLight2.position.set(0.5, -1, 0.5);
    //directionalLight2.position.normalize();
    //scene.add( directionalLight2 );

    // RENDERER

    renderer = new THREE.WebGLRenderer({
        antialias: false
    });

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    renderer.setClearColor(scene.fog.color, 1);

    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = MARGIN + "px";
    renderer.domElement.style.left = "0px";

    container.appendChild(renderer.domElement);

    // SHADOW

    renderer.shadowCameraNear = 2;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;

    renderer.shadowMapBias = 0.003885;
    renderer.shadowMapDarkness = 0.55;
    renderer.shadowMapWidth = SHADOW_MAP_WIDTH;
    renderer.shadowMapHeight = SHADOW_MAP_HEIGHT;

    renderer.shadowMapEnabled = true;
    //renderer.shadowMapSoft = false;

    // STATS

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild(stats.domElement);

    stats.domElement.children[0].children[0].style.color = "#888";
    stats.domElement.children[0].style.background = "#000";
    stats.domElement.children[0].children[1].style.display = "none";

    // CUBE CAMERA

    cubeCamera = new THREE.CubeCamera(1, 100000, CUBE_HEIGHT, 128);

    // MATERIALS

    var cubeTarget = cubeCamera.renderTarget;

    mlib = {

        body: [],

        "Chrome": new THREE.MeshLambertMaterial({
            color: 0xffffff,
            envMap: cubeTarget
        }),
        "ChromeN": new THREE.MeshLambertMaterial({
            color: 0xffffff,
            envMap: cubeTarget,
            combine: THREE.MixOperation,
            reflectivity: 0.75
        }),
        "Dark chrome": new THREE.MeshLambertMaterial({
            color: 0x444444,
            envMap: cubeTarget
        }),

        "Black rough": new THREE.MeshLambertMaterial({
            color: 0x050505
        }),

        "Dark glass": new THREE.MeshLambertMaterial({
            color: 0x101020,
            envMap: cubeTarget,
            opacity: 0.5,
            transparent: true
        }),
        "Orange glass": new THREE.MeshLambertMaterial({
            color: 0xffbb00,
            opacity: 0.5,
            transparent: true
        }),
        "Red glass": new THREE.MeshLambertMaterial({
            color: 0xff0000,
            opacity: 0.5,
            transparent: true
        }),

        "Black metal": new THREE.MeshLambertMaterial({
            color: 0x222222,
            envMap: cubeTarget,
            combine: THREE.MultiplyOperation
        }),
        "Orange metal": new THREE.MeshLambertMaterial({
            color: 0xff6600,
            envMap: cubeTarget,
            combine: THREE.MultiplyOperation
        })

    }

    mlib.body.push(["Orange", new THREE.MeshLambertMaterial({
        color: 0x883300,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.1
    })]);
    mlib.body.push(["Blue", new THREE.MeshLambertMaterial({
        color: 0x113355,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.1
    })]);
    mlib.body.push(["Red", new THREE.MeshLambertMaterial({
        color: 0x660000,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.1
    })]);
    mlib.body.push(["Black", new THREE.MeshLambertMaterial({
        color: 0x000000,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.2
    })]);
    mlib.body.push(["White", new THREE.MeshLambertMaterial({
        color: 0xffffff,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.2
    })]);

    mlib.body.push(["Carmine", new THREE.MeshPhongMaterial({
        color: 0x770000,
        specular: 0xffaaaa,
        envMap: cubeTarget,
        combine: THREE.MultiplyOperation
    })]);
    mlib.body.push(["Gold", new THREE.MeshPhongMaterial({
        color: 0xaa9944,
        specular: 0xbbaa99,
        shininess: 50,
        envMap: cubeTarget,
        combine: THREE.MultiplyOperation
    })]);
    mlib.body.push(["Bronze", new THREE.MeshPhongMaterial({
        color: 0x150505,
        specular: 0xee6600,
        shininess: 10,
        envMap: cubeTarget,
        combine: THREE.MixOperation,
        reflectivity: 0.2
    })]);
    mlib.body.push(["Chrome", new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        envMap: cubeTarget,
        combine: THREE.MultiplyOperation
    })]);

    // FLARES

    flareA = THREE.ImageUtils.loadTexture("images/lensflare2.jpg");
    flareB = THREE.ImageUtils.loadTexture("images/lensflare0.png");

    // CARS - VEYRON

    veyron = new THREE.Car();

    veyron.modelScale = 3;
    veyron.backWheelOffset = 2;

    veyron.callback = function (object) {

        addCar(object, -300, -215, 0, 0);
        setMaterialsVeyron(object);

        var sa = 2,
            sb = 5;

        var params = {

            "a": {
                map: flareA,
                useScreenCoordinates: false,
                color: 0xffffff,
                blending: THREE.AdditiveBlending
            },
            "b": {
                map: flareB,
                useScreenCoordinates: false,
                color: 0xffffff,
                blending: THREE.AdditiveBlending
            },

            "ar": {
                map: flareA,
                useScreenCoordinates: false,
                color: 0xff0000,
                blending: THREE.AdditiveBlending
            },
            "br": {
                map: flareB,
                useScreenCoordinates: false,
                color: 0xff0000,
                blending: THREE.AdditiveBlending
            }

        };

        var flares = [ // front
            ["a", sa, [47, 38, 120]],
            ["a", sa, [40, 38, 120]],
            ["a", sa, [32, 38, 122]],
            ["b", sb, [47, 38, 120]],
            ["b", sb, [40, 38, 120]],
            ["b", sb, [32, 38, 122]],

            ["a", sa, [-47, 38, 120]],
            ["a", sa, [-40, 38, 120]],
            ["a", sa, [-32, 38, 122]],
            ["b", sb, [-47, 38, 120]],
            ["b", sb, [-40, 38, 120]],
            ["b", sb, [-32, 38, 122]],

            // back
            ["ar", sa, [22, 50, -123]],
            ["ar", sa, [32, 49, -123]],
            ["br", sb, [22, 50, -123]],
            ["br", sb, [32, 49, -123]],

            ["ar", sa, [-22, 50, -123]],
            ["ar", sa, [-32, 49, -123]],
            ["br", sb, [-22, 50, -123]],
            ["br", sb, [-32, 49, -123]],

        ];

        for (var i = 0; i < flares.length; i++) {

            var p = params[flares[i][0]];

            var s = flares[i][1];

            var x = flares[i][2][0];
            var y = flares[i][2][1];
            var z = flares[i][2][2];

            var sprite = new THREE.Sprite(p);

            sprite.scale.set(s, s, s);
            sprite.position.set(x, y, z);

            object.bodyMesh.add(sprite);

            sprites.push(sprite);

        }

        checkStatus();

    };

    veyron.loadPartsBinary("js/veyron_body_bin.js", "js/veyron_wheel_bin.js");

    // CARS - GALLARDO

    gallardo = new THREE.Car();

    gallardo.modelScale = 2;
    gallardo.backWheelOffset = 45;

    gallardo.callback = function (object) {

        addCar(object, 300, -110, 0, -110);
        setMaterialsGallardo(object);

        var sa = 2,
            sb = 5;

        var params = {

            "a": {
                map: flareA,
                useScreenCoordinates: false,
                color: 0xffffff,
                blending: THREE.AdditiveBlending
            },
            "b": {
                map: flareB,
                useScreenCoordinates: false,
                color: 0xffffff,
                blending: THREE.AdditiveBlending
            },

            "ar": {
                map: flareA,
                useScreenCoordinates: false,
                color: 0xff0000,
                blending: THREE.AdditiveBlending
            },
            "br": {
                map: flareB,
                useScreenCoordinates: false,
                color: 0xff0000,
                blending: THREE.AdditiveBlending
            }

        };

        var flares = [ // front
            ["a", sa, [70, 10, 160]],
            ["a", sa, [66, -1, 175]],
            ["a", sa, [66, -1, 165]],
            ["b", sb, [70, 10, 160]],
            ["b", sb, [66, -1, 175]],
            ["b", sb, [66, -1, 165]],

            ["a", sa, [-70, 10, 160]],
            ["a", sa, [-66, -1, 175]],
            ["a", sa, [-66, -1, 165]],
            ["b", sb, [-70, 10, 160]],
            ["b", sb, [-66, -1, 175]],
            ["b", sb, [-66, -1, 165]],

            // back
            ["ar", sa, [61, 19, -185]],
            ["ar", sa, [55, 19, -185]],
            ["br", sb, [61, 19, -185]],
            ["br", sb, [55, 19, -185]],

            ["ar", sa, [-61, 19, -185]],
            ["ar", sa, [-55, 19, -185]],
            ["br", sb, [-61, 19, -185]],
            ["br", sb, [-55, 19, -185]],
        ];


        for (var i = 0; i < flares.length; i++) {

            var p = params[flares[i][0]];

            var s = flares[i][1];

            var x = flares[i][2][0];
            var y = flares[i][2][1];
            var z = flares[i][2][2];

            var sprite = new THREE.Sprite(p);

            sprite.scale.set(s, s, s);
            sprite.position.set(x, y, z);

            object.bodyMesh.add(sprite);

            sprites.push(sprite);

        }

        checkStatus();

    };

    gallardo.loadPartsBinary("js/gallardo_body_bin.js", "js/gallardo_wheel_bin.js");

    //

    config["gallardo"].model = gallardo;
    config["veyron"].model = veyron;

    currentCar = gallardo;

    // EVENTS

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    window.addEventListener('resize', onWindowResize, false);

    // POSTPROCESSING

    renderer.autoClear = false;

    renderTargetParameters = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBufer: false
    };
    renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);

    effectSave = new THREE.SavePass(new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters));

    effectBlend = new THREE.ShaderPass(THREE.ShaderExtras["blend"], "tDiffuse1");

    effectFXAA = new THREE.ShaderPass(THREE.ShaderExtras["fxaa"]);
    var effectVignette = new THREE.ShaderPass(THREE.ShaderExtras["vignette"]);
    var effectBleach = new THREE.ShaderPass(THREE.ShaderExtras["bleachbypass"]);
    effectBloom = new THREE.BloomPass(0.75);

    effectFXAA.uniforms['resolution'].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);

    // tilt shift

    hblur = new THREE.ShaderPass(THREE.ShaderExtras["horizontalTiltShift"]);
    vblur = new THREE.ShaderPass(THREE.ShaderExtras["verticalTiltShift"]);

    var bluriness = 7;

    hblur.uniforms['h'].value = bluriness / SCREEN_WIDTH;
    vblur.uniforms['v'].value = bluriness / SCREEN_HEIGHT;

    if (FOLLOW_CAMERA) {

        if (currentCar == gallardo) {

            hblur.uniforms['r'].value = vblur.uniforms['r'].value = rMap["gallardo"];

        } else if (currentCar == veyron) {

            hblur.uniforms['r'].value = vblur.uniforms['r'].value = rMap["veyron"];

        }

    } else {

        hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.35;

    }

    effectVignette.uniforms["offset"].value = 1.05;
    effectVignette.uniforms["darkness"].value = 1.5;

    // motion blur

    effectBlend.uniforms['tDiffuse2'].texture = effectSave.renderTarget;
    effectBlend.uniforms['mixRatio'].value = 0.65;

    var renderModel = new THREE.RenderPass(scene, camera);

    effectVignette.renderToScreen = true;

    composer = new THREE.EffectComposer(renderer, renderTarget);

    composer.addPass(renderModel);

    composer.addPass(effectFXAA);

    composer.addPass(effectBlend);
    composer.addPass(effectSave);

    composer.addPass(effectBloom);
    composer.addPass(effectBleach);

    composer.addPass(hblur);
    composer.addPass(vblur);

    composer.addPass(effectVignette);

}

//

function checkStatus() {

    if (gallardo.loaded && veyron.loaded) {

        document.getElementById("loading").style.display = "none";

    }

}

//

function setSpritesOpacity(opacity) {

    for (var i = 0; i < sprites.length; i++) {

        sprites[i].opacity = opacity;

    }

}

//


function createScene() {

    // GROUND

    var texture = THREE.ImageUtils.loadTexture("images/ny.jpg");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50);

    groundBasic = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        map: texture
    });
    groundBasic.color.setHSV(0.1, 0.45, 0.995);

    ground = new THREE.Mesh(new THREE.PlaneGeometry(50000, 50000), groundBasic);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -215;
    scene.add(ground);

    ground.castShadow = false;
    ground.receiveShadow = true;

    // OBJECTS

    var cylinderGeometry = new THREE.CylinderGeometry(2, 50, 1000, 32);
    var sphereGeometry = new THREE.SphereGeometry(100, 32, 16);

    var sy1 = -500 + 38;
    var sy2 = -88;

    addObject(cylinderGeometry, 0xff0000, 1500, 250, 0, sy1);
    addObject(cylinderGeometry, 0xffaa00, -1500, 250, 0, sy1);
    addObject(cylinderGeometry, 0x00ff00, 0, 250, 1500, sy1);
    addObject(cylinderGeometry, 0x00ffaa, 0, 250, -1500, sy1);

    addObject(sphereGeometry, 0xff0000, 1500, -125, 200, sy2);
    addObject(sphereGeometry, 0xffaa00, -1500, -125, 200, sy2);
    addObject(sphereGeometry, 0x00ff00, 200, -125, 1500, sy2);
    addObject(sphereGeometry, 0x00ffaa, 200, -125, -1500, sy2);

}

//

function addObject(geometry, color, x, y, z, sy) {

    var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        color: color
    }));
    object.position.set(x, y, z);
    scene.add(object);

    object.castShadow = true;
    object.receiveShadow = true;

    var shadowTexture = THREE.ImageUtils.loadTexture("images/shadowAlpha.png");

    var shadowPlane = new THREE.PlaneGeometry(400, 400);
    var shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        opacity: 0.35,
        transparent: true,
        map: shadowTexture,
        polygonOffset: false,
        polygonOffsetFactor: -0.5,
        polygonOffsetUnits: 1
    });

    var shadow = new THREE.Mesh(shadowPlane, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = Math.PI / 2;

    shadow.position.y = sy;

    object.add(shadow);

}

//

function generateDropShadowTexture(object, width, height, bluriness) {

    var renderTargetParameters = {
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBufer: false
    };
    var shadowTarget = new THREE.WebGLRenderTarget(width, height, renderTargetParameters);

    var shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000
    });
    var shadowGeometry = THREE.GeometryUtils.clone(object.geometry);

    var shadowObject = new THREE.Mesh(shadowGeometry, shadowMaterial);

    var shadowScene = new THREE.Scene();
    shadowScene.add(shadowObject);

    shadowObject.geometry.computeBoundingBox();

    var bb = shadowObject.geometry.boundingBox;

    var margin = 0.15,

        width = bb.z[1] - bb.z[0],
        height = bb.x[1] - bb.x[0],
        depth = bb.y[1] - bb.y[0],

        left = bb.z[0] - margin * width,
        right = bb.z[1] + margin * width,

        top = bb.x[1] + margin * height,
        bottom = bb.x[0] - margin * height,

        near = bb.y[1] + margin * depth,
        far = bb.y[0] - margin * depth;

    var topCamera = new THREE.OrthoCamera(left, right, top, bottom, near, far);
    topCamera.position.y = bb.y[1];

    var renderShadow = new THREE.RenderPass(shadowScene, topCamera);

    var blurShader = THREE.ShaderExtras["triangleBlur"];
    var effectBlurX = new THREE.ShaderPass(blurShader, 'texture');
    var effectBlurY = new THREE.ShaderPass(blurShader, 'texture');

    renderShadow.clearColor = new THREE.Color(0x000000);
    renderShadow.clearAlpha = 0;

    var blurAmountX = bluriness / width;
    var blurAmountY = bluriness / height;

    effectBlurX.uniforms['delta'].value = new THREE.Vector2(blurAmountX, 0);
    effectBlurY.uniforms['delta'].value = new THREE.Vector2(0, blurAmountY);

    var shadowComposer = new THREE.EffectComposer(renderer, shadowTarget);

    shadowComposer.addPass(renderShadow);
    shadowComposer.addPass(effectBlurX);
    shadowComposer.addPass(effectBlurY);

    renderer.clear();
    shadowComposer.render(0.1);

    return shadowTarget;

}


//

function addCar(object, x, y, z, s) {

    object.root.position.set(x, y, z);
    scene.add(object.root);

    object.enableShadows(true);

    if (FOLLOW_CAMERA && object == currentCar) {

        object.root.add(camera);

        camera.position.set(350, 500, 2200);
        //camera.position.set( 0, 3000, -500 );

        camera.target.position.z = 500;
        camera.target.position.y = 150;

    }

    var shadowTexture = generateDropShadowTexture(object.bodyMesh, 64, 32, 15);

    object.bodyMesh.geometry.computeBoundingBox();
    var bb = object.bodyMesh.geometry.boundingBox;

    var ss = object.modelScale * 1.0;
    var shadowWidth = ss * (bb.z[1] - bb.z[0]);
    var shadowHeight = 1.25 * ss * (bb.x[1] - bb.x[0]);

    var shadowPlane = new THREE.PlaneGeometry(shadowWidth, shadowHeight);
    var shadowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.5,
        transparent: true,
        map: shadowTexture,
        polygonOffset: false,
        polygonOffsetFactor: -0.5,
        polygonOffsetUnits: 1
    });

    var shadow = new THREE.Mesh(shadowPlane, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = Math.PI / 2;
    shadow.position.y = s + 10;

    object.root.add(shadow);

}

//

function setCurrentCar(car, cameraType) {

    var oldCar = currentCar;

    currentCar = config[car].model;

    if (cameraType == "front" || cameraType == "back") {

        hblur.uniforms['r'].value = vblur.uniforms['r'].value = config[car].r;

        FOLLOW_CAMERA = true;

        oldCar.root.remove(camera);
        currentCar.root.add(camera);

        if (cameraType == "front") {

            camera.position.set(350, 500, 2200);

        } else if (cameraType == "back") {

            camera.position.copy(config[car].backCam);

        }

        camera.target.position.set(0, 150, 500);

    } else {

        FOLLOW_CAMERA = false;

        oldCar.root.remove(camera);

        camera.position.set(2000, 0, 2000);
        camera.target.position.set(0, 0, 0);

        spotLight.position.set(0, 1800, 1500);

        hblur.uniforms['r'].value = vblur.uniforms['r'].value = 0.35;

    }

}

//

function onWindowResize(event) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight - 2 * MARGIN;

    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();

    renderTarget = new THREE.WebGLRenderTarget(SCREEN_WIDTH, SCREEN_HEIGHT, renderTargetParameters);

    composer.reset(renderTarget);

    hblur.uniforms['h'].value = 10.75 / SCREEN_WIDTH;
    vblur.uniforms['v'].value = 10.75 / SCREEN_HEIGHT;

    effectFXAA.uniforms['resolution'].value.set(1 / SCREEN_WIDTH, 1 / SCREEN_HEIGHT);

}

//

function onKeyDown(event) {

    switch (event.keyCode) {

        case 38:
            /*up*/ controlsGallardo.moveForward = true;
            break;
        case 87:
            /*W*/ controlsVeyron.moveForward = true;
            break;

        case 40:
            /*down*/ controlsGallardo.moveBackward = true;
            break;
        case 83:
            /*S*/ controlsVeyron.moveBackward = true;
            break;

        case 37:
            /*left*/ controlsGallardo.moveLeft = true;
            break;
        case 65:
            /*A*/ controlsVeyron.moveLeft = true;
            break;

        case 39:
            /*right*/ controlsGallardo.moveRight = true;
            break;
        case 68:
            /*D*/ controlsVeyron.moveRight = true;
            break;

        case 49:
            /*1*/ setCurrentCar("gallardo", "center");
            break;
        case 50:
            /*2*/ setCurrentCar("veyron", "center");
            break;
        case 51:
            /*3*/ setCurrentCar("gallardo", "front");
            break;
        case 52:
            /*4*/ setCurrentCar("veyron", "front");
            break;
        case 53:
            /*5*/ setCurrentCar("gallardo", "back");
            break;
        case 54:
            /*6*/ setCurrentCar("veyron", "back");
            break;

        case 78:
            /*N*/ vdir *= -1;
            break;

        case 66:
            /*B*/ blur = !blur;
            break;

    }

};

function onKeyUp(event) {

    switch (event.keyCode) {

        case 38:
            /*up*/ controlsGallardo.moveForward = false;
            break;
        case 87:
            /*W*/ controlsVeyron.moveForward = false;
            break;

        case 40:
            /*down*/ controlsGallardo.moveBackward = false;
            break;
        case 83:
            /*S*/ controlsVeyron.moveBackward = false;
            break;

        case 37:
            /*left*/ controlsGallardo.moveLeft = false;
            break;
        case 65:
            /*A*/ controlsVeyron.moveLeft = false;
            break;

        case 39:
            /*right*/ controlsGallardo.moveRight = false;
            break;
        case 68:
            /*D*/ controlsVeyron.moveRight = false;
            break;

    }

};


//

function setMaterialsGallardo(car) {

    // BODY

    var materials = car.bodyGeometry.materials;

    materials[0][0] = mlib.body[0][1]; // body
    materials[1][0] = mlib["Dark chrome"]; // front under lights, back

    // WHEELS

    materials = car.wheelGeometry.materials;

    materials[0][0] = mlib["Chrome"]; // insides
    materials[1][0] = mlib["Black rough"]; // tire

}

function setMaterialsVeyron(car) {

    // 0 - top, front center, back sides
    // 1 - front sides
    // 2 - engine
    // 3 - small chrome things
    // 4 - backlights
    // 5 - back signals
    // 6 - bottom, interior
    // 7 - windshield

    // BODY

    var materials = car.bodyGeometry.materials;

    materials[0][0] = mlib["Black metal"]; // top, front center, back sides
    materials[1][0] = mlib["Chrome"]; // front sides
    materials[2][0] = mlib["Chrome"]; // engine
    materials[3][0] = mlib["Dark chrome"]; // small chrome things
    materials[4][0] = mlib["Red glass"]; // backlights
    materials[5][0] = mlib["Orange glass"]; // back signals
    materials[6][0] = mlib["Black rough"]; // bottom, interior
    materials[7][0] = mlib["Dark glass"]; // windshield

    // WHEELS

    materials = car.wheelGeometry.materials;

    materials[0][0] = mlib["Chrome"]; // insides
    materials[1][0] = mlib["Black rough"]; // tire

}

//

function animate() {

    requestAnimationFrame(animate);

    render();
    stats.update();

}

function clamp(x, a, b) {
    return x < a ? a : (x > b ? b : x);
}

function map_linear(x, sa, sb, ea, eb) {

    return (x - sa) * (eb - ea) / (sb - sa) + ea;

};

function render() {

    var newTime = new Date().getTime();
    var delta = 0.001 * (newTime - oldTime);
    oldTime = newTime;

    // day / night

    v = clamp(v + 0.5 * delta * vdir, 0.1, 0.9);
    scene.fog.color.setHSV(0.51, 0.5, v);

    renderer.setClearColor(scene.fog.color, 1);

    var vnorm = (v - 0.05) / (0.9 - 0.05);

    if (vnorm < 0.3) {

        setSpritesOpacity(1 - v / 0.3);

    } else {

        setSpritesOpacity(0);

    }

    if (vnorm < 0.4) {

        if (veyron.loaded) {

            veyron.bodyGeometry.materials[1][0] = mlib["ChromeN"];
            veyron.bodyGeometry.materials[2][0] = mlib["ChromeN"];

            veyron.wheelGeometry.materials[0][0] = mlib["ChromeN"];

        }

        if (gallardo.loaded) {

            gallardo.wheelGeometry.materials[0][0] = mlib["ChromeN"];

        }

    } else {

        if (veyron.loaded) {

            veyron.bodyGeometry.materials[1][0] = mlib["Chrome"];
            veyron.bodyGeometry.materials[2][0] = mlib["Chrome"];

            veyron.wheelGeometry.materials[0][0] = mlib["Chrome"];

        }

        if (gallardo.loaded) {

            gallardo.wheelGeometry.materials[0][0] = mlib["Chrome"];

        }

    }

    effectBloom.screenUniforms["opacity"].value = map_linear(vnorm, 0, 1, 1, 0.75);

    ambientLight.color.setHSV(0, 0, map_linear(vnorm, 0, 1, 0.07, 0.33));
    groundBasic.color.setHSV(0.1, 0.45, map_linear(vnorm, 0, 1, 0.725, 0.995));

    // blur

    if (blur) {

        effectSave.enabled = true;
        effectBlend.enabled = true;

    } else {

        effectSave.enabled = false;
        effectBlend.enabled = false;

    }

    // update car model

    veyron.updateCarModel(delta, controlsVeyron);
    gallardo.updateCarModel(delta, controlsGallardo);

    // update camera

    if (!FOLLOW_CAMERA) {

        camera.target.position.x = currentCar.root.position.x;
        camera.target.position.z = currentCar.root.position.z;

    } else {

        spotLight.position.x = currentCar.root.position.x - 500;
        spotLight.position.z = currentCar.root.position.z - 500;


    }

    spotLight.target.position.x = currentCar.root.position.x;
    spotLight.target.position.z = currentCar.root.position.z;


    var updateCubemap = true;

    if (updateCubemap) {

        veyron.setVisible(false);
        gallardo.setVisible(false);

        cubeCamera.updatePosition(currentCar.root.position);

        renderer.autoClear = true;
        cubeCamera.updateCubeMap(renderer, scene);

        veyron.setVisible(true);
        gallardo.setVisible(true);

    }

    renderer.autoClear = false;
    renderer.shadowMapEnabled = true;

    renderer.clear();
    composer.render(0.1);

    renderer.shadowMapEnabled = false;

}