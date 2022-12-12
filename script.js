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
var HEIGHT, WIDTH, hemisphereLight, spotLight;

// GAME VARIABLES
var left = 0,
  right = 0,
  velocity = 0,
  score = 0,
  collision = false,
  airplane;
var walls = [];

//SCENE
function createScene() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  // setup scene with fog
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

  // setup camera
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1;
  farPlane = 1000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = 0;
  camera.lookAt(0, 0, 0);

  // setup renderer
  // alpha true sets the backgroung to be transparent allowing the css to show
  // antialias true to smooth the edges
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  // Endable shadows
  // Enable shaows in the renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // to antialias the shadow
  // add the css and the renderer to the scene
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);
}

// LIGHTS
function createLights() {
  // HemisphereLight to add a more realistic brightness
  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  scene.add(hemisphereLight);

  // Spotlight from behind the airplane to cast shadows and improve lighting
  spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, 2000, 500);
  spotLight.castShadow = true;
  scene.add(spotLight);

  // Light direction helper for tinkering with the lighting
  const spotLightHelper = new THREE.SpotLightHelper(spotLight);
  //scene.add( spotLightHelper );
}

// Acts as a floor for the game
function createSea() {
  const planeGeometry = new THREE.BoxGeometry(1000, 10, 5000);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: "blue" });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  scene.add(plane);
  // move the plane down to make it look like the airplane is flying higher
  plane.position.y = -50;
}

// Game Objects
class Airplane {
  constructor() {
    // A mesh for each piece of the airplane
    this.mesh = new THREE.Object3D();
    // Main body of plane
    var bodyGeometry = new THREE.BoxGeometry(30, 20, 50);
    var bodyMaterial = new THREE.MeshLambertMaterial({ color: "red" });
    var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.add(body);

    // Side Wings
    var wingsGeometry = new THREE.BoxGeometry(90, 5, 15);
    var wingsMaterial = new THREE.MeshLambertMaterial({ color: "red" });
    var wings = new THREE.Mesh(wingsGeometry, wingsMaterial);
    this.mesh.add(wings);

    // Tail
    var tailGeometry = new THREE.BoxGeometry(50, 5, 8);
    var tailMaterial = new THREE.MeshLambertMaterial({ color: "red" });
    var tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(0, 0, 55);
    this.mesh.add(tail);

    // Cockpit
    var cockpitGeometry = new THREE.SphereGeometry(15, 20, 20);
    var cockpitMaterial = new THREE.MeshLambertMaterial({ color: "gray" });
    var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 6, -5);
    this.mesh.add(cockpit);

    // Misc airplane properties
    this.mesh.scale.set(0.25, 0.25, 0.25);
    this.mesh.position.x = 0;
    this.mesh.position.y = -15;
    this.mesh.position.z = 100;
    this.mesh.castShadow = true;
    this.mesh.recieveShadow = true;
  }

  //player movement - moves left or right on keydown, stops on keyup
  move() {
    // Detect when user presses left or right key
    // and when they lift off the key
    document.addEventListener("keydown", function (event) {
      let key = event.key.toLowerCase();

      if (key == "arrowleft") {
        left = -1;
      }
      if (key == "arrowright") {
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

    //Increase score as plane moves
    score++;
    //Add score to screen with html
    document.getElementById("Score").innerHTML = "Score: " + score;
  }

  crash() {
    // Stops player from controlling the airplane after a crash
    collision = true;
    // Remove the airplane from the scene to simulate a crash
    scene.remove(airplane.mesh);
    // Display the game over screen
    document.getElementById("gameover").style.display = "block";
  }

  // These are for calculating collision
  getHitboxLeft() {
    return this.mesh.position.x - 10;
  }

  getHitboxRight() {
    return this.mesh.position.x + 10;
  }
}

class Obsticle {
  constructor() {
    this.mesh = new THREE.Object3D();
    var geometry = new THREE.BoxGeometry(10, 200, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    var wall = new THREE.Mesh(geometry, material);
    wall.position.set(0, 0, -200);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.add(wall);

    // Sets the speed of the walls coming towards the player
    this.speed = 1;
  }

  // Respawns the wall back in front of the player at a random x position
  respawn() {
    // Math.round(Math.random()) will give you 0 or 1, Multiplying the result by 2 will give you 0 or 2
    // And then subtracting 1 gives you -1 or 1. Then get random number between 0 and 100 and multiply by +/-1
    var posORneg = Math.round(Math.random()) * 2 - 1;
    var randomX = Math.floor(Math.random() * 100) * posORneg;
    this.mesh.position.x = randomX;
  }

  move() {
    this.mesh.position.z += this.speed;
    // Respawn wall when it reaches front of screen
    if (this.mesh.position.z >= 400) {
      this.mesh.position.z = -200;
      this.respawn();
    }
  }

  collisionDetect(airplane) {
    // get the width of the wall
    this.hitboxLeft = this.mesh.position.x - 5;
    this.hitboxRight = this.mesh.position.x + 5;

    // Check if z coord is the same(airplane z position won't change)
    if (this.mesh.position.z >= 300 && this.mesh.position.z <= 310) {
      // Check if x co-ord collision(check if width of wall is inside width of airplane)
      if (
        this.hitboxLeft < airplane.getHitboxRight() &&
        this.hitboxRight > airplane.getHitboxLeft()
      ) {
        airplane.crash();
        console.log("collision");
      }
    }
  }
}

function createWalls() {
  var counter = 0;

  // limit the number of obsticles to 10 and stagger when they are added to the scene
  setInterval(() => {
    if (walls.length < 10) {
      walls.push(new Obsticle());
      scene.add(walls[counter].mesh);
      walls[counter].respawn();
      counter++;
    }
  }, 1000);
}

// Called when the user presses space after a collision
// Resets score, adds the airplane back to the scene and lets the player control it again
function restart() {
  scene.add(airplane.mesh);
  score = 0;
  collision = false;
  document.getElementById("gameover").style.display = "none";
}

function animate() {
  // Render the scene and camera
  renderer.render(scene, camera);

  // Only allow the player to control the airplane when there is no collision
  if (!collision) {
    airplane.move();
  }

  // Update all of the obsticles
  walls.forEach((wall) => {
    wall.move();
    wall.collisionDetect(airplane);
  });

  // Restart the game after a collision when user presses space
  document.addEventListener("keydown", function (event) {
    let key = event.key.toLowerCase();

    if (key == " " && collision == true) {
      restart();
    }
  });

  requestAnimationFrame(animate);
}

function init(event) {
  createScene();
  createLights();
  createSea();
  createWalls();
  // Create player airplane object
  airplane = new Airplane();
  scene.add(airplane.mesh);

  // hide game over message
  document.getElementById("gameover").style.display = "none";
  animate();
}

// when the game loads in, call the init function
window.addEventListener("load", init, false);
