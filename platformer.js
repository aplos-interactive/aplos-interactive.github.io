const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gravity = 0.5; // Adjust for stronger/weaker gravity

const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    console.log("Key pressed:", event.key); // Debugging line
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

const player = {
    x: 100,             // Initial x-position
    y: canvas.height - 50, // Initial y-position (near the bottom)
    width: 30,          // Width of the player
    height: 50,         // Height of the player
    color: 'red',       // Player's color
    velocityX: 0,       // Horizontal velocity
    velocityY: 0,       // Vertical velocity
    isJumping: false    // Flag to check if the player is currently jumping
};

const update = () => {
    // Handle horizontal movement with 'A' and 'D'
    if (keys['a'] || keys['A']) {
        player.velocityX = -5; // Move left
    } else if (keys['d'] || keys['D']) {
        player.velocityX = 5;  // Move right
    } else {
        player.velocityX = 0;  // Stop horizontal movement
    }

    // Apply gravity
    player.velocityY += gravity;
    player.y += player.velocityY;

    // Jumping logic (spacebar remains the same)
    if (keys[' '] && !player.isJumping) {
        player.velocityY = -15;
        player.isJumping = true;
    }

    // Collision with the bottom of the canvas (ground)
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isJumping = false;
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
