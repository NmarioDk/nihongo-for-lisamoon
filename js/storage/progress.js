/**
 * Progress & Gamification Manager (Streak, Levels, Spaced Repetition status)
 * Lightweight gamification as requested: Daily streak and Levels only.
 */

const PROGRESS_KEY = "nihongo_user_progress";
const MASTERY_KEY = "nihongo_word_mastery";

export function loadProgress() {
  const defaultProgress = {
    streak: 1,
    lastActiveDate: new Date().toISOString().split("T")[0],
    completedPomodorosToday: 0,
    pomodoroDate: new Date().toISOString().split("T")[0],
    selectedLesson: 1,
    selectedPart: 1
  };
  
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      saveProgress(defaultProgress);
      return defaultProgress;
    }
    const data = JSON.parse(raw);
    
    // Check streak
    const today = new Date().toISOString().split("T")[0];
    const lastDate = data.lastActiveDate;
    
    if (lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      if (lastDate === yesterday) {
        data.streak = (data.streak || 0) + 1;
      } else if (new Date(lastDate) < new Date(yesterday)) {
        data.streak = 1;
      }
      data.lastActiveDate = today;
    }
    
    // Reset pomodoro count if new day
    if (data.pomodoroDate !== today) {
      data.pomodoroDate = today;
      data.completedPomodorosToday = 0;
    }
    
    saveProgress(data);
    return data;
  } catch (e) {
    console.error("Error reading progress", e);
    return defaultProgress;
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Error saving progress", e);
  }
}

export function incrementPomodoro() {
  const progress = loadProgress();
  progress.completedPomodorosToday = (progress.completedPomodorosToday || 0) + 1;
  saveProgress(progress);
  return progress.completedPomodorosToday;
}

export function setSelectedSection(lesson, part) {
  const progress = loadProgress();
  progress.selectedLesson = parseInt(lesson, 10);
  progress.selectedPart = parseInt(part, 10);
  saveProgress(progress);
}

// --- Spaced Repetition & Word Mastery ---
// Word status: "unseen" | "review" | "mastered"

export function getWordMasteryMap() {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function setWordStatus(wordId, status) {
  const map = getWordMasteryMap();
  map[wordId] = status; // "review" or "mastered"
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Error setting word status", e);
  }
  return map;
}

export function getMasteredWordsCount() {
  const map = getWordMasteryMap();
  return Object.values(map).filter(status => status === "mastered").length;
}

export function getUserLevel(masteredCount) {
  if (masteredCount >= 401) {
    return { levelNum: 5, key: "level5" };
  } else if (masteredCount >= 251) {
    return { levelNum: 4, key: "level4" };
  } else if (masteredCount >= 101) {
    return { levelNum: 3, key: "level3" };
  } else if (masteredCount >= 26) {
    return { levelNum: 2, key: "level2" };
  } else {
    return { levelNum: 1, key: "level1" };
  }
}
