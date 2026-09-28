/**
 * Internationalization (i18n) module - English and Japanese
 * Strictly adheres to AGENTS.md bilingual interface convention
 */

export const TRANSLATIONS = {
  en: {
    appTitle: "Nihongo For LisaMoon🌙 V1",
    appSubtitle: "Japanese Learning Companion · Tokyo Night",
    langToggle: "日本語",
    
    // Navigation & Modules
    navPomodoro: "Pomodoro",
    navRepetition: "Repetition",
    navQuiz: "Quiz",
    navOral: "Speaking",
    navTrace: "Tracing",
    navPodcasts: "Podcasts",
    
    // Header Stats
    streakLabel: "Day Streak",
    streakDays: "{n} days",
    levelLabel: "Level",
    masteredLabel: "Mastered",
    wordsCount: "{n} words",
    
    // Levels
    level1: "Beginner (初心者)",
    level2: "Apprentice (見習い)",
    level3: "Traveler (旅人)",
    level4: "Explorer (探検家)",
    level5: "Word Master (言葉の達人)",
    
    // Selectors
    selectLesson: "Lesson",
    selectPart: "Part",
    allSections: "All Parts",
    sectionDisplay: "Lesson {lesson}-{part}",
    
    // Common Actions
    showRomaji: "Show Rōmaji (Help)",
    hideRomaji: "Hide Rōmaji",
    next: "Next",
    prev: "Previous",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    close: "Close",
    save: "Save",
    delete: "Delete",
    
    // Pomodoro Module
    pomoTitle: "Study Timer",
    pomoDesc: "Focused 25-minute study intervals with 5-minute restorative breaks.",
    pomoFocusTime: "Focus Session",
    pomoBreakTime: "Short Break",
    pomoTargetSection: "Target Section:",
    pomoCompletedSessions: "Sessions completed today: {n}",
    pomoTip: "Tip: Review vocabulary flashcards during your focus block.",
    
    // Repetition Module (Flashcards)
    repTitle: "Vocabulary Flashcards",
    repDesc: "Review lesson vocabulary with spaced repetition. Tap card to flip.",
    cardTapHint: "Tap card to flip",
    needReview: "Need Review",
    mastered: "Mastered",
    cardCounter: "Card {current} of {total}",
    repFilterAll: "All Cards",
    repFilterReview: "Need Review",
    repFilterMastered: "Mastered",
    emptyCards: "No cards match the selected filter.",
    
    // Quiz Module
    quizTitle: "Vocabulary Quiz",
    quizDesc: "Test your memory on words from the selected lesson.",
    quizQuestion: "Question {current} of {total}",
    quizPromptJpToEn: "What is the English meaning?",
    quizPromptEnToJp: "Choose the correct Japanese word:",
    quizScore: "Score: {score} / {total}",
    quizStreak: "Current Streak: {streak}",
    quizRestart: "Restart Quiz",
    quizFinished: "Quiz Completed!",
    quizCongrats: "Fantastic work! Keep practicing to master every word.",
    
    // Oral / Speaking Module
    oralTitle: "Oral Expression & Voice Lab",
    oralDesc: "Generate a phrase from your current lesson, practice speaking, and record your voice.",
    oralPromptLabel: "Practice Phrase:",
    oralTranslationLabel: "English:",
    oralNewPhrase: "Next Phrase",
    oralRecordStart: "Record My Voice",
    oralRecordStop: "Stop Recording",
    oralRecordingInProgress: "Recording... Speak clearly into your microphone.",
    oralPlayLatest: "Play My Recording",
    oralSaveSuccess: "Recorded successfully! Added to Lesson {n} playlist.",
    oralScienceTitle: "Why Voice Recording Accelerates Learning",
    oralScienceNotice: "Scientific insights on cognitive learning and auditory feedback.",
    oralScienceText: "Why record yourself? Research on the \"production effect\" shows that saying words aloud while studying helps you remember them better than reading silently (MacLeod et al., 2010). Listening back to your recordings lets you catch pronunciation mistakes and review on the go, but that step is a study habit, not a proven memory booster.",
    oralScienceCitation: "MacLeod, C. M., Gopie, N., Hourihan, K. E., Neary, K. R., & Ozubko, J. D. (2010). The production effect: Delineation of a phenomenon. Journal of Experimental Psychology: Learning, Memory, and Cognition.",
    
    // Tracing Module
    traceTitle: "Character Tracing Studio",
    traceDesc: "Practice writing Japanese characters with your finger, stylus, or mouse.",
    traceReference: "Target Model",
    traceCanvasTitle: "Writing Canvas",
    traceClear: "Clear",
    traceUndo: "Undo",
    traceBrushSize: "Thickness",
    traceEvalQuestion: "How does your stroke look?",
    traceEvalGood: "Looks Great!",
    traceEvalRetry: "Needs Practice",
    traceSuccessMsg: "Great effort! Practice builds muscle memory.",
    
    // Podcasts Module
    podTitle: "Lesson Review Podcasts",
    podDesc: "Listen to your recorded oral practice sessions in sequential order (Parts 1, 2, 3).",
    podSelectLesson: "Select Lesson Podcast:",
    podTrackList: "Lesson Playlist ({count} clips):",
    podNoRecordings: "No audio recordings yet for this lesson. Head over to the Speaking module to record your first phrase!",
    podSpeed: "Speed:",
    podNowPlaying: "Now Playing: {title}",
    podDeleteClip: "Remove clip",
    podConfirmDelete: "Are you sure you want to remove this recording?"
  },
  
  ja: {
    appTitle: "Nihongo For LisaMoon🌙 V1",
    appSubtitle: "日本語学習パートナー · 東京ナイト",
    langToggle: "English",
    
    // Navigation & Modules
    navPomodoro: "ポモドーロ",
    navRepetition: "復習",
    navQuiz: "クイズ",
    navOral: "スピーキング",
    navTrace: "文字の練習",
    navPodcasts: "ポッドキャスト",
    
    // Header Stats
    streakLabel: "連続学習日数",
    streakDays: "{n}日",
    levelLabel: "レベル",
    masteredLabel: "習得数",
    wordsCount: "{n}単語",
    
    // Levels
    level1: "初心者 (Beginner)",
    level2: "見習い (Apprentice)",
    level3: "旅人 (Traveler)",
    level4: "探検家 (Explorer)",
    level5: "言葉の達人 (Word Master)",
    
    // Selectors
    selectLesson: "レッスン",
    selectPart: "パート",
    allSections: "すべてのパート",
    sectionDisplay: "レッスン {lesson}-{part}",
    
    // Common Actions
    showRomaji: "ローマ字を表示 (ヘルプ)",
    hideRomaji: "ローマ字を隠す",
    next: "次へ",
    prev: "前へ",
    start: "開始",
    pause: "一時停止",
    reset: "リセット",
    close: "閉じる",
    save: "保存",
    delete: "削除",
    
    // Pomodoro Module
    pomoTitle: "学習タイマー",
    pomoDesc: "25分の集中セッションと5分のリフレッシュ休憩。",
    pomoFocusTime: "集中セッション",
    pomoBreakTime: "休憩",
    pomoTargetSection: "対象セクション:",
    pomoCompletedSessions: "本日の完了セッション数: {n}",
    pomoTip: "ヒント: 集中時間中に単語カードを復習しましょう。",
    
    // Repetition Module (Flashcards)
    repTitle: "単語フラッシュカード",
    repDesc: "レッスン単語を間隔反復で復習。カードをタップして裏返します。",
    cardTapHint: "タップして裏返す",
    needReview: "要復習",
    mastered: "覚えた",
    cardCounter: "{total}問中 {current}問目",
    repFilterAll: "すべてのカード",
    repFilterReview: "要復習のみ",
    repFilterMastered: "覚えた単語",
    emptyCards: "選択した条件に一致するカードがありません。",
    
    // Quiz Module
    quizTitle: "単語クイズ",
    quizDesc: "選択したレッスンの単語で理解度をチェックしましょう。",
    quizQuestion: "{total}問中 {current}問目",
    quizPromptJpToEn: "英語の意味はどれですか？",
    quizPromptEnToJp: "正しい日本語の単語を選んでください：",
    quizScore: "スコア: {score} / {total}",
    quizStreak: "連続正解数: {streak}",
    quizRestart: "クイズをやり直す",
    quizFinished: "クイズ完了！",
    quizCongrats: "素晴らしい成果です！すべての単語の完全習得を目指しましょう。",
    
    // Oral / Speaking Module
    oralTitle: "発音練習 & ボイスラボ",
    oralDesc: "現在のレッスンからフレーズを選び、発音を声に出して録音しましょう。",
    oralPromptLabel: "練習フレーズ:",
    oralTranslationLabel: "英語の意味:",
    oralNewPhrase: "次のフレーズ",
    oralRecordStart: "録音開始",
    oralRecordStop: "録音停止",
    oralRecordingInProgress: "録音中... マイクに向かってはっきりと発声してください。",
    oralPlayLatest: "録音を聴く",
    oralSaveSuccess: "録音完了！レッスン{n}のプレイリストに追加されました。",
    oralListenInstruction: "自分の録音を聴き直して、発音やイントネーションを確認しましょう。",
    oralScienceTitle: "自分の声を録音すると学習効果が高まる理由",
    oralScienceNotice: "認知学習と聴覚フィードバックに関する科学的研究の知見。",
    oralScienceText: "Why record yourself? Research on the \"production effect\" shows that saying words aloud while studying helps you remember them better than reading silently (MacLeod et al., 2010). Listening back to your recordings lets you catch pronunciation mistakes and review on the go, but that step is a study habit, not a proven memory booster.（自分の声を声に出して学ぶことで、黙読よりも記憶の定着が向上することが「生産効果」の研究で示されています - MacLeod et al., 2010）",
    oralScienceCitation: "MacLeod, C. M., Gopie, N., Hourihan, K. E., Neary, K. R., & Ozubko, J. D. (2010). The production effect: Delineation of a phenomenon.",
    
    // Tracing Module
    traceTitle: "文字の練習スタジオ",
    traceDesc: "指やスタイラスペン、マウスを使って文字を書く練習をしましょう。",
    traceReference: "お手本",
    traceCanvasTitle: "練習キャンバス",
    traceClear: "消去",
    traceUndo: "1画戻す",
    traceBrushSize: "ペンの太さ",
    traceEvalQuestion: "上手に書けましたか？",
    traceEvalGood: "よくできた！",
    traceEvalRetry: "もう一度練習",
    traceSuccessMsg: "素晴らしい練習です！繰り返すことで手に感覚が身につきます。",
    
    // Podcasts Module
    podTitle: "レッスン復習ポッドキャスト",
    podDesc: "自分の発音録音をパート順（パート1、2、3）に連続して聴き直せます。",
    podSelectLesson: "レッスンポッドキャストを選択:",
    podTrackList: "再生リスト ({count}件):",
    podNoRecordings: "このレッスンの録音はまだありません。「スピーキング」モジュールで最初の録音をしてみましょう！",
    podSpeed: "再生速度:",
    podNowPlaying: "再生中: {title}",
    podDeleteClip: "録音を削除",
    podConfirmDelete: "この録音を削除してもよろしいですか？"
  }
};

let currentLang = localStorage.getItem("nihongo_app_lang") || "en";

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (lang === "en" || lang === "ja") {
    currentLang = lang;
    localStorage.setItem("nihongo_app_lang", lang);
    document.documentElement.lang = lang;
  }
}

export function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let text = dict[key] || TRANSLATIONS.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
  }
  return text;
}
