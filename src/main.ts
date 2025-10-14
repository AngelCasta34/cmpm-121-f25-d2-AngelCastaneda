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

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

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

// Class for tool preview
class ToolPreview implements DisplayCommand {
  private x: number;
  private y: number;
  private thickness: number;

  constructor(x: number, y: number, thickness: number) {
    this.x = x;
    this.y = y;
    this.thickness = thickness;
  }

  update(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 1;
    ctx.arc(this.x, this.y, this.thickness / 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Drawing data
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentLine: MarkerLine | null = null;

// Tool preview
let toolPreview: ToolPreview | null = null;

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

// Default tool
selectTool(2, thinBtn);

// Redraw everything when drawing changes or tool moves
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of drawing) {
    command.display(ctx);
  }

  // Draw preview only when not drawing
  if (!isDrawing && toolPreview) {
    toolPreview.display(ctx);
  }
}

// Custom event names
const DRAWING_CHANGED = "drawing-changed";
const TOOL_MOVED = "tool-moved";

// Observers
canvas.addEventListener(DRAWING_CHANGED, redraw);
canvas.addEventListener(TOOL_MOVED, redraw);

// Helper to notify observers
function notifyDrawingChanged() {
  const event = new Event(DRAWING_CHANGED);
  canvas.dispatchEvent(event);
}

function notifyToolMoved() {
  const event = new Event(TOOL_MOVED);
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
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDrawing && currentLine) {
    currentLine.drag(x, y);
    notifyDrawingChanged();
  } else {
    // Update tool preview when not drawing
    if (!toolPreview) {
      toolPreview = new ToolPreview(x, y, currentThickness);
    } else {
      toolPreview.update(x, y);
    }
    notifyToolMoved();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentLine = null;
});

canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentLine = null;
  toolPreview = null;
  notifyToolMoved();
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
