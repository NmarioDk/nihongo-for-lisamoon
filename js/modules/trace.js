/**
 * Tracing Module (Character Tracing Studio)
 * Compliant with AGENTS.md:
 * - Tactile drawing area (finger, stylus, or mouse) via PointerEvents
 * - Reference model displayed side-by-side
 * - Clear canvas, Undo stroke
 * - Self-evaluation feedback (validated by user)
 */

import { t } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../data/vocabulary.js";
import { setWordStatus } from "../storage/progress.js";

export function initTrace(container, state, onUpdateStats) {
  let currentItem = null;
  let strokeHistory = []; // Stack of strokes for undo
  let currentStroke = [];
  let isDrawing = false;
  let brushSize = 6;
  let canvas = null;
  let ctx = null;
  let evalFeedback = null;

  // Rule: Never show an entry containing "TO VERIFY"
  function isExcluded(item) {
    if (!item) return true;
    const combined = `${item.japanese || ""} ${item.english || ""} ${item.romaji || ""}`.toUpperCase();
    return combined.includes("TO VERIFY");
  }

  // Rule: Display only the Japanese word in the model, without editorial annotations
  function cleanJapaneseModel(text) {
    if (!text) return "";
    let clean = text
      .replace(/\[.*?\]/g, "") // Remove bracketed annotations like [handwritten addition]
      .replace(/\([a-zA-Z\s°?]+\)/g, "") // Remove any Latin notes in parentheses like (polite)
      .trim();
    // Clean up multiple spaces
    clean = clean.replace(/\s+/g, " ");
    return clean;
  }

  // Rule: Adapt font size dynamically so text never overflows the container
  function getDynamicFontSize(text) {
    const len = text ? text.length : 0;
    if (len <= 2) return "3.5rem";
    if (len <= 5) return "2.5rem";
    if (len <= 8) return "1.9rem";
    if (len <= 12) return "1.45rem";
    return "1.2rem";
  }

  function pickTraceItem() {
    const pool = VOCABULARY_ITEMS.filter(item => {
      if (isExcluded(item)) return false;
      return (state.selectedLesson === "all" || item.lesson === parseInt(state.selectedLesson, 10)) &&
             (state.selectedPart === "all" || item.part === parseInt(state.selectedPart, 10));
    });

    const fallbackList = VOCABULARY_ITEMS.filter(item => !isExcluded(item));
    const list = pool.length > 0 ? pool : fallbackList;
    currentItem = list[Math.floor(Math.random() * list.length)];
    strokeHistory = [];
    currentStroke = [];
    evalFeedback = null;
  }

  function render() {
    if (!currentItem || isExcluded(currentItem)) {
      pickTraceItem();
    }

    const displayJapanese = cleanJapaneseModel(currentItem.japanese);
    const dynamicSize = getDynamicFontSize(displayJapanese);

    container.innerHTML = `
      <div class="module-card trace-card">
        <div class="module-header">
          <div class="module-icon">✍️</div>
          <div>
            <h2 class="module-title">${t("traceTitle")}</h2>
            <p class="module-desc">${t("traceDesc")}</p>
          </div>
        </div>

        <div class="trace-workspace">
          <!-- Reference Model Panel -->
          <div class="trace-panel trace-reference-panel">
            <div class="panel-header">
              <span class="panel-title">${t("traceReference")}</span>
              <button id="trace-next-item-btn" class="btn btn-outline btn-small">
                🔄 ${t("next")}
              </button>
            </div>

            <div class="trace-model-display">
              <div class="model-character" style="font-size: ${dynamicSize};">${displayJapanese}</div>
              <div class="model-romaji">${currentItem.romaji}</div>
              <div class="model-meaning">${currentItem.english}</div>
              <div class="model-tag">Lesson ${currentItem.section}</div>
            </div>
          </div>

          <!-- Drawing Canvas Panel -->
          <div class="trace-panel trace-canvas-panel">
            <div class="panel-header">
              <span class="panel-title">${t("traceCanvasTitle")}</span>
              <div class="canvas-quick-tools">
                <button id="trace-undo-btn" class="btn btn-secondary btn-small" title="${t("traceUndo")}">
                  ↩ ${t("traceUndo")}
                </button>
                <button id="trace-clear-btn" class="btn btn-secondary btn-small" title="${t("traceClear")}">
                  🗑️ ${t("traceClear")}
                </button>
              </div>
            </div>

            <div class="canvas-wrapper">
              <canvas id="trace-canvas" width="360" height="360"></canvas>
              <!-- Grid background guides (quadrant lines like Genkō yōshi) -->
              <div class="canvas-grid-overlay"></div>
            </div>

            <div class="trace-tool-bar">
              <div class="brush-size-picker">
                <label for="brush-size-slider">${t("traceBrushSize")}:</label>
                <input type="range" id="brush-size-slider" min="3" max="18" value="${brushSize}" />
                <span id="brush-size-val">${brushSize}px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Self-Evaluation Bar -->
        <div class="trace-eval-bar">
          <div class="eval-question">${t("traceEvalQuestion")}</div>
          <div class="eval-buttons">
            <button id="trace-eval-retry-btn" class="btn btn-warning">
              🔄 ${t("traceEvalRetry")}
            </button>
            <button id="trace-eval-good-btn" class="btn btn-success">
              ✓ ${t("traceEvalGood")}
            </button>
          </div>
        </div>

        ${evalFeedback ? `
          <div class="alert alert-success animate-fade-in text-center">
            ${evalFeedback}
          </div>
        ` : ""}
      </div>
    `;

    setupCanvas();
    setupEvents();
  }

  function setupCanvas() {
    canvas = container.querySelector("#trace-canvas");
    if (!canvas) return;

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || 360;
    const displayHeight = rect.height || 360;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b"; // Dark ink color

    redrawCanvas();

    // Setup Pointer Events (touch, stylus, mouse unified)
    canvas.style.touchAction = "none"; // Prevent scrolling while drawing

    canvas.onpointerdown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      isDrawing = true;
      const pt = getCanvasPoint(e);
      currentStroke = [pt];
    };

    canvas.onpointermove = (e) => {
      if (!isDrawing) return;
      const pt = getCanvasPoint(e);
      currentStroke.push(pt);

      // Draw the incremental segment
      if (currentStroke.length >= 2) {
        const p1 = currentStroke[currentStroke.length - 2];
        const p2 = currentStroke[currentStroke.length - 1];
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    };

    const stopDrawing = (e) => {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 0) {
        strokeHistory.push({
          points: currentStroke,
          size: brushSize
        });
        currentStroke = [];
      }
    };

    canvas.onpointerup = stopDrawing;
    canvas.onpointercancel = stopDrawing;
  }

  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function redrawCanvas() {
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Redraw all strokes from history
    strokeHistory.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }

  function setupEvents() {
    // Next item
    const nextBtn = container.querySelector("#trace-next-item-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        pickTraceItem();
        render();
      };
    }

    // Undo stroke
    const undoBtn = container.querySelector("#trace-undo-btn");
    if (undoBtn) {
      undoBtn.onclick = () => {
        if (strokeHistory.length > 0) {
          strokeHistory.pop();
          redrawCanvas();
        }
      };
    }

    // Clear canvas
    const clearBtn = container.querySelector("#trace-clear-btn");
    if (clearBtn) {
      clearBtn.onclick = () => {
        strokeHistory = [];
        redrawCanvas();
      };
    }

    // Brush size slider
    const slider = container.querySelector("#brush-size-slider");
    const sliderVal = container.querySelector("#brush-size-val");
    if (slider && sliderVal) {
      slider.oninput = (e) => {
        brushSize = parseInt(e.target.value, 10);
        sliderVal.textContent = `${brushSize}px`;
      };
    }

    // Self-evaluation buttons
    const retryBtn = container.querySelector("#trace-eval-retry-btn");
    const goodBtn = container.querySelector("#trace-eval-good-btn");

    if (retryBtn) {
      retryBtn.onclick = () => {
        setWordStatus(currentItem.id, "review");
        if (onUpdateStats) onUpdateStats();
        strokeHistory = [];
        redrawCanvas();
        evalFeedback = `💪 ${t("traceSuccessMsg")}`;
        render();
      };
    }

    if (goodBtn) {
      goodBtn.onclick = () => {
        setWordStatus(currentItem.id, "mastered");
        if (onUpdateStats) onUpdateStats();
        evalFeedback = `🌟 ${t("traceSuccessMsg")}`;
        setTimeout(() => {
          pickTraceItem();
          render();
        }, 1200);
      };
    }
  }

  pickTraceItem();
  render();

  return {
    destroy: () => {}
  };
}
