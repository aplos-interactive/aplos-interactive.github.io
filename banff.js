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

// Drawing functionality (remains the same as before)
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
            // Very basic cat outline
            targetCtx.beginPath();
            targetCtx.arc(centerX - size / 2, centerY - size / 2, size / 2, 0, 2 * Math.PI); // Ear 1
            targetCtx.arc(centerX + size / 2, centerY - size / 2, size / 2, 0, 2 * Math.PI); // Ear 2
            targetCtx.arc(centerX, centerY + size / 4, size, 0, Math.PI); // Face
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
        return 0;
    }

    const gridSize = 10; // Divide the canvas into 10x10 grid
    const width1 = imgData1.width;
    const height1 = imgData1.height;
    const width2 = drawingCanvas.width; // Use the drawing canvas width
    const height2 = drawingCanvas.height; // Use the drawing canvas height

    const grid1 = createPixelDensityGrid(imgData1, width1, height1, gridSize);
    const grid2 = createPixelDensityGrid(ctx.getImageData(0, 0, width2, height2), width2, height2, gridSize);

    let similarityScore = 0;
    const totalCells = gridSize * gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Normalize the pixel densities to be between 0 and 1
            const density1 = grid1[i][j] / (width1 / gridSize * height1 / gridSize);
            const density2 = grid2[i][j] / (width2 / gridSize * height2 / gridSize);

            // Calculate the difference in density (lower difference means higher similarity)
            const densityDifference = Math.abs(density1 - density2);

            // Add to the similarity score (inversely proportional to the difference)
            similarityScore += (1 - densityDifference);
        }
    }

    return similarityScore / totalCells; // Average similarity across all grid cells
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
            const alpha = data[pixelIndex + 3]; // Check alpha channel for transparency

            if (alpha > 0) { // If the pixel is not transparent
                grid[gridRow][gridCol]++;
            }
        }
    }

    return grid;
}
    let equalPixels = 0;
    const totalPixels = imgData1.data.length / 4; // RGBA

    // Resize the drawn image data to match the target image size for comparison
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = imgData1.width;
    tempCanvas.height = imgData1.height;
    tempCtx.putImageData(imgData2, 0, 0, 0, 0, imgData1.width, imgData1.height);
    const resizedDrawnImageData = tempCtx.getImageData(0, 0, imgData1.width, imgData1.height);


    for (let i = 0; i < imgData1.data.length; i += 4) {
        if (imgData1.data[i] === resizedDrawnImageData.data[i] &&
            imgData1.data[i + 1] === resizedDrawnImageData.data[i + 1] &&
            imgData1.data[i + 2] === resizedDrawnImageData.data[i + 2] &&
            resizedDrawnImageData.data[i + 3] > 0) { // Consider drawn pixel if it's not transparent
            equalPixels++;
        }
    }

    return totalPixels > 0 ? equalPixels / totalPixels : 0;
}

newChallengeButton.addEventListener('click', generateTargetImage);
scoreButton.addEventListener('click', scoreDrawing);

// Generate the first target image on load
generateTargetImage();
