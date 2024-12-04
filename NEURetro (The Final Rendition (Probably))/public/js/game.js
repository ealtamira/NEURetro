const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
if (!ctx) {
  console.error("Canvas context is not available");
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  renderStartText();
});


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const playerSpriteSheets = {
  idle: new Image(),
  run: new Image(),
  jump: new Image(),
};

// Set up onLoad event for all images
let imagesLoaded = 0;
const totalImages = 3;

function checkImagesLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    gameState = "start";  // Start the game when all images are loaded
    gameLoop();
  }
}

playerSpriteSheets.idle.src = "images/64x64/idle.png";
playerSpriteSheets.idle.onload = checkImagesLoaded;
playerSpriteSheets.run.src = "images/64x64/run.png";
playerSpriteSheets.run.onload = checkImagesLoaded;
playerSpriteSheets.jump.src = "images/64x64/jump.png";
playerSpriteSheets.jump.onload = checkImagesLoaded;

const animationSettings = {
  idle: { width: 64, height: 64, totalFrames: 7 },
  run: { width: 64, height: 64, totalFrames: 7 },
  jump: { width: 64, height: 64, totalFrames: 7 },
};

playerSpriteSheets.idle.onload = () => { console.log('Idle sprite loaded'); };
playerSpriteSheets.run.onload = () => { console.log('Run sprite loaded'); };
playerSpriteSheets.jump.onload = () => { console.log('Jump sprite loaded'); };

let currentAnimation = "idle";  // Initial animation
let currentFrame = 0;  // Start with the first frame
let facingRight = true;

// Player settings
const player = {
  x: 100,
  y: canvas.height - 100,
  width: 64,
  height: 64,
  speed: 5,
  dx: 0,
  dy: 0,
  gravity: 0.35,
  jumpPower: -15,
  grounded: false,
};

function updatePlayer() {
  player.x += player.dx;
  player.y += player.dy;

  if (!player.grounded) {
    player.dy += player.gravity; // Apply gravity if the player is in the air
  }

  // Horizontal boundary constraints
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  // Vertical boundary constraints
  if (player.y + player.height > canvas.height) {
    player.y = canvas.height - player.height;
    player.dy = 0;
    player.grounded = true;
  }
}


// Platform data
const baseFloor = { 
  x: 0, 
  y: canvas.height - 30, // Position it at the bottom of the canvas
  width: canvas.width, 
  height: 30 
};

function generateRandomPlatform() {
  const minWidth = 100;
  const maxWidth = 300;
  const platformWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth; // Random width between 100 and 300
  const platformHeight = 10; // Set a fixed height for platforms

  // Random x position: Make sure platform is within the canvas width
  const xPosition = Math.floor(Math.random() * (canvas.width - platformWidth));

  // Random y position: Place it somewhere above the bottom, but within a reasonable range
  const yPosition = Math.floor(Math.random() * (canvas.height - 100)) - 50; // Random height between 100 and canvas.height - 100

  return { x: xPosition, y: yPosition, width: platformWidth, height: platformHeight };
}

function generateRandomPlatforms(numPlatforms) {
  let platforms = [];
  for (let i = 0; i < numPlatforms; i++) {
    platforms.push(generateRandomPlatform());
  }
  return platforms;
}

let platforms = generateRandomPlatforms(10);

function drawPlatforms() {
  // Draw the base floor (ground)
  ctx.fillStyle = "green"; // You can change the color of the ground to fit your game
  ctx.fillRect(baseFloor.x, baseFloor.y, baseFloor.width, baseFloor.height);

  // Draw the random platforms
  ctx.fillStyle = "brown"; // Color for the random platforms
  platforms.forEach((platform) => {
    const platformX = platform.x - camera.x;
    const platformY = platform.y - camera.y;
    ctx.fillRect(platformX, platformY, platform.width, platform.height);
  });
}

function removeOffscreenPlatforms() {
  platforms = platforms.filter((platform) => {
    // If platform is below the camera view, remove it
    return platform.y - camera.y < camera.height;
  });
}

function checkPlatformCollision() {
  player.grounded = false; // Start by assuming the player is not grounded

  // Check collision with the base floor
  if (player.y + player.height <= baseFloor.y && player.y + player.height + player.dy >= baseFloor.y &&
      player.x + player.width > baseFloor.x && player.x < baseFloor.x + baseFloor.width) {
    player.y = baseFloor.y - player.height; // Place the player on top of the base floor
    player.dy = 0; // Stop the downward movement
    player.grounded = true; // Mark the player as grounded
  }

  // Check collision with random platforms
  platforms.forEach((platform) => {
    // Check for downward collision with platforms
    if (player.dy > 0 && player.y + player.height <= platform.y && player.y + player.height + player.dy >= platform.y &&
        player.x + player.width > platform.x && player.x < platform.x + platform.width) {
      player.y = platform.y - player.height; // Place the player on top of the platform
      player.dy = 0; // Stop the downward movement
      player.grounded = true; // Mark the player as grounded
    }

    // Horizontal collision with platforms
    if (player.x + player.width > platform.x && player.x < platform.x + platform.width &&
        player.y + player.height > platform.y && player.y < platform.y + platform.height) {
      if (player.dx > 0) player.x = platform.x - player.width; // Stop player from moving through platform on the right
      if (player.dx < 0) player.x = platform.x + platform.width; // Stop player from moving through platform on the left
    }
  });
}


// Camera settings
const camera = {
  x: 0, 
  y: 0,  
  width: canvas.width, 
  height: canvas.height, 
  speed: 5,  // Speed at which the camera follows the player
};

