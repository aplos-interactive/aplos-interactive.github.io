const clickButton = document.getElementById('clickButton');
const scoreDisplay = document.getElementById('score');
let score = 0;

clickButton.addEventListener('click', () => {
    score++;
    scoreDisplay.textContent = score;
});
