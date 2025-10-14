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
ctx.lineCap = "round";
ctx.strokeStyle = "black";

// Tool buttons
const thinBtn = document.createElement("button");
thinBtn.textContent = "Thin";
document.body.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Thick";
document.body.appendChild(thickBtn);

// Action buttons
const undoBtn = document.createElement("button");
undoBtn.textContent = "Undo";
document.body.appendChild(undoBtn);

const redoBtn = document.createElement("button");
redoBtn.textContent = "Redo";
document.body.appendChild(redoBtn);

const clearBtn = document.createElement("button");
clearBtn.textContent = "Clear";
document.body.appendChild(clearBtn);

// Interface: anything that can display itself on a canvas
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// Class representing one marker line
class MarkerLine implements DisplayCommand {
  private points: { x: number; y: number }[];
  private thickness: number;

  constructor(startX: number, startY: number, thickness: number) {
    this.points = [{ x: startX, y: startY }];
    this.thickness = thickness;
  }

  // Extend the line
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  // Draw itself
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    const first = this.points[0]!;
    ctx.lineWidth = this.thickness;
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i]!;
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

// Drawing data
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentLine: MarkerLine | null = null;

// Drawing state
let isDrawing = false;

// Current tool style
let currentThickness = 2;

// Handle tool selection
function selectTool(thickness: number, button: HTMLButtonElement) {
  currentThickness = thickness;
  thinBtn.classList.remove("selectedTool");
  thickBtn.classList.remove("selectedTool");
  button.classList.add("selectedTool");
}

// Default tool is thin
selectTool(2, thinBtn);

// Redraw everything when drawing changes
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of drawing) {
    command.display(ctx);
  }
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
  currentLine = new MarkerLine(x, y, currentThickness);
  drawing.push(currentLine);
  redoStack = [];
  notifyDrawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentLine) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  currentLine.drag(x, y);
  notifyDrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentLine = null;
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

// Tool button handlers
thinBtn.addEventListener("click", () => selectTool(2, thinBtn));
thickBtn.addEventListener("click", () => selectTool(6, thickBtn));
