const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gameLoop = () => {
    // 1. Update game state
    update();

    // 2. Draw everything
    draw();

    // 3. Request the next frame
    requestAnimationFrame(gameLoop);
};

const update = () => {
    // This function will contain logic to update game elements
};

const draw = () => {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // This function will contain logic to draw game elements
};

// Start the game loop
requestAnimationFrame(gameLoop);
