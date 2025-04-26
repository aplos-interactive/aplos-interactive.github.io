const board = document.querySelector(".board");
const cells = document.querySelectorAll(".cell");
const messageContainer = document.querySelector(".message-container");
let currentPlayer = "X";
let gameBoard = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;
const enableAI = document.getElementById('enableAI'); // Get the enableAI checkbox

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
];

function handleCellClick(clickedCellEvent) {
    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.dataset.index);

    if (gameBoard[clickedCellIndex] !== "" || !gameActive || (currentPlayer === 'O' && enableAI.checked)) {
        return;
    }

    gameBoard[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add(currentPlayer === "X" ? "playerX" : "playerO");

    checkWin();

    if (gameActive) {
        const previousPlayer = currentPlayer; // Store the current player before switching
        switchPlayer();
        if (previousPlayer === 'X' && currentPlayer === 'O' && enableAI.checked && gameActive) {
            board.classList.add('disabled');
            setTimeout(makeAIMove, 500);
        }
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
}

function checkWin() {
    for (let i = 0; i < winningCombinations.length; i++) {
        const winCondition = winningCombinations[i];
        const a = gameBoard[winCondition[0]];
        const b = gameBoard[winCondition[1]];
        const c = gameBoard[winCondition[2]];

        if (a !== "" && a === b && b === c) {
            gameActive = false;
            displayWinner(currentPlayer);
            return;
        }
    }

    if (!gameBoard.includes("")) {
        gameActive = false;
        displayDraw();
    }
}

function displayWinner(winner) {
    messageContainer.textContent = `Player ${winner} wins!`;
}

function displayDraw() {
    messageContainer.textContent = "It's a draw!";
}

cells.forEach((cell) => {
    cell.addEventListener("click", handleCellClick);
});

const resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", resetGame);

function resetGame() {
    gameBoard = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    messageContainer.textContent = "";
    enableAI.checked = true; // Reset AI to enabled by default

    cells.forEach((cell) => {
        cell.textContent = "";
        cell.classList.remove("playerX");
        cell.classList.remove("playerO");
    });
    board.classList.remove('disabled');
}

function makeAIMove() {
    if (!gameActive) {
        return;
    }

    // AI tries to win
    const winningMove = findWinningMove('O');
    if (winningMove !== null) {
        makeMove(winningMove, 'O');
        return;
    }

    // AI tries to block the player's winning move
    const blockingMove = findWinningMove('X');
    if (blockingMove !== null) {
        makeMove(blockingMove, 'O');
        return;
    }

    // AI makes a random move
    const emptyCells = gameBoard.reduce((acc, val, index) => {
        if (val === '') {
            acc.push(index);
        }
        return acc;
    }, []);

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const randomMove = emptyCells[randomIndex];
        makeMove(randomMove, 'O');
    }
}

function findWinningMove(player) {
    for (let i = 0; i < winningCombinations.length; i++) {
        const [a, b, c] = winningCombinations[i];
        const boardValues = [gameBoard[a], gameBoard[b], gameBoard[c]];
        const playerCount = boardValues.filter(val => val === player).length;
        const emptyIndex = boardValues.indexOf('');

        if (playerCount === 2 && emptyIndex !== -1) {
            return winningCombinations[i][emptyIndex];
        }
    }
    return null;
}

function makeMove(cellIndex, player) {
    gameBoard[cellIndex] = player;
    cells[cellIndex].textContent = player;
    cells[cellIndex].classList.add(player === 'X' ? 'playerX' : 'playerO');
    checkWin();
    if (gameActive) {
        switchPlayer(); // Switch back to the human player after AI's move
    }
    board.classList.remove('disabled');
}
