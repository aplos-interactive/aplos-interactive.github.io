const targetCanvas = document.getElementById('targetCanvas');
const targetCtx = targetCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawingCanvas');
const ctx = drawingCanvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const clearButton = document.getElementById('clearButton');
const newChallengeButton = document.getElementById('newChallengeButton');
const scoreButton = document.getElementById('scoreButton');
const scoreDisplay = document.getElementById('scoreDisplay');

let isDrawing = false;
let x = 0;
let y = 0;
let currentTargetImageData;

drawingCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
});

drawingCanvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        draw(e.offsetX, e.offsetY);
    }
});

drawingCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

drawingCanvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

function draw(newX, newY) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(newX, newY);
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.stroke();
    x = newX;
    y = newY;
}

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
});

function generateTargetImage() {
    const shapes = ['circle', 'square', 'cat'];
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    const centerX = targetCanvas.width / 2;
    const centerY = targetCanvas.height / 2;
    const size = 20;

    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.fillStyle = randomColor;
    targetCtx.strokeStyle = randomColor;
    targetCtx.lineWidth = 3;

    switch (randomShape) {
        case 'circle':
            targetCtx.beginPath();
            targetCtx.arc(centerX, centerY, size, 0, 2 * Math.PI);
            targetCtx.fill();
            break;
        case 'square':
            targetCtx.fillRect(centerX - size, centerY - size, size * 2, size * 2);
            break;
        case 'cat':
            targetCtx.beginPath();
            targetCtx.arc(centerX - size / 2, centerY - size / 2, size / 2, 0, 2 * Math.PI);
            targetCtx.arc(centerX + size / 2, centerY - size / 2, size / 2, 0, 2 * Math.PI);
            targetCtx.arc(centerX, centerY + size / 4, size, 0, Math.PI);
            targetCtx.stroke();
            break;
    }

    currentTargetImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
}

function scoreDrawing() {
    const drawnImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    let similarityScore = compareImages(currentTargetImageData, drawnImageData);
    scoreDisplay.textContent = `Score: ${Math.round(similarityScore * 10)}`;
}

function compareImages(imgData1, imgData2) {
    if (!imgData1 || !imgData2) {
        console.error("One or both image data objects are null.");
        return 0;
    }

    const gridSize = 10;
    const width1 = imgData1.width;
    const height1 = imgData1.height;
    const width2 = drawingCanvas.width;
    const height2 = drawingCanvas.height;

    const grid1 = createPixelDensityGrid(imgData1, width1, height1, gridSize);
    const grid2 = createPixelDensityGrid(ctx.getImageData(0, 0, width2, height2), width2, height2, gridSize);

    let similarityScore = 0;
    const totalCells = gridSize * gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const density1 = grid1[i][j] / (width1 / gridSize * height1 / gridSize);
            const density2 = grid2[i][j] / (width2 / gridSize * height2 / gridSize);

            const densityDifference = Math.abs(density1 - density2);
            similarityScore += (1 - densityDifference);
        }
    }

    const finalScore = similarityScore / totalCells;
    return finalScore;
}

function createPixelDensityGrid(imageData, width, height, gridSize) {
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    const data = imageData.data;

    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const gridRow = Math.floor(i / cellHeight);
            const gridCol = Math.floor(j / cellWidth);
            const pixelIndex = (i * width + j) * 4;
            const alpha = data[pixelIndex + 3];

            if (alpha > 0) {
                grid[gridRow][gridCol]++;
            }
        }
    }
}

newChallengeButton.addEventListener('click', generateTargetImage);
scoreButton.addEventListener('click', scoreDrawing);

generateTargetImage();
