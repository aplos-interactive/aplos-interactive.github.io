const player = document.querySelector('.player');
const ground = document.querySelector('.ground');
const obstacle = document.querySelector('.obstacle');
const scoreDisplay = document.getElementById('score');
const gameContainer = document.querySelector('.game-container');

let score = 0;
let isJumping = false;

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isJumping) {
        jump();
    }
});

function jump() {
    isJumping = true;
    let upTime = setInterval(() => {
        let playerBottom = parseInt(window.getComputedStyle(player).bottom);
        if (playerBottom >= 150) {
            clearInterval(upTime);
            let downTime = setInterval(() => {
                playerBottom = parseInt(window.getComputedStyle(player).bottom);
                player.style.bottom = playerBottom - 5 + 'px';
                if (playerBottom <= 0) { // Changed from 50 to 0 to land properly
                    clearInterval(downTime);
                    isJumping = false;
                }
            }, 20);
        } else {
            player.style.bottom = playerBottom + 10 + 'px';
        }
    }, 20);
}

function checkCollision() {
    let playerRect = player.getBoundingClientRect();
    let obstacleRect = obstacle.getBoundingClientRect();

    if (
        playerRect.bottom > obstacleRect.top &&
        playerRect.top < obstacleRect.bottom &&
        playerRect.right > obstacleRect.left &&
        playerRect.left < obstacleRect.right
    ) {
        // Collision detected - Game over for now
        alert(`Game Over! Your score: ${score}`);
        score = 0;
        scoreDisplay.textContent = score;
        obstacle.style.animationPlayState = 'paused';
        ground.style.animationPlayState = 'paused';
        // You would typically reset the game here
        setTimeout(() => { // Small delay before resetting animations
            obstacle.style.animationPlayState = 'running';
            ground.style.animationPlayState = 'running';
        }, 1000);
    }
}

function updateScore() {
    score++;
    scoreDisplay.textContent = score;
}

setInterval(updateScore, 100); // Update score every 100 milliseconds
setInterval(checkCollision, 10); // Check for collision frequently
