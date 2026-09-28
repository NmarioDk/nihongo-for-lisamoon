/**
 * IndexedDB Local Storage Manager for Audio Clips
 * Strictly local to browser: No cloud syncing, zero remote uploads
 * Conforms to AGENTS.md Rule 4 & 5
 */

const DB_NAME = "NihongoAppDB";
const DB_VERSION = 1;
const STORE_NAME = "audio_clips";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("lesson", "lesson", { unique: false });
        store.createIndex("part", "part", { unique: false });
        store.createIndex("lesson_part", ["lesson", "part"], { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function saveAudioClip(clipData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    
    // Ensure id and timestamp
    const entry = {
      ...clipData,
      id: clipData.id || `clip_${Date.now()}_${clipData.lesson}_${clipData.part}`,
      createdAt: clipData.createdAt || new Date().toISOString()
    };
    
    const request = store.put(entry);
    request.onsuccess = () => resolve(entry);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAudioClipsByLesson(lesson) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("lesson");
    const request = index.getAll(parseInt(lesson, 10));

    request.onsuccess = () => {
      const clips = request.result || [];
      // Sort sequentially by part (1, 2, 3), then by creation date
      clips.sort((a, b) => {
        if (a.part !== b.part) {
          return a.part - b.part;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      resolve(clips);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteAudioClip(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllAudioClips() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}
