/**
 * Nihongo Path - Main Application Controller
 * Follows AGENTS.md:
 * - 5 separate modules (Pomodoro, Repetition, Quiz, Oral, Tracing) + Podcasts
 * - 10 lessons, 29 sections (Lesson 8 has parts 1 and 2 only, 8-3 does not exist)
 * - Bilingual UI toggle (EN / JA)
 * - Day streak and level gamification
 */

import { t, getLanguage, setLanguage } from "./i18n.js";
import { loadProgress, getMasteredWordsCount, getUserLevel, setSelectedSection } from "./storage/progress.js";
import { initPomodoro } from "./modules/pomodoro.js";
import { initRepetition } from "./modules/repetition.js";
import { initQuiz } from "./modules/quiz.js";
import { initOral } from "./modules/oral.js";
import { initTrace } from "./modules/trace.js";
import { initPodcasts } from "./modules/podcasts.js";

class App {
  constructor() {
    this.currentModule = "repetition";
    this.activeModuleInstance = null;
    this.progress = loadProgress();
    
    this.state = {
      selectedLesson: this.progress.selectedLesson || 1,
      selectedPart: this.progress.selectedPart || 1
    };

    this.init();
  }

  init() {
    this.renderShell();
    this.bindGlobalEvents();
    this.loadCurrentModule();
  }

  renderShell() {
    const masteredCount = getMasteredWordsCount();
    const userLevel = getUserLevel(masteredCount);
    const lang = getLanguage();

    const appRoot = document.getElementById("app");
    appRoot.innerHTML = `
      <!-- Top Navigation & Header -->
      <header class="app-header">
        <div class="header-container">
          <div class="brand">
            <div class="lisamoon-monitor" title="LisaMoon">
              <video class="lisamoon-video" src="LisaMoon.mp4" autoplay loop muted playsinline aria-label="LisaMoon Animation"></video>
              <div class="monitor-glow"></div>
            </div>
            <div class="brand-text">
              <h1 class="brand-title">${t("appTitle")}</h1>
              <span class="brand-subtitle">${t("appSubtitle")}</span>
            </div>
          </div>

          <!-- Stats & Gamification Bar -->
          <div class="header-stats">
            <div class="stat-pill streak-pill" title="${t("streakLabel")}">
              <span class="stat-icon">🔥</span>
              <div class="stat-body">
                <span class="stat-title">${t("streakLabel")}</span>
                <span class="stat-value" id="streak-display">${t("streakDays", { n: this.progress.streak || 1 })}</span>
              </div>
            </div>

            <div class="stat-pill level-pill" title="${t("levelLabel")}">
              <span class="stat-icon">🥋</span>
              <div class="stat-body">
                <span class="stat-title">${t("levelLabel")}</span>
                <span class="stat-value" id="level-display">${t(userLevel.key)}</span>
              </div>
            </div>

            <div class="stat-pill mastery-pill" title="${t("masteredLabel")}">
              <span class="stat-icon">⭐</span>
              <div class="stat-body">
                <span class="stat-title">${t("masteredLabel")}</span>
                <span class="stat-value" id="mastery-display">${t("wordsCount", { n: masteredCount })}</span>
              </div>
            </div>

            <!-- Language Switcher -->
            <button id="lang-toggle-btn" class="btn btn-outline lang-btn" title="Switch language">
              🌐 ${t("langToggle")}
            </button>
          </div>
        </div>
      </header>

      <!-- Global Filter Bar: Lesson & Part selection -->
      <nav class="lesson-filter-bar">
        <div class="filter-container">
          <div class="selector-group">
            <label for="lesson-selector" class="selector-label">${t("selectLesson")}:</label>
            <select id="lesson-selector" class="custom-select">
              <option value="all">${t("allSections")}</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => `
                <option value="${l}" ${this.state.selectedLesson == l ? "selected" : ""}>Lesson ${l}</option>
              `).join("")}
            </select>
          </div>

          <div class="selector-group" id="part-selector-group">
            <label for="part-selector" class="selector-label">${t("selectPart")}:</label>
            <select id="part-selector" class="custom-select">
              <option value="all">${t("allSections")}</option>
              <option value="1" ${this.state.selectedPart == 1 ? "selected" : ""}>Part 1</option>
              <option value="2" ${this.state.selectedPart == 2 ? "selected" : ""}>Part 2</option>
              <!-- Part 3 dynamically hidden if lesson 8 is selected -->
              ${this.state.selectedLesson != 8 ? `
                <option value="3" ${this.state.selectedPart == 3 ? "selected" : ""}>Part 3</option>
              ` : ""}
            </select>
          </div>
        </div>
      </nav>

      <!-- Main Navigation Tabs (5 modules + podcasts) -->
      <nav class="main-module-tabs">
        <div class="tabs-container">
          <button class="nav-tab ${this.currentModule === "pomodoro" ? "active" : ""}" data-module="pomodoro">
            <span class="tab-icon">⏱️</span>
            <span class="tab-label">${t("navPomodoro")}</span>
          </button>
          <button class="nav-tab ${this.currentModule === "repetition" ? "active" : ""}" data-module="repetition">
            <span class="tab-icon">🎴</span>
            <span class="tab-label">${t("navRepetition")}</span>
          </button>
          <button class="nav-tab ${this.currentModule === "quiz" ? "active" : ""}" data-module="quiz">
            <span class="tab-icon">🎯</span>
            <span class="tab-label">${t("navQuiz")}</span>
          </button>
          <button class="nav-tab ${this.currentModule === "oral" ? "active" : ""}" data-module="oral">
            <span class="tab-icon">🎙️</span>
            <span class="tab-label">${t("navOral")}</span>
          </button>
          <button class="nav-tab ${this.currentModule === "trace" ? "active" : ""}" data-module="trace">
            <span class="tab-icon">✍️</span>
            <span class="tab-label">${t("navTrace")}</span>
          </button>
          <button class="nav-tab ${this.currentModule === "podcasts" ? "active" : ""}" data-module="podcasts">
            <span class="tab-icon">🎧</span>
            <span class="tab-label">${t("navPodcasts")}</span>
          </button>
        </div>
      </nav>

      <!-- Module View Container -->
      <main class="app-main-content" id="module-container">
        <!-- Rendered dynamically -->
      </main>
    `;
  }

