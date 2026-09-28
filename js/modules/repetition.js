/**
 * Repetition Module (Flashcards with Spaced Repetition)
 * Strictly follows AGENTS.md:
 * - Default display: Origin lesson, Japanese word (kana/kanji), English translation on flip
 * - Romaji masked by default, revealed only on help button press
 * - Status tracking: "review" vs "mastered"
 */

import { t } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../data/vocabulary.js";
import { getWordMasteryMap, setWordStatus } from "../storage/progress.js";

export function initRepetition(container, state, onUpdateStats) {
  let currentIndex = 0;
  let isFlipped = false;
  let showRomaji = false;
  let filterMode = "all"; // "all" | "review" | "mastered"

  function getFilteredItems() {
    const masteryMap = getWordMasteryMap();
    return VOCABULARY_ITEMS.filter(item => {
      // Filter by section
      const matchSection = (state.selectedLesson === "all" || item.lesson === parseInt(state.selectedLesson, 10)) &&
                           (state.selectedPart === "all" || item.part === parseInt(state.selectedPart, 10));
      if (!matchSection) return false;

      // Filter by mastery status
      const status = masteryMap[item.id] || "unseen";
      if (filterMode === "review") return status === "review" || status === "unseen";
      if (filterMode === "mastered") return status === "mastered";
      return true;
    });
  }

  function render() {
    const items = getFilteredItems();
    if (currentIndex >= items.length && items.length > 0) {
      currentIndex = 0;
    }
    const currentItem = items[currentIndex];
    const masteryMap = getWordMasteryMap();
    const currentStatus = currentItem ? (masteryMap[currentItem.id] || "unseen") : null;

    container.innerHTML = `
      <div class="module-card repetition-card">
        <div class="module-header">
          <div class="module-icon">🎴</div>
          <div>
            <h2 class="module-title">${t("repTitle")}</h2>
            <p class="module-desc">${t("repDesc")}</p>
          </div>
        </div>

        <div class="rep-filter-bar">
          <button class="filter-chip ${filterMode === "all" ? "active" : ""}" data-filter="all">
            ${t("repFilterAll")}
          </button>
          <button class="filter-chip ${filterMode === "review" ? "active" : ""}" data-filter="review">
            ${t("repFilterReview")}
          </button>
          <button class="filter-chip ${filterMode === "mastered" ? "active" : ""}" data-filter="mastered">
            ${t("repFilterMastered")}
          </button>
        </div>

        ${!currentItem ? `
          <div class="empty-state">
            <div class="empty-icon">📂</div>
            <p>${t("emptyCards")}</p>
          </div>
        ` : `
          <div class="card-progress-bar">
            <span>${t("cardCounter", { current: currentIndex + 1, total: items.length })}</span>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${((currentIndex + 1) / items.length) * 100}%"></div>
            </div>
          </div>

          <div class="flashcard-scene" id="flashcard-scene">
            <div class="flashcard ${isFlipped ? "is-flipped" : ""}" id="flashcard">
              <!-- FRONT (Japanese by default) -->
              <div class="flashcard-face flashcard-front">
                <div class="flashcard-meta">
                  <span class="lesson-badge">Lesson ${currentItem.section}</span>
                  ${currentStatus === "mastered" ? `<span class="status-badge mastered">✓ ${t("mastered")}</span>` : ""}
                  ${currentStatus === "review" ? `<span class="status-badge review">⚠️ ${t("needReview")}</span>` : ""}
                </div>

                <div class="flashcard-main-japanese">${currentItem.japanese}</div>

                <!-- Romaji hint (hidden by default) -->
                ${showRomaji ? `
                  <div class="romaji-hint-box animate-fade-in">
                    <span class="romaji-label">Rōmaji:</span>
                    <span class="romaji-text">${currentItem.romaji}</span>
                  </div>
                ` : ""}

                <div class="flashcard-actions">
                  <button id="toggle-romaji-btn" class="btn btn-outline btn-small">
                    ${showRomaji ? `🙈 ${t("hideRomaji")}` : `💡 ${t("showRomaji")}`}
                  </button>
                </div>

                <div class="flashcard-hint-bottom">
                  <span>${t("cardTapHint")}</span>
                </div>
              </div>

              <!-- BACK (English translation) -->
              <div class="flashcard-face flashcard-back">
                <div class="flashcard-meta">
                  <span class="lesson-badge">Lesson ${currentItem.section}</span>
                </div>

                <div class="flashcard-back-content">
                  <div class="back-japanese-sub">${currentItem.japanese}</div>
                  <div class="back-romaji-sub">${currentItem.romaji}</div>
                  <div class="flashcard-main-english">${currentItem.english}</div>
                </div>

                <div class="flashcard-hint-bottom">
                  <span>${t("cardTapHint")}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Controls & Spaced Repetition Buttons -->
          <div class="flashcard-controls">
            <button id="rep-prev-btn" class="btn btn-secondary" ${currentIndex === 0 ? "disabled" : ""}>
              ← ${t("prev")}
            </button>
            <div class="srs-decision-buttons">
              <button id="rep-review-btn" class="btn btn-warning ${currentStatus === "review" ? "active" : ""}">
                ⚠️ ${t("needReview")}
              </button>
              <button id="rep-mastered-btn" class="btn btn-success ${currentStatus === "mastered" ? "active" : ""}">
                ✓ ${t("mastered")}
              </button>
            </div>
            <button id="rep-next-btn" class="btn btn-secondary" ${currentIndex >= items.length - 1 ? "disabled" : ""}>
              ${t("next")} →
            </button>
          </div>
        `}
      </div>
    `;

    setupEvents(items);
  }

  function setupEvents(items) {
    // Filter chips
    container.querySelectorAll(".filter-chip").forEach(chip => {
      chip.onclick = () => {
        filterMode = chip.getAttribute("data-filter");
        currentIndex = 0;
        isFlipped = false;
        showRomaji = false;
        render();
      };
    });

    if (!items.length) return;

    // Card flip on click (except when clicking on the toggle romaji button)
    const card = container.querySelector("#flashcard");
    if (card) {
      card.onclick = (e) => {
        if (e.target.closest("#toggle-romaji-btn")) return;
        isFlipped = !isFlipped;
        card.classList.toggle("is-flipped", isFlipped);
      };
    }

    // Toggle Romaji button
    const romajiBtn = container.querySelector("#toggle-romaji-btn");
    if (romajiBtn) {
      romajiBtn.onclick = (e) => {
        e.stopPropagation();
        showRomaji = !showRomaji;
        render();
      };
    }

    // Prev / Next
    const prevBtn = container.querySelector("#rep-prev-btn");
    const nextBtn = container.querySelector("#rep-next-btn");
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentIndex > 0) {
          currentIndex--;
          isFlipped = false;
          showRomaji = false;
          render();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (currentIndex < items.length - 1) {
          currentIndex++;
          isFlipped = false;
          showRomaji = false;
          render();
        }
      };
    }

    // SRS buttons
    const reviewBtn = container.querySelector("#rep-review-btn");
    const masteredBtn = container.querySelector("#rep-mastered-btn");
    const currentItem = items[currentIndex];

    if (reviewBtn && currentItem) {
      reviewBtn.onclick = () => {
        setWordStatus(currentItem.id, "review");
        if (onUpdateStats) onUpdateStats();
        // Advance to next card if available
        if (currentIndex < items.length - 1) {
          currentIndex++;
          isFlipped = false;
          showRomaji = false;
        }
        render();
      };
    }

    if (masteredBtn && currentItem) {
      masteredBtn.onclick = () => {
        setWordStatus(currentItem.id, "mastered");
        if (onUpdateStats) onUpdateStats();
        // Advance to next card if available
        if (currentIndex < items.length - 1) {
          currentIndex++;
          isFlipped = false;
          showRomaji = false;
        }
        render();
      };
    }
  }

  render();

  return {
    destroy: () => {}
  };
}
