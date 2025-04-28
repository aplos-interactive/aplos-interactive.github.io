const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keys = {};

window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
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
    // Handle horizontal movement
    if (keys['ArrowLeft']) {
        player.velocityX = -5; // Move left at a speed of 5 pixels per frame
    } else if (keys['ArrowRight']) {
        player.velocityX = 5;  // Move right at a speed of 5 pixels per frame
    } else {
        player.velocityX = 0;  // Stop horizontal movement if no arrow key is pressed
    }

    // Update player's x position based on velocity
    player.x += player.velocityX;

    // Keep player within the bounds of the canvas (horizontally)
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
