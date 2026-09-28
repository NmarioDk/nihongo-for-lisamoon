/**
 * Quiz Module
 * Interactive vocabulary testing based on AGENTS.md:
 * - Vocabulary strictly from the selected lesson / section
 * - Romaji masked by default, available via help button
 * - Multiple choice (4 options)
 */

import { t } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../data/vocabulary.js";
import { setWordStatus } from "../storage/progress.js";

export function initQuiz(container, state, onUpdateStats) {
  let questions = [];
  let currentQIndex = 0;
  let score = 0;
  let quizStreak = 0;
  let selectedOption = null;
  let isAnswered = false;
  let showRomajiHint = false;

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateQuizQuestions() {
    // Filter items matching current lesson/section
    const pool = VOCABULARY_ITEMS.filter(item => {
      return (state.selectedLesson === "all" || item.lesson === parseInt(state.selectedLesson, 10)) &&
             (state.selectedPart === "all" || item.part === parseInt(state.selectedPart, 10));
    });

    const questionPool = pool.length >= 4 ? pool : VOCABULARY_ITEMS;
    const shuffledPool = shuffle(questionPool);
    const selectedWords = shuffledPool.slice(0, Math.min(10, shuffledPool.length));

    questions = selectedWords.map((correctItem, idx) => {
      // Pick 3 random distractor items from the entire vocabulary
      const distractors = shuffle(VOCABULARY_ITEMS.filter(it => it.id !== correctItem.id)).slice(0, 3);
      const options = shuffle([correctItem, ...distractors]);
      const mode = idx % 2 === 0 ? "jp_to_en" : "en_to_jp"; // Alternate question directions

      return {
        item: correctItem,
        options,
        mode
      };
    });

    currentQIndex = 0;
    score = 0;
    quizStreak = 0;
    selectedOption = null;
    isAnswered = false;
    showRomajiHint = false;
  }

  function render() {
    if (!questions.length) {
      generateQuizQuestions();
    }

    if (currentQIndex >= questions.length) {
      renderFinished();
      return;
    }

    const currentQ = questions[currentQIndex];
    const isJpToEn = currentQ.mode === "jp_to_en";

    container.innerHTML = `
      <div class="module-card quiz-card">
        <div class="module-header">
          <div class="module-icon">🎯</div>
          <div>
            <h2 class="module-title">${t("quizTitle")}</h2>
            <p class="module-desc">${t("quizDesc")}</p>
          </div>
        </div>

        <div class="quiz-status-row">
          <span class="quiz-question-count">
            ${t("quizQuestion", { current: currentQIndex + 1, total: questions.length })}
          </span>
          <span class="quiz-score-badge">
            ${t("quizScore", { score, total: questions.length })}
          </span>
          ${quizStreak > 1 ? `<span class="quiz-streak-badge">🔥 ${t("quizStreak", { streak: quizStreak })}</span>` : ""}
        </div>

        <div class="quiz-question-box">
          <div class="quiz-mode-label">
            ${isJpToEn ? t("quizPromptJpToEn") : t("quizPromptEnToJp")}
          </div>

          <div class="quiz-prompt-main">
            ${isJpToEn ? currentQ.item.japanese : currentQ.item.english}
          </div>

          <div class="quiz-origin-tag">
            Lesson ${currentQ.item.section}
          </div>

          <!-- Romaji Hint Button (masked by default) -->
          <div class="quiz-hint-area">
            ${showRomajiHint ? `
              <div class="romaji-hint-box animate-fade-in">
                <span class="romaji-label">Rōmaji:</span>
                <span class="romaji-text">${currentQ.item.romaji}</span>
              </div>
            ` : `
              <button id="quiz-romaji-hint-btn" class="btn btn-outline btn-small">
                💡 ${t("showRomaji")}
              </button>
            `}
          </div>
        </div>

        <!-- Multiple Choice Options -->
        <div class="quiz-options-grid">
          ${currentQ.options.map((opt, idx) => {
            const isCorrect = opt.id === currentQ.item.id;
            let btnClass = "quiz-option-btn";
            
            if (isAnswered) {
              if (isCorrect) btnClass += " correct";
              else if (selectedOption === opt.id) btnClass += " incorrect";
            }

            const label = isJpToEn ? opt.english : opt.japanese;

            return `
              <button class="${btnClass}" data-id="${opt.id}" ${isAnswered ? "disabled" : ""}>
                <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                <span class="option-text">${label}</span>
              </button>
            `;
          }).join("")}
        </div>

        <!-- Next / Feedback bar -->
        ${isAnswered ? `
          <div class="quiz-feedback-bar animate-fade-in">
            <div class="feedback-text ${selectedOption === currentQ.item.id ? "text-success" : "text-danger"}">
              ${selectedOption === currentQ.item.id ? "✓ " + t("repFilterMastered") + "!" : "✗ " + currentQ.item.japanese + " = " + currentQ.item.english}
            </div>
            <button id="quiz-next-btn" class="btn btn-primary">
              ${t("next")} →
            </button>
          </div>
        ` : ""}
      </div>
    `;

    setupEvents(currentQ);
  }

  function setupEvents(currentQ) {
    // Romaji hint
    const hintBtn = container.querySelector("#quiz-romaji-hint-btn");
    if (hintBtn) {
      hintBtn.onclick = () => {
        showRomajiHint = true;
        render();
      };
    }

    // Option selection
    container.querySelectorAll(".quiz-option-btn").forEach(btn => {
      btn.onclick = () => {
        if (isAnswered) return;
        const chosenId = btn.getAttribute("data-id");
        selectedOption = chosenId;
        isAnswered = true;

        if (chosenId === currentQ.item.id) {
          score++;
          quizStreak++;
          // Mark word as mastered
          setWordStatus(currentQ.item.id, "mastered");
          if (onUpdateStats) onUpdateStats();
        } else {
          quizStreak = 0;
          setWordStatus(currentQ.item.id, "review");
        }

        render();
      };
    });

    // Next question
    const nextBtn = container.querySelector("#quiz-next-btn");
    if (nextBtn) {
      nextBtn.onclick = () => {
        currentQIndex++;
        selectedOption = null;
        isAnswered = false;
        showRomajiHint = false;
        render();
      };
    }
  }

  function renderFinished() {
    container.innerHTML = `
      <div class="module-card quiz-card text-center">
        <div class="finished-celebration">🎉</div>
        <h2 class="module-title">${t("quizFinished")}</h2>
        <div class="finished-score">${score} / ${questions.length}</div>
        <p class="module-desc">${t("quizCongrats")}</p>

        <div class="finished-actions">
          <button id="restart-quiz-btn" class="btn btn-primary btn-large">
            ${t("quizRestart")}
          </button>
        </div>
      </div>
    `;

    const restartBtn = container.querySelector("#restart-quiz-btn");
    if (restartBtn) {
      restartBtn.onclick = () => {
        generateQuizQuestions();
        render();
      };
    }
  }

  generateQuizQuestions();
  render();

  return {
    destroy: () => {}
  };
}
