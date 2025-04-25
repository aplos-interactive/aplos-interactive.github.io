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
    const width = targetCanvas.width;
    const height = targetCanvas.height;
    targetCtx.clearRect(0, 0, width, height);

    const shapeType = Math.random();
    const color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;

    targetCtx.fillStyle = color;
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = 5;
    targetCtx.lineCap = 'round';

    if (shapeType < 0.33) {
        // Draw a circle
        const radius = Math.random() * 20 + 10;
        const x = Math.random() * (width - 2 * radius) + radius;
        const y = Math.random() * (height - 2 * radius) + radius;
        targetCtx.beginPath();
        targetCtx.arc(x, y, radius, 0, 2 * Math.PI);
        targetCtx.fill();
    } else if (shapeType < 0.66) {
        // Draw a rectangle
        const rectWidth = Math.random() * 40 + 20;
        const rectHeight = Math.random() * 30 + 15;
        const x = Math.random() * (width - rectWidth);
        const y = Math.random() * (height - rectHeight);
        targetCtx.fillRect(x, y, rectWidth, rectHeight);
    } else {
        // Draw a line
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        targetCtx.beginPath();
        targetCtx.moveTo(x1, y1);
        targetCtx.lineTo(x2, y2);
        targetCtx.stroke();
    }
    currentTargetImageData = targetCtx.getImageData(0, 0, width, height);
}
}

function scoreDrawing() {
    const drawnImageData = ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    let similarityScore = compareImages(currentTargetImageData, drawnImageData);
    scoreDisplay.textContent = `Score: ${Math.round(similarityScore * 10)}`;
function compareImages(imgData1, imgData2) {
    if (!imgData1 || !imgData2) {
        return 0;
    }

    const width1 = imgData1.width;
    const height1 = imgData1.height;
    const width2 = drawingCanvas.width;
    const height2 = drawingCanvas.height;

    // Create a temporary canvas to scale the drawing to the target size
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width1;
    tempCanvas.height = height1;
    tempCtx.drawImage(drawingCanvas, 0, 0, width2, height2, 0, 0, width1, height1);
    const resizedDrawnImageData = tempCtx.getImageData(0, 0, width1, height1);

    let targetPixels = 0;
    let drawnPixelsInTargetArea = 0;

    // Iterate through the pixels of the target image
    for (let i = 0; i < imgData1.data.length; i += 4) {
        const r1 = imgData1.data[i];
        const g1 = imgData1.data[i + 1];
        const b1 = imgData1.data[i + 2];
        const a1 = imgData1.data[i + 3];

        // If the target pixel is not transparent, count it
        if (a1 > 0) {
            targetPixels++;

            const r2 = resizedDrawnImageData.data[i];
            const g2 = resizedDrawnImageData.data[i + 1];
            const b2 = resizedDrawnImageData.data[i + 2];
            const a2 = resizedDrawnImageData.data[i + 3];

            // If the corresponding drawn pixel is not transparent, count it as a match in the target area
            if (a2 > 0) {
                drawnPixelsInTargetArea++;
            }
        }
    }

    // Calculate a similarity score based on the ratio of drawn pixels within the target area
    const similarity = targetPixels > 0 ? drawnPixelsInTargetArea / targetPixels : 0;
    return similarity;
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
