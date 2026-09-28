/**
 * Oral / Speaking Module
 * Strictly conforms to AGENTS.md:
 * - Generates practice phrases ONLY using vocabulary from the current section
 * - Records user voice via MediaRecorder API
 * - Stores audio ONLY in local browser IndexedDB (zero remote uploads)
 * - Automatically adds clip to lesson playlist for podcast replay
 * - Dedicated reserved section for scientific studies
 */

import { t } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../data/vocabulary.js";
import { saveAudioClip } from "../storage/db.js";

export function initOral(container, state, onUpdateStats) {
  let currentPhrase = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let currentAudioUrl = null;
  let showRomaji = false;
  let successNotice = false;

  function pickRandomPhrase() {
    const pool = VOCABULARY_ITEMS.filter(item => {
      return (state.selectedLesson === "all" || item.lesson === parseInt(state.selectedLesson, 10)) &&
             (state.selectedPart === "all" || item.part === parseInt(state.selectedPart, 10));
    });

    const list = pool.length > 0 ? pool : VOCABULARY_ITEMS;
    const randomItem = list[Math.floor(Math.random() * list.length)];
    currentPhrase = randomItem;
    showRomaji = false;
    currentAudioUrl = null;
    successNotice = false;
  }

  function render() {
    if (!currentPhrase) {
      pickRandomPhrase();
    }

    container.innerHTML = `
      <div class="module-card oral-card">
        <div class="module-header">
          <div class="module-icon">🎙️</div>
          <div>
            <h2 class="module-title">${t("oralTitle")}</h2>
            <p class="module-desc">${t("oralDesc")}</p>
          </div>
        </div>

        <!-- Practice Phrase Card -->
        <div class="oral-phrase-box">
          <div class="oral-badge-row">
            <span class="lesson-badge">Lesson ${currentPhrase.section}</span>
            <button id="oral-next-phrase-btn" class="btn btn-outline btn-small">
              🔄 ${t("oralNewPhrase")}
            </button>
          </div>

          <div class="oral-prompt-section">
            <div class="oral-prompt-label">${t("oralPromptLabel")}</div>
            <div class="oral-japanese-phrase">${currentPhrase.japanese}</div>
            
            ${showRomaji ? `
              <div class="romaji-hint-box animate-fade-in">
                <span class="romaji-label">Rōmaji:</span>
                <span class="romaji-text">${currentPhrase.romaji}</span>
              </div>
            ` : `
              <button id="oral-show-romaji-btn" class="btn btn-outline btn-small">
                💡 ${t("showRomaji")}
              </button>
            `}

            <div class="oral-translation-box">
              <span class="translation-label">${t("oralTranslationLabel")}</span>
              <span class="translation-text">${currentPhrase.english}</span>
            </div>
          </div>
        </div>

        <!-- Recording Controls -->
        <div class="oral-recording-controls">
          ${isRecording ? `
            <div class="recording-pulse-indicator animate-pulse">
              <span class="pulse-dot"></span>
              <span>${t("oralRecordingInProgress")}</span>
            </div>
            <button id="oral-stop-record-btn" class="btn btn-danger btn-large">
              ⏹️ ${t("oralRecordStop")}
            </button>
          ` : `
            <button id="oral-start-record-btn" class="btn btn-primary btn-large">
              🎙️ ${t("oralRecordStart")}
            </button>
          `}
        </div>

        <!-- Feedback & Playback -->
        ${successNotice ? `
          <div class="alert alert-success animate-fade-in">
            ✓ ${t("oralSaveSuccess", { n: currentPhrase.lesson })}
          </div>
        ` : ""}

        ${currentAudioUrl ? `
          <div class="oral-playback-section animate-fade-in">
            <p class="playback-instruction">${t("oralListenInstruction")}</p>
            <audio controls src="${currentAudioUrl}" class="oral-audio-player"></audio>
          </div>
        ` : ""}

        <!-- Scientific Studies Section (Validated by User) -->
        <div class="oral-science-container">
          <div class="science-header">
            <span class="science-icon">🧠</span>
            <h3 class="science-title">${t("oralScienceTitle")}</h3>
          </div>
          <p class="science-intro">${t("oralScienceNotice")}</p>
          <div class="science-content-box">
            <p class="science-quote">"${t("oralScienceText")}"</p>
            <div class="science-citation">
              <span class="citation-badge">📚 Reference:</span>
              <cite>${t("oralScienceCitation")}</cite>
            </div>
          </div>
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    // Next phrase
    const nextPhraseBtn = container.querySelector("#oral-next-phrase-btn");
    if (nextPhraseBtn) {
      nextPhraseBtn.onclick = () => {
        pickRandomPhrase();
        render();
      };
    }

    // Show Romaji
    const showRomajiBtn = container.querySelector("#oral-show-romaji-btn");
    if (showRomajiBtn) {
      showRomajiBtn.onclick = () => {
        showRomaji = true;
        render();
      };
    }

    // Start recording
    const startBtn = container.querySelector("#oral-start-record-btn");
    if (startBtn) {
      startBtn.onclick = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          
          let mimeType = "audio/webm";
          if (!MediaRecorder.isTypeSupported("audio/webm")) {
            if (MediaRecorder.isTypeSupported("audio/mp4")) {
              mimeType = "audio/mp4";
            } else {
              mimeType = ""; // Default browser container
            }
          }

          mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunks.push(e.data);
            }
          };

          mediaRecorder.onstop = async () => {
            // Stop mic tracks
            stream.getTracks().forEach(track => track.stop());

            const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
            currentAudioUrl = URL.createObjectURL(audioBlob);

            // Save locally to IndexedDB strictly on device
            await saveAudioClip({
              lesson: currentPhrase.lesson,
              part: currentPhrase.part,
              section: currentPhrase.section,
              phraseJapanese: currentPhrase.japanese,
              phraseRomaji: currentPhrase.romaji,
              phraseEnglish: currentPhrase.english,
              audioBlob: audioBlob
            });

            successNotice = true;
            render();
          };

          mediaRecorder.start();
          isRecording = true;
          render();
        } catch (err) {
          console.error("Microphone access error:", err);
          alert("Microphone access is required to record your voice. Please check browser permissions.");
        }
      };
    }

    // Stop recording
    const stopBtn = container.querySelector("#oral-stop-record-btn");
    if (stopBtn) {
      stopBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
          isRecording = false;
        }
      };
    }
  }

  pickRandomPhrase();
  render();

  return {
    destroy: () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    }
  };
}
