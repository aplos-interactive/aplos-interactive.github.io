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
    // For now, let's generate a simple circle
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.beginPath();
    targetCtx.arc(targetCanvas.width / 2, targetCanvas.height / 2, 20, 0, 2 * Math.PI);
    targetCtx.fillStyle = 'blue';
    targetCtx.fill();
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