  bindGlobalEvents() {
    // Language toggle
    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
      langBtn.onclick = () => {
        const nextLang = getLanguage() === "en" ? "ja" : "en";
        setLanguage(nextLang);
        this.renderShell();
        this.bindGlobalEvents();
        this.loadCurrentModule();
      };
    }

    // Module tabs
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.onclick = () => {
        const mod = tab.getAttribute("data-module");
        if (mod !== this.currentModule) {
          this.switchModule(mod);
        }
      };
    });

    // Lesson selector
    const lessonSel = document.getElementById("lesson-selector");
    const partSel = document.getElementById("part-selector");

    if (lessonSel) {
      lessonSel.onchange = (e) => {
        const val = e.target.value;
        this.state.selectedLesson = val === "all" ? "all" : parseInt(val, 10);
        
        // Strict AGENTS.md rule: Lesson 8 has only parts 1 and 2 (no 8-3)
        if (this.state.selectedLesson == 8 && this.state.selectedPart == 3) {
          this.state.selectedPart = 1;
        }

        setSelectedSection(this.state.selectedLesson, this.state.selectedPart);
        this.updatePartSelectorOptions();
        this.loadCurrentModule();
      };
    }

    if (partSel) {
      partSel.onchange = (e) => {
        const val = e.target.value;
        this.state.selectedPart = val === "all" ? "all" : parseInt(val, 10);
        setSelectedSection(this.state.selectedLesson, this.state.selectedPart);
        this.loadCurrentModule();
      };
    }
  }

  updatePartSelectorOptions() {
    const partSel = document.getElementById("part-selector");
    if (!partSel) return;

    const isLesson8 = this.state.selectedLesson == 8;
    partSel.innerHTML = `
      <option value="all">${t("allSections")}</option>
      <option value="1" ${this.state.selectedPart == 1 ? "selected" : ""}>Part 1</option>
      <option value="2" ${this.state.selectedPart == 2 ? "selected" : ""}>Part 2</option>
      ${!isLesson8 ? `
        <option value="3" ${this.state.selectedPart == 3 ? "selected" : ""}>Part 3</option>
      ` : ""}
    `;
  }

  updateStatsDisplay() {
    const masteredCount = getMasteredWordsCount();
    const userLevel = getUserLevel(masteredCount);

    const masteryElem = document.getElementById("mastery-display");
    if (masteryElem) {
      masteryElem.textContent = t("wordsCount", { n: masteredCount });
    }

    const levelElem = document.getElementById("level-display");
    if (levelElem) {
      levelElem.textContent = t(userLevel.key);
    }
  }

  switchModule(moduleName) {
    if (this.activeModuleInstance && this.activeModuleInstance.destroy) {
      this.activeModuleInstance.destroy();
    }

    this.currentModule = moduleName;
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("data-module") === moduleName);
    });

    this.loadCurrentModule();
  }

  loadCurrentModule() {
    const container = document.getElementById("module-container");
    if (!container) return;

    if (this.activeModuleInstance && this.activeModuleInstance.destroy) {
      this.activeModuleInstance.destroy();
    }

    const onUpdateStats = () => this.updateStatsDisplay();

    switch (this.currentModule) {
      case "pomodoro":
        this.activeModuleInstance = initPomodoro(container, this.state, onUpdateStats);
        break;
      case "repetition":
        this.activeModuleInstance = initRepetition(container, this.state, onUpdateStats);
        break;
      case "quiz":
        this.activeModuleInstance = initQuiz(container, this.state, onUpdateStats);
        break;
      case "oral":
        this.activeModuleInstance = initOral(container, this.state, onUpdateStats);
        break;
      case "trace":
        this.activeModuleInstance = initTrace(container, this.state, onUpdateStats);
        break;
      case "podcasts":
        this.activeModuleInstance = initPodcasts(container, this.state, onUpdateStats);
        break;
      default:
        this.activeModuleInstance = initRepetition(container, this.state, onUpdateStats);
    }
  }
}

// Initialize on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  new App();
});
