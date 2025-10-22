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

// Marker tool buttons
const thinBtn = document.createElement("button");
thinBtn.textContent = "Fine Brush";
document.body.appendChild(thinBtn);

const thickBtn = document.createElement("button");
thickBtn.textContent = "Bold Brush";
document.body.appendChild(thickBtn);

// Data driven sticker list
const stickerSet: string[] = ["💾", "🎮", "🧠"];
const stickerContainer = document.createElement("div");
document.body.appendChild(stickerContainer);

//Custom events moved
const DRAWING_CHANGED = "drawing-changed";
const TOOL_MOVED = "tool-moved";

function notifyDrawingChanged() {
  canvas.dispatchEvent(new Event(DRAWING_CHANGED));
}

function notifyToolMoved() {
  canvas.dispatchEvent(new Event(TOOL_MOVED));
}

// Helper to rebuild sticker buttons
function renderStickers() {
  stickerContainer.innerHTML = "";
  for (const emoji of stickerSet) {
    const btn = document.createElement("button");
    btn.textContent = emoji;
    btn.addEventListener("click", () => selectSticker(emoji, btn));
    stickerContainer.appendChild(btn);
  }

  // Custom sticker button
  const customBtn = document.createElement("button");
  customBtn.textContent = "+";
  customBtn.title = "Add custom sticker";
  customBtn.addEventListener("click", () => {
    const userEmoji = prompt("Enter a custom sticker", "✨");
    if (userEmoji && userEmoji.trim() !== "") {
      stickerSet.push(userEmoji);
      renderStickers();
      notifyToolMoved();
    }
  });
  stickerContainer.appendChild(customBtn);
}

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

const exportBtn = document.createElement("button");
exportBtn.textContent = "Export";
document.body.appendChild(exportBtn);

// Interface
interface DisplayCommand {
  display(ctx: CanvasRenderingContext2D): void;
}

// Helpers for our Step 12
function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 90%, 45%)`;
}
function randomRotation(): number {
  return Math.floor(Math.random() * 360);
}

// Marker line
class MarkerLine implements DisplayCommand {
  private points: { x: number; y: number }[];
  private thickness: number;
  private color: string;

  constructor(
    startX: number,
    startY: number,
    thickness: number,
    color: string,
  ) {
    this.points = [{ x: startX, y: startY }];
    this.thickness = thickness;
    this.color = color;
  }

  drag(x: number, y: number) {
    this.points.push({ x, y });
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    const first = this.points[0]!;
    ctx.lineWidth = this.thickness;
    ctx.strokeStyle = this.color;
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < this.points.length; i++) {
      const p = this.points[i]!;
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
}

// Sticker command
class StickerCommand implements DisplayCommand {
  private emoji: string;
  private x: number;
  private y: number;
  private rotation: number;

  constructor(emoji: string, x: number, y: number, rotation: number) {
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.rotation = rotation;
  }

  drag(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.font = "32px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
}

// Tool preview
class ToolPreview implements DisplayCommand {
  private x: number;
  private y: number;
  private size: number;
  private emoji: string | null;

  constructor(x: number, y: number, size: number, emoji: string | null = null) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.emoji = emoji;
  }

  update(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setEmoji(emoji: string | null) {
    this.emoji = emoji;
  }

  display(ctx: CanvasRenderingContext2D) {
    if (this.emoji) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((currentRotation * Math.PI) / 180);
      ctx.font = "32px sans-serif";
      ctx.globalAlpha = 0.6;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1.0;
    } else {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Drawing data
let drawing: DisplayCommand[] = [];
let redoStack: DisplayCommand[] = [];
let currentLine: MarkerLine | null = null;
let currentSticker: StickerCommand | null = null;
let toolPreview: ToolPreview | null = null;

// State
let isDrawing = false;
let currentTool: "marker" | "sticker" = "marker";
let currentThickness = 3;
let currentEmoji: string | null = null;
let currentColor = randomColor();
let currentRotation = randomRotation();

// Tool selection
function selectMarker(thickness: number, button: HTMLButtonElement) {
  currentTool = "marker";
  currentThickness = thickness;
  currentEmoji = null;
  currentColor = randomColor();
  updateSelectedTool(button);
  notifyToolMoved();
}

function selectSticker(emoji: string, button: HTMLButtonElement) {
  currentTool = "sticker";
  currentEmoji = emoji;
  currentRotation = randomRotation();
  updateSelectedTool(button);
  notifyToolMoved();
}

function updateSelectedTool(selected: HTMLButtonElement) {
  document.querySelectorAll("button").forEach((btn) =>
    btn.classList.remove("selectedTool")
  );
  selected.classList.add("selectedTool");
}

// Default tool
selectMarker(3, thinBtn);

// Redraw
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const command of drawing) command.display(ctx);
  if (!isDrawing && toolPreview) toolPreview.display(ctx);
}

canvas.addEventListener(DRAWING_CHANGED, redraw);
canvas.addEventListener(TOOL_MOVED, redraw);

// Mouse logic
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (currentTool === "marker") {
    currentLine = new MarkerLine(x, y, currentThickness, currentColor);
    drawing.push(currentLine);
  } else if (currentTool === "sticker" && currentEmoji) {
    currentSticker = new StickerCommand(currentEmoji, x, y, currentRotation);
    drawing.push(currentSticker);
  }

  redoStack = [];
  notifyDrawingChanged();
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isDrawing) {
    if (currentTool === "marker" && currentLine) currentLine.drag(x, y);
    else if (currentTool === "sticker" && currentSticker) {
      currentSticker.drag(x, y);
    }
    notifyDrawingChanged();
  } else {
    if (!toolPreview) {
      toolPreview = new ToolPreview(x, y, currentThickness, currentEmoji);
    } else {
      toolPreview.update(x, y);
      toolPreview.setEmoji(currentEmoji);
    }
    notifyToolMoved();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  currentLine = null;
  currentSticker = null;
});
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentLine = null;
  currentSticker = null;
  toolPreview = null;
  notifyToolMoved();
});

// Undo / Redo / Clear
undoBtn.addEventListener("click", () => {
  if (drawing.length === 0) return;
  redoStack.push(drawing.pop()!);
  notifyDrawingChanged();
});
redoBtn.addEventListener("click", () => {
  if (redoStack.length === 0) return;
  drawing.push(redoStack.pop()!);
  notifyDrawingChanged();
});
clearBtn.addEventListener("click", () => {
  drawing = [];
  redoStack = [];
  notifyDrawingChanged();
});

// Export button handler
exportBtn.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(4, 4);
  exportCtx.lineCap = "round";
  for (const command of drawing) command.display(exportCtx);

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});

// Tool buttons
thinBtn.addEventListener("click", () => selectMarker(3, thinBtn));
thickBtn.addEventListener("click", () => selectMarker(10, thickBtn));

// Render initial stickers
renderStickers();
