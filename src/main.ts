import "./style.css";

// Title
const title = document.createElement("h1");
title.textContent = "Sticker Sketchpad";
document.body.appendChild(title);

// Canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.id = "sketchCanvas";
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d")!;
ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "black";

// Buttons
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
document.body.appendChild(undoBtn);

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
document.body.appendChild(redoBtn);

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
document.body.appendChild(clearBtn);

// Types
type Point = { x: number; y: number };
type Line = Point[];

// Drawing data
let drawing: Line[] = []; // main display list
let redoStack: Line[] = []; // redo stack
let currentLine: Line = [];

// Drawing state
let isDrawing = false;

// Redraw everything when drawing changes
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  for (const line of drawing) {
    if (line.length === 0) continue;
    const first = line[0]!;
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < line.length; i++) {
      const point = line[i]!;
      ctx.lineTo(point.x, point.y);
    }
  }

  ctx.stroke();
}

// Custom event name
const DRAWING_CHANGED = "drawing-changed";

// Observer
canvas.addEventListener(DRAWING_CHANGED, redraw);

// Helper to notify observers
function notifyDrawingChanged() {
  const event = new Event(DRAWING_CHANGED);
  canvas.dispatchEvent(event);
}

// Event listeners
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentLine = [{ x, y }];
  drawing.push(currentLine);
  redoStack = []; // clear redo history when new line starts
  notifyDrawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentLine.push({ x, y });
  notifyDrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
});

// Undo button handler
undoBtn.addEventListener("click", () => {
  if (drawing.length === 0) return;
  const undone = drawing.pop()!;
  redoStack.push(undone);
  notifyDrawingChanged();
});

// Redo button handler
redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  const redone = redoStack.pop()!;
  drawing.push(redone);
  notifyDrawingChanged();
});

// Clear button handler
clearBtn.addEventListener("click", () => {
  drawing = [];
  redoStack = [];
  notifyDrawingChanged();
});
