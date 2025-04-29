const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gravity = 0.5; // Adjust for stronger/weaker gravity

const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    console.log("Key pressed:", event.key); // General key press

    if (event.key === 'w') {
        console.log("Lowercase W key DOWN - keys['w']:", keys['w']);
    } else if (event.key === 'W') {
        console.log("Uppercase W key DOWN - keys['W']:", keys['W']);
    }
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
    console.log("Key released:", event.key); // General key release

    if (event.key === 'w') {
        console.log("Lowercase W key UP - keys['w']:", keys['w']);
    } else if (event.key === 'W') {
        console.log("Uppercase W key UP - keys['W']:", keys['W']);
    }
});
const player = {
    x: 100,
    y: canvas.height - 50,
    width: 30,
    height: 50,
    color: 'red',
    velocityX: 0,
    velocityY: 0,
    isJumping: false,
    onGround: true // ADD THIS LINE
};
console.log("Initial player.isJumping:", player.isJumping); // NEW DEBUG LINE

const update = () => {
    console.log("velocityY:", player.velocityY, "isJumping:", player.isJumping); // DEBUG

    // Handle horizontal movement with 'A' and 'D'
    if (keys['a'] || keys['A']) {
        player.velocityX = -5;
    } else if (keys['d'] || keys['D']) {
        player.velocityX = 5;
    } else {
        player.velocityX = 0;
    }

    // Apply gravity
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Jumping logic with 'W' key - FORCED CONTROL
    if ((keys['w'] || keys['W']) && player.onGround) {
        player.velocityY = -15;
        player.isJumping = true;
        player.onGround = false; // Ensure we don't jump again mid-air
        console.log("FORCED JUMP - velocityY:", player.velocityY, "isJumping:", player.isJumping, "onGround:", player.onGround); // DEBUG
    }

    // Ground detection
    player.onGround = player.y >= canvas.height - player.height;
    if (player.onGround) {
        player.velocityY = 0;
        player.isJumping = false;
        player.y = canvas.height - player.height; // Ensure we're exactly on the ground
        console.log("FORCED GROUND - velocityY:", player.velocityY, "isJumping:", player.isJumping, "onGround:", player.onGround); // DEBUG
    }

    // Update player's x position
    player.x += player.velocityX;

    // Keep player within horizontal bounds
    if (player.x < 0) {
        player.x = 0;
    } else if (player.x > canvas.width - player.width) {
        player.x = canvas.width - player.width;
    }
};

const draw = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
};

const gameLoop = () => {
    update();
    draw();
    requestAnimationFrame(gameLoop);
};

// Start the game loop
requestAnimationFrame(gameLoop);