function generatePlatformAbove() {
    const minWidth = 100;
    const maxWidth = 300;
    const platformWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth; // Random width
    const platformHeight = 10; // Fixed height
  
    // Random x position: Ensure it's within the canvas width
    const xPosition = Math.floor(Math.random() * (canvas.width - platformWidth));
  
    // Place the platform just above the top of the camera view
    const yPosition = camera.y - Math.random() * 150 - 50; // Random height above the current camera
  
    return { x: xPosition, y: yPosition, width: platformWidth, height: platformHeight };
  }
  
  function updatePlatforms() {
    // Ensure there are always enough platforms above the camera
    while (platforms.length < 10 || platforms[platforms.length - 1].y > camera.y - 200) {
      platforms.push(generatePlatformAbove());
    }
  
    // Remove platforms below the camera view
    removeOffscreenPlatforms();
  }

  function updateCamera() {
  // Smooth follow for vertical movement
  camera.y += (player.y - camera.height / 2 - camera.y) * 0.1;
  
    // Prevent camera from scrolling past the top or bottom of the game world
    if (camera.y < 0) camera.y = 0;
    if (camera.y + camera.height > canvas.height) camera.y = canvas.height - camera.height;
  }

// function updateCamera() {
//   // Smooth follow for vertical movement
//   camera.y += (player.y - camera.height / 2 - camera.y) * 0.1;

//   // Prevent camera from scrolling past the top or bottom of the game world
//   if (camera.y < 0) camera.y = 0;
//   if (camera.y + camera.height > canvas.height) camera.y = canvas.height - camera.height;
// }


function drawPlayer() {
  const animation = animationSettings[currentAnimation];
  ctx.save();

  // Shift the player's position relative to the camera
  const playerX = player.x - camera.x;
  const playerY = player.y - camera.y;

  if (!facingRight && currentAnimation === "run") {
    ctx.scale(-1, 1);
    ctx.drawImage(
      playerSpriteSheets[currentAnimation],
      currentFrame * animation.width,
      0,
      animation.width,
      animation.height,
      -playerX - player.width,
      playerY,
      player.width,
      player.height
    );
  } else {
    ctx.drawImage(
      playerSpriteSheets[currentAnimation],
      currentFrame * animation.width,
      0,
      animation.width,
      animation.height,
      playerX,
      playerY,
      player.width,
      player.height
    );
  }

  ctx.restore();
}



// Game states
let gameState = "start";// Possible states: start, playing, paused, over

function renderStartText() {
  ctx.font = "30px Arial"; // Set font style and size
  ctx.fillStyle = "black"; // Set text color

  // Measure the width of the text to center it
  const text = "Press Enter to Start";
  const textWidth = ctx.measureText(text).width;

  // Calculate the position to center the text
  const x = (canvas.width - textWidth) / 2;  // Horizontal center
  const y = canvas.height / 2;  // Vertical center

  // Render the text on the canvas
  ctx.fillText(text, x, y);
}



document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && gameState === "start") {
    console.log("Starting the game...");
    gameState = "playing";
    gameLoop();  // Start the game loop
  }
});

// Input handling
let leftPressed = false;
let rightPressed = false;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") leftPressed = true;
  if (e.key === "ArrowRight" || e.key === "d") rightPressed = true;
  if (e.key === " " && player.grounded) {
    player.dy = player.jumpPower;
    player.grounded = false;
  }
  if (e.key === "Enter" && gameState === "start") {
    gameState = "playing";
    gameLoop();
  } else if (e.key === "Escape") {
    gameState = gameState === "playing" ? "paused" : "playing";
    if (gameState === "playing") gameLoop();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") leftPressed = false;
  if (e.key === "ArrowRight" || e.key === "d") rightPressed = false;
});

// Functions
function handlePlayerMovement() {
  if (leftPressed) {
    player.dx = -player.speed;
    facingRight = false;
  } else if (rightPressed) {
    player.dx = player.speed;
    facingRight = true;
  } else {
    player.dx = 0;
  }
}

function updateAnimation() {
  // Change animation based on player's state
  let newAnimation = "idle";

  if (player.dy !== 0) {
    newAnimation = "jump"; // Player is jumping
  } else if (player.dx !== 0) {
    newAnimation = "run"; // Player is running
  }

  // Only reset the frame when the animation changes
  if (newAnimation !== currentAnimation) {
    currentAnimation = newAnimation;
    currentFrame = 0;  // Reset to the first frame of the new animation
  }

  // Update the frame for the current animation
  currentFrame = (currentFrame + 1) % animationSettings[currentAnimation].totalFrames;
}

// Score
let score = 0;
let time = 0;

setInterval(function() {
    time += 1
}, 1000);

function updateScore() {
  score = Math.max(0, Math.floor(((canvas.height - player.y)/ 9.4) - time));

  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function renderGameOver() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("Game Over", canvas.width / 2 - 75, canvas.height / 2);
}



async function renderWin() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "green";
  ctx.fillText("You Win!", canvas.width / 2 - 75, canvas.height / 2);

  const data = {
    score: score
  }

  try {
    const response = await fetch ('/submitscore/' + score, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
        console.log('w')
    } else {
        console.log('response error')
    }
  } catch (error) {
        console.log('try catch error')
    }
}

if (gameState === "start") {
  renderStartText();
}

function gameLoop() {

  if (gameState !== "playing") return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  handlePlayerMovement();
  updatePlayer();
  checkPlatformCollision();
  updateAnimation();

  updateCamera();
  removeOffscreenPlatforms();

  drawPlayer();
  drawPlatforms();
  updateScore();


  if (score < 1) {
    gameState = "over";
    renderGameOver();
    return;
  }

  if (player.y <= -100) {
    gameState = "over";
    renderWin();
    return;
  }

  requestAnimationFrame(gameLoop);
}

console.log(`Canvas Width: ${canvas.width}, Canvas Height: ${canvas.height}`);