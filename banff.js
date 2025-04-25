const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clearButton');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');

let isDrawing = false;
let x = 0;
let y = 0;

canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        draw(ctx, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

window.addEventListener('mouseup', () => {
    isDrawing = false;
});

clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

function draw(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
