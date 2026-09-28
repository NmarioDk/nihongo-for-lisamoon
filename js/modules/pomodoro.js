/**
 * Pomodoro Module
 * Review session timer (25 min focus / 5 min break)
 * Gentle audio chime synthesized via Web Audio API
 */

import { t } from "../i18n.js";
import { incrementPomodoro, loadProgress } from "../storage/progress.js";

let timerInterval = null;
let timeLeft = 25 * 60; // seconds
let isRunning = false;
let mode = "focus"; // "focus" or "break"
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Gentle pleasant chime (pure Web Audio synthesizer, zero external assets)
function playChime(isBreakStart) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    const baseFreq = isBreakStart ? 587.33 : 523.25; // D5 or C5
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.3);
    
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 1.2);
  } catch (e) {
    console.warn("Could not play chime", e);
  }
}

export function initPomodoro(container, state, onUpdateStats) {
  function render() {
    const progress = loadProgress();
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    const modeTitle = mode === "focus" ? t("pomoFocusTime") : t("pomoBreakTime");

    container.innerHTML = `
      <div class="module-card pomodoro-card">
        <div class="module-header">
          <div class="module-icon">⏱️</div>
          <div>
            <h2 class="module-title">${t("pomoTitle")}</h2>
            <p class="module-desc">${t("pomoDesc")}</p>
          </div>
        </div>

        <div class="pomodoro-timer-container ${mode}">
          <div class="timer-mode-badge">${modeTitle}</div>
          <div class="timer-display" id="pomo-display">${formattedTime}</div>
          <div class="pomo-target-info">
            <span>${t("pomoTargetSection")}</span>
            <strong class="target-badge">Lesson ${state.selectedLesson}-${state.selectedPart}</strong>
          </div>
        </div>

        <div class="pomodoro-controls">
          <button id="pomo-toggle-btn" class="btn btn-primary btn-large">
            ${isRunning ? t("pause") : t("start")}
          </button>
          <button id="pomo-reset-btn" class="btn btn-secondary">
            ${t("reset")}
          </button>
          <button id="pomo-switch-mode-btn" class="btn btn-outline">
            ${mode === "focus" ? t("pomoBreakTime") : t("pomoFocusTime")}
          </button>
        </div>

        <div class="pomodoro-footer">
          <p class="sessions-count">
            ${t("pomoCompletedSessions", { n: progress.completedPomodorosToday || 0 })}
          </p>
          <p class="pomo-tip">${t("pomoTip")}</p>
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    const toggleBtn = container.querySelector("#pomo-toggle-btn");
    const resetBtn = container.querySelector("#pomo-reset-btn");
    const switchModeBtn = container.querySelector("#pomo-switch-mode-btn");

    if (toggleBtn) {
      toggleBtn.onclick = () => {
        getAudioContext(); // Unlock Web Audio on user gesture
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      };
    }

    if (resetBtn) {
      resetBtn.onclick = () => {
        pauseTimer();
        timeLeft = mode === "focus" ? 25 * 60 : 5 * 60;
        render();
      };
    }

    if (switchModeBtn) {
      switchModeBtn.onclick = () => {
        pauseTimer();
        mode = mode === "focus" ? "break" : "focus";
        timeLeft = mode === "focus" ? 25 * 60 : 5 * 60;
        render();
      };
    }
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        const display = container.querySelector("#pomo-display");
        if (display) {
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }
      } else {
        // Timer completed!
        clearInterval(timerInterval);
        isRunning = false;
        
        if (mode === "focus") {
          playChime(true);
          incrementPomodoro();
          if (onUpdateStats) onUpdateStats();
          mode = "break";
          timeLeft = 5 * 60;
        } else {
          playChime(false);
          mode = "focus";
          timeLeft = 25 * 60;
        }
        render();
      }
    }, 1000);
    render();
  }

  function pauseTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning = false;
    render();
  }

  render();

  return {
    destroy: () => {
      if (timerInterval) clearInterval(timerInterval);
    }
  };
}
