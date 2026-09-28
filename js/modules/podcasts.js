/**
 * Podcasts Module (10 Lesson Playlists)
 * Strictly conforms to AGENTS.md:
 * - 10 podcasts, one per lesson (1 to 10)
 * - Played sequentially in order of parts (1, 2, 3; for lesson 8: 1, 2)
 * - Playlist expands dynamically with each local voice recording from Speaking module
 * - Zero pre-created audio files, zero cloud synchronization
 */

import { t } from "../i18n.js";
import { getAudioClipsByLesson, deleteAudioClip } from "../storage/db.js";

export function initPodcasts(container, state, onUpdateStats) {
  let selectedLesson = state.selectedLesson === "all" ? 1 : parseInt(state.selectedLesson, 10);
  let clips = [];
  let currentTrackIndex = -1;
  let audioPlayer = null;
  let playbackRate = 1.0;

  async function loadClips() {
    try {
      clips = await getAudioClipsByLesson(selectedLesson);
    } catch (e) {
      console.error("Failed to load clips for lesson", selectedLesson, e);
      clips = [];
    }
  }

  async function render() {
    await loadClips();

    container.innerHTML = `
      <div class="module-card podcasts-card">
        <div class="module-header">
          <div class="module-icon">🎧</div>
          <div>
            <h2 class="module-title">${t("podTitle")}</h2>
            <p class="module-desc">${t("podDesc")}</p>
          </div>
        </div>

        <!-- Lesson Selector for Podcast -->
        <div class="podcast-lesson-selector">
          <label for="podcast-lesson-select"><strong>${t("podSelectLesson")}</strong></label>
          <div class="lesson-buttons-scroll">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(l => `
              <button class="lesson-chip ${l === selectedLesson ? "active" : ""}" data-lesson="${l}">
                Lesson ${l}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Player Bar -->
        <div class="podcast-player-box">
          <div class="player-current-track">
            ${currentTrackIndex >= 0 && clips[currentTrackIndex] ? `
              <div class="now-playing-title">
                ${t("podNowPlaying", { title: `Part ${clips[currentTrackIndex].section}: ${clips[currentTrackIndex].phraseJapanese}` })}
              </div>
              <div class="now-playing-sub">
                ${clips[currentTrackIndex].phraseEnglish}
              </div>
            ` : `
              <div class="now-playing-title">${t("podNowPlaying", { title: "-" })}</div>
            `}
          </div>

          <audio id="podcast-audio-element" controls class="main-audio-element"></audio>

          <div class="player-extras">
            <span class="speed-label">${t("podSpeed")}</span>
            <div class="speed-buttons">
              <button class="speed-btn ${playbackRate === 0.8 ? "active" : ""}" data-speed="0.8">0.8x</button>
              <button class="speed-btn ${playbackRate === 1.0 ? "active" : ""}" data-speed="1.0">1.0x</button>
              <button class="speed-btn ${playbackRate === 1.25 ? "active" : ""}" data-speed="1.25">1.25x</button>
            </div>
          </div>
        </div>

        <!-- Playlist -->
        <div class="podcast-playlist-section">
          <h3 class="playlist-heading">
            ${t("podTrackList", { count: clips.length })}
          </h3>

          ${clips.length === 0 ? `
            <div class="empty-state">
              <div class="empty-icon">🎙️</div>
              <p>${t("podNoRecordings")}</p>
            </div>
          ` : `
            <div class="playlist-items-list">
              ${clips.map((clip, idx) => {
                const isPlaying = idx === currentTrackIndex;
                const dateStr = new Date(clip.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                return `
                  <div class="playlist-row ${isPlaying ? "is-playing" : ""}" data-index="${idx}">
                    <div class="track-play-trigger">
                      <span class="track-number">${idx + 1}</span>
                      <button class="track-play-icon" title="${t("start")}">
                        ${isPlaying ? "⏸️" : "▶️"}
                      </button>
                    </div>

                    <div class="track-info">
                      <div class="track-top-line">
                        <span class="track-section-badge">Part ${clip.section}</span>
                        <span class="track-japanese">${clip.phraseJapanese}</span>
                      </div>
                      <div class="track-english">${clip.phraseEnglish}</div>
                    </div>

                    <div class="track-right-meta">
                      <span class="track-date">${dateStr}</span>
                      <button class="btn-delete-clip" data-id="${clip.id}" title="${t("podDeleteClip")}">
                        🗑️
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>
      </div>
    `;

    setupEvents();
  }

  function setupEvents() {
    audioPlayer = container.querySelector("#podcast-audio-element");

    // Lesson chips
    container.querySelectorAll(".lesson-chip").forEach(chip => {
      chip.onclick = () => {
        selectedLesson = parseInt(chip.getAttribute("data-lesson"), 10);
        currentTrackIndex = -1;
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.src = "";
        }
        render();
      };
    });

    // Speed buttons
    container.querySelectorAll(".speed-btn").forEach(btn => {
      btn.onclick = () => {
        playbackRate = parseFloat(btn.getAttribute("data-speed"));
        if (audioPlayer) {
          audioPlayer.playbackRate = playbackRate;
        }
        container.querySelectorAll(".speed-btn").forEach(b => b.classList.toggle("active", b === btn));
      };
    });

    // Track play clicks
    container.querySelectorAll(".playlist-row").forEach(row => {
      row.onclick = (e) => {
        if (e.target.closest(".btn-delete-clip")) return;
        const index = parseInt(row.getAttribute("data-index"), 10);
        playTrack(index);
      };
    });

    // Delete clip clicks
    container.querySelectorAll(".btn-delete-clip").forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const clipId = btn.getAttribute("data-id");
        if (confirm(t("podConfirmDelete"))) {
          await deleteAudioClip(clipId);
          if (currentTrackIndex >= 0 && clips[currentTrackIndex] && clips[currentTrackIndex].id === clipId) {
            if (audioPlayer) {
              audioPlayer.pause();
              audioPlayer.src = "";
            }
            currentTrackIndex = -1;
          }
          render();
        }
      };
    });

    // Auto-advance to next track when one finishes
    if (audioPlayer) {
      audioPlayer.onended = () => {
        if (currentTrackIndex + 1 < clips.length) {
          playTrack(currentTrackIndex + 1);
        }
      };
    }
  }

  function playTrack(index) {
    if (index < 0 || index >= clips.length) return;
    currentTrackIndex = index;
    const clip = clips[index];

    if (!audioPlayer) return;

    const audioUrl = URL.createObjectURL(clip.audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayer.playbackRate = playbackRate;
    audioPlayer.play().catch(e => console.log("Audio play error", e));

    render();
  }

  render();

  return {
    destroy: () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
    }
  };
}
