const board = document.querySelector(".board")
const cells = document.querySelectorAll(".cell")
const messageContainer = document.querySelector(".message-container")
let currentPlayer = "X"
let gameBoard = ["", "", "", "", "", "", "", "", ""]
let gameActive = true

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
]

function handleCellClick(clickedCellEvent) {
  const clickedCell = clickedCellEvent.target
  const clickedCellIndex = parseInt(clickedCell.dataset.index)

  if (gameBoard[clickedCellIndex] !== "" || !gameActive) {
    return
  }

  gameBoard[clickedCellIndex] = currentPlayer
  clickedCell.textContent = currentPlayer
  clickedCell.classList.add(currentPlayer === "X" ? "playerX" : "playerO") // Optional styling

  checkWin()
  if (gameActive) {
    switchPlayer()
  }
}

function switchPlayer() {
  currentPlayer = currentPlayer === "X" ? "O" : "X"
}

function checkWin() {
  for (let i = 0; i < winningCombinations.length; i++) {
    const winCondition = winningCombinations[i]
    const a = gameBoard[winCondition[0]]
    const b = gameBoard[winCondition[1]]
    const c = gameBoard[winCondition[2]]

    if (a !== "" && a === b && b === c) {
      gameActive = false
      displayWinner(currentPlayer)
      return
    }
  }

  if (!gameBoard.includes("")) {
    gameActive = false
    displayDraw()
  }
}

function displayWinner(winner) {
  messageContainer.textContent = `Player ${winner} wins!`
}

function displayDraw() {
  messageContainer.textContent = "It's a draw!"
}

cells.forEach((cell) => {
  cell.addEventListener("click", handleCellClick)
})

const resetButton = document.getElementById("resetButton")
resetButton.addEventListener("click", resetGame)
function resetGame() {
  gameBoard = ["", "", "", "", "", "", "", "", ""]
  gameActive = true
  currentPlayer = "X"
  messageContainer.textContent = ""

  cells.forEach((cell) => {
    cell.textContent = ""
    cell.classList.remove("playerX")
    cell.classList.remove("playerO")
  })
}
