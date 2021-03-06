/**
 * @author alteredq / http:
 */

THREE.Car = function () {

    var scope = this;



    this.modelScale = 1;

    this.backWheelOffset = 2;

    this.autoWheelGeometry = true;







    this.wheelOffsetX = 0;
    this.wheelOffsetY = 0;
    this.wheelOffsetZ = 0;

    this.wheelDiameter = 1;



    this.MAX_SPEED = 2200;
    this.MAX_REVERSE_SPEED = -1500;

    this.MAX_WHEEL_ROTATION = 0.6;

    this.FRONT_ACCELERATION = 1250;
    this.BACK_ACCELERATION = 1500;

    this.WHEEL_ANGULAR_ACCELERATION = 1.5;

    this.FRONT_DECCELERATION = 750;
    this.WHEEL_ANGULAR_DECCELERATION = 1.0;

    this.STEERING_RADIUS_RATIO = 0.0023;

    this.MAX_TILT_SIDES = 0.05;
    this.MAX_TILT_FRONTBACK = 0.015;



    this.speed = 0;
    this.acceleration = 0;

    this.wheelOrientation = 0;
    this.carOrientation = 0;



    this.root = new THREE.Object3D();

    this.frontLeftWheelRoot = new THREE.Object3D();
    this.frontRightWheelRoot = new THREE.Object3D();

    this.bodyMesh = null;

    this.frontLeftWheelMesh = null;
    this.frontRightWheelMesh = null;

    this.backLeftWheelMesh = null;
    this.backRightWheelMesh = null;

    this.bodyGeometry = null;
    this.wheelGeometry = null;



    this.loaded = false;

    this.meshes = [];



    this.enableShadows = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {

            this.meshes[i].castShadow = enable;
            this.meshes[i].receiveShadow = enable;

        }

    };

    this.setVisible = function (enable) {

        for (var i = 0; i < this.meshes.length; i++) {

            this.meshes[i].visible = enable;
            this.meshes[i].visible = enable;

        }

    };

    this.loadPartsJSON = function (bodyURL, wheelURL) {

        var loader = new THREE.JSONLoader();

        loader.load({
            model: bodyURL,
            callback: function (geometry) {
                createBody(geometry)
            }
        });
        loader.load({
            model: wheelURL,
            callback: function (geometry) {
                createWheels(geometry)
            }
        });

    };

    this.loadPartsBinary = function (bodyURL, wheelURL) {

        var loader = new THREE.BinaryLoader();

        loader.load({
            model: bodyURL,
            callback: function (geometry) {
                createBody(geometry)
            }
        });
        loader.load({
            model: wheelURL,
            callback: function (geometry) {
                createWheels(geometry)
            }
        });

    };

    this.updateCarModel = function (delta, controls) {



        if (controls.moveForward) {

            this.speed = clamp(this.speed + delta * this.FRONT_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
            this.acceleration = clamp(this.acceleration + delta, -1, 1);

        }

        if (controls.moveBackward) {


            this.speed = clamp(this.speed - delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, this.MAX_SPEED);
            this.acceleration = clamp(this.acceleration - delta, -1, 1);

        }

        if (controls.moveLeft) {

            this.wheelOrientation = clamp(this.wheelOrientation + delta * this.WHEEL_ANGULAR_ACCELERATION, -this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);

        }

        if (controls.moveRight) {

            this.wheelOrientation = clamp(this.wheelOrientation - delta * this.WHEEL_ANGULAR_ACCELERATION, -this.MAX_WHEEL_ROTATION, this.MAX_WHEEL_ROTATION);

        }



        if (!(controls.moveForward || controls.moveBackward)) {

            if (this.speed > 0) {

                var k = exponentialEaseOut(this.speed / this.MAX_SPEED);

                this.speed = clamp(this.speed - k * delta * this.FRONT_DECCELERATION, 0, this.MAX_SPEED);
                this.acceleration = clamp(this.acceleration - k * delta, 0, 1);

            } else {

                var k = exponentialEaseOut(this.speed / this.MAX_REVERSE_SPEED);

                this.speed = clamp(this.speed + k * delta * this.BACK_ACCELERATION, this.MAX_REVERSE_SPEED, 0);
                this.acceleration = clamp(this.acceleration + k * delta, -1, 0);

            }


        }



        if (!(controls.moveLeft || controls.moveRight)) {

            if (this.wheelOrientation > 0) {

                this.wheelOrientation = clamp(this.wheelOrientation - delta * this.WHEEL_ANGULAR_DECCELERATION, 0, this.MAX_WHEEL_ROTATION);

            } else {

                this.wheelOrientation = clamp(this.wheelOrientation + delta * this.WHEEL_ANGULAR_DECCELERATION, -this.MAX_WHEEL_ROTATION, 0);

            }

        }



        var forwardDelta = this.speed * delta;

        this.carOrientation += (forwardDelta * this.STEERING_RADIUS_RATIO) * this.wheelOrientation;



        this.root.position.x += Math.sin(this.carOrientation) * forwardDelta;
        this.root.position.z += Math.cos(this.carOrientation) * forwardDelta;



        this.root.rotation.y = this.carOrientation;



        if (this.loaded) {

            this.bodyMesh.rotation.z = this.MAX_TILT_SIDES * this.wheelOrientation * (this.speed / this.MAX_SPEED);
            this.bodyMesh.rotation.x = -this.MAX_TILT_FRONTBACK * this.acceleration;

        }



        var angularSpeedRatio = 1 / (this.modelScale * (this.wheelDiameter / 2));

        var wheelDelta = forwardDelta * angularSpeedRatio;

        if (this.loaded) {

            this.frontLeftWheelMesh.rotation.x += wheelDelta;
            this.frontRightWheelMesh.rotation.x += wheelDelta;
            this.backLeftWheelMesh.rotation.x += wheelDelta;
            this.backRightWheelMesh.rotation.x += wheelDelta;

        }



        this.frontLeftWheelRoot.rotation.y = this.wheelOrientation;
        this.frontRightWheelRoot.rotation.y = this.wheelOrientation;

    };



    function createBody(geometry) {

        scope.bodyGeometry = geometry;

        createCar();

    };

    function createWheels(geometry) {

        scope.wheelGeometry = geometry;

        createCar();

    };

    function createCar() {

        if (scope.bodyGeometry && scope.wheelGeometry) {



            if (scope.autoWheelGeometry) {

                scope.wheelGeometry.computeBoundingBox();

                var bb = scope.wheelGeometry.boundingBox;

                var dx = 0.5 * (bb.x[1] + bb.x[0]);
                var dy = 0.5 * (bb.y[1] + bb.y[0]);
                var dz = 0.5 * (bb.z[1] + bb.z[0]);

                scope.wheelOffsetX = dx;
                scope.wheelOffsetY = dy;
                scope.wheelOffsetZ = dz;

                scope.wheelDiameter = bb.y[1] - bb.y[0];

                THREE.GeometryUtils.center(scope.wheelGeometry);

            }



            var delta,
                s = scope.modelScale,
                faceMaterial = new THREE.MeshFaceMaterial();



            scope.bodyMesh = new THREE.Mesh(scope.bodyGeometry, faceMaterial);
            scope.bodyMesh.scale.set(s, s, s);

            scope.root.add(scope.bodyMesh);



            delta = new THREE.Vector3(s * scope.wheelOffsetX, s * scope.wheelOffsetY, s * scope.wheelOffsetZ);

            scope.frontLeftWheelRoot.position.addSelf(delta);

            scope.frontLeftWheelMesh = new THREE.Mesh(scope.wheelGeometry, faceMaterial);
            scope.frontLeftWheelMesh.scale.set(s, s, s);

            scope.frontLeftWheelRoot.add(scope.frontLeftWheelMesh);
            scope.root.add(scope.frontLeftWheelRoot);



            delta = new THREE.Vector3(-s * scope.wheelOffsetX, s * scope.wheelOffsetY, s * scope.wheelOffsetZ);

            scope.frontRightWheelRoot.position.addSelf(delta);

            scope.frontRightWheelMesh = new THREE.Mesh(scope.wheelGeometry, faceMaterial);

            scope.frontRightWheelMesh.scale.set(s, s, s);
            scope.frontRightWheelMesh.rotation.z = Math.PI;

            scope.frontRightWheelRoot.add(scope.frontRightWheelMesh);
            scope.root.add(scope.frontRightWheelRoot);



            delta = new THREE.Vector3(s * scope.wheelOffsetX, s * scope.wheelOffsetY, -s * scope.wheelOffsetZ - scope.backWheelOffset);

            scope.backLeftWheelMesh = new THREE.Mesh(scope.wheelGeometry, faceMaterial);

            scope.backLeftWheelMesh.position.addSelf(delta);
            scope.backLeftWheelMesh.scale.set(s, s, s);

            scope.root.add(scope.backLeftWheelMesh);



            delta = new THREE.Vector3(-s * scope.wheelOffsetX, s * scope.wheelOffsetY, -s * scope.wheelOffsetZ - scope.backWheelOffset)

            scope.backRightWheelMesh = new THREE.Mesh(scope.wheelGeometry, faceMaterial);

            scope.backRightWheelMesh.position.addSelf(delta);
            scope.backRightWheelMesh.scale.set(s, s, s);
            scope.backRightWheelMesh.rotation.z = Math.PI;

            scope.root.add(scope.backRightWheelMesh);



            scope.meshes = [scope.bodyMesh, scope.frontLeftWheelMesh, scope.frontRightWheelMesh, scope.backLeftWheelMesh, scope.backRightWheelMesh];



            scope.loaded = true;

            if (scope.callback) {

                scope.callback(scope);

            }

        }

    };

    function clamp(x, a, b) {
        return x < a ? a : (x > b ? b : x);
    }

    function quadraticEaseOut(k) {
        return -k * (k - 2);
    }

    function cubicEaseOut(k) {
        return --k * k * k + 1;
    }

    function circularEaseOut(k) {
        return Math.sqrt(1 - --k * k);
    }

    function sinusoidalEaseOut(k) {
        return Math.sin(k * Math.PI / 2);
    }

    function exponentialEaseOut(k) {
        return k == 1 ? 1 : -Math.pow(2, -10 * k) + 1;
    }

};