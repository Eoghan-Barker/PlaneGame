// THREEJS VARIABLES
var scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  renderer,
  container;

//SCREEN VARIABLES
var HEIGHT, WIDTH;

// GAME VARIABLES
var left = 0,
  right = 0,
  velocity = 0,
  airplane,
  wall1;

//SCENE
function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 0;
  camera.lookAt = 0, 0, 0;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.shadowMap.enabled = true;
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);
}

// LIGHTS
var ambientLight, hemisphereLight, shadowLight;

function createLights() {
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;

  scene.add(hemisphereLight);
  scene.add(shadowLight);
}

// Acts as a floor for the game
function createSea() {
  const planeGeometry = new THREE.BoxGeometry(1000, 10, 5000);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: "blue" });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);
  plane.position.y = -50;
}

// Game Objects
class Airplane {
  constructor() {
    this.mesh = new THREE.Object3D();
    // Main body of plane
    var bodyGeometry = new THREE.BoxGeometry(30, 20, 50);
    var bodyMaterial = new THREE.MeshBasicMaterial({ color: "red" });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);

    // Side Wings
    var wingsGeometry = new THREE.BoxGeometry(90, 5, 15);
    var wingsMaterial = new THREE.MeshBasicMaterial({ color: "red" });
    var wings = new THREE.Mesh(wingsGeometry, wingsMaterial);
    this.mesh.add(wings);

    // Tail
    var tailGeometry = new THREE.BoxGeometry(50, 5, 8);
    var tailMaterial = new THREE.MeshBasicMaterial({ color: "red" });
    var tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, 55);
    this.mesh.add(tail);

    // Cockpit
    var cockpitGeometry = new THREE.SphereGeometry(15, 20, 20);
    var cockpitMaterial = new THREE.MeshBasicMaterial({ color: "gray" });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 6, -5);
    this.mesh.add(cockpit);
  }

  //player movement - moves left or righ on keydown, stops on keyup
  move() {
    // Detect when user presses a,d, left or right key
    // and when they lift off the key
    document.addEventListener("keydown", function (event) {
      let key = event.key.toLowerCase();

      if (key == "a" || key == "arrowleft") {
        left = -1;
      }
      if (key == "d" || key == "arrowright") {
        right = 1;
      }

      velocity = left + right;
    });

    document.addEventListener("keyup", function (event) {
      let key = event.key.toLowerCase();

      if (key == "a" || key == "arrowleft") {
        left = 0;
      }
      if (key == "d" || key == "arrowright") {
        right = 0;
      }

      velocity = left + right;
    });

    // update the x position of the player
    this.mesh.position.x += velocity;

    // keep the player is in bounds - x = ~+/-102
    if (this.mesh.position.x > 102) {
      this.mesh.position.x = 102;
    } else if (this.mesh.position.x < -102) {
      this.mesh.position.x = -102;
    }


    // move the camera with the player
    camera.position.x = this.mesh.position.x;
  }
}

class Obsticle {
  constructor() {
    this.mesh = new THREE.Object3D();
    var geometry = new THREE.BoxGeometry(10, 200, 1);
    var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.set(0, 0, -200);
    this.mesh.add(wall);
    
  }

  respawn(){
    // Math.round(Math.random()) will give you 0 or 1
    // Multiplying the result by 2 will give you 0 or 2
    // And then subtracting 1 gives you -1 or 1.
    // Then get random number between 0 and 100 and multiply by +/-1
    var posORneg = Math.round(Math.random()) * 2 - 1;
    var randomX = (Math.floor(Math.random() *100))*posORneg;
    this.mesh.position.x = randomX;
  }

  move(){
    this.mesh.position.z +=1;
    // Respawn wall when it reaches front of screen
    if(this.mesh.position.z >= 350){
      this.mesh.position.z = -200;
      this.respawn();
    }
  }
}

function createPlane() {
  airplane = new Airplane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.x = 0;
  airplane.mesh.position.y = -15;
  airplane.mesh.position.z = 100;
  scene.add(airplane.mesh);
}

function createWalls() {
  wall1 = new Obsticle();
  scene.add(wall1.mesh);
  wall1.respawn();
  //let walls = [new Obsticle()];
  //scene.add(walls[0]);
}

function animate() {
  // Render the scene and camera
  renderer.render(scene, camera); 

  airplane.move();
  wall1.move();

  requestAnimationFrame(animate);
}

function init(event) {
  createScene();
  createLights();
  createPlane();
  createSea();
  //createSky();
  createWalls();

  animate();
}

window.addEventListener("load", init, false);
