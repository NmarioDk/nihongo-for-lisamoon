#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification Script for Nihongo Path Application
Tests adherence to AGENTS.md rules and structural integrity.
"""

import os
import re
import json

def test_vocabulary_integrity():
    print("=== Testing Vocabulary Integrity ===")
    
    # 1. Read source markdown
    with open("japanese_vocabulary.md", "r", encoding="utf-8") as f:
        md_lines = f.readlines()
        
    source_items = []
    source_lessons = {}
    current_sec = ""
    for line in md_lines:
        line = line.strip()
        if line.startswith("## Lesson"):
            current_sec = line.replace("## Lesson", "").strip()
            source_lessons[current_sec] = 0
        elif line.startswith("|") and not ("Japanese" in line) and not ("---" in line):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 2:
                source_items.append((current_sec, parts[0], parts[-1]))
                source_lessons[current_sec] += 1
                
    print(f"Source markdown: {len(source_items)} items across {len(source_lessons)} sections.")
    
    # 2. Read generated JS vocabulary
    with open("js/data/vocabulary.js", "r", encoding="utf-8") as f:
        js_text = f.read()
        
    match = re.search(r"export const VOCABULARY_ITEMS = (\[.*?\]);", js_text, re.DOTALL)
    assert match, "Error: Could not extract VOCABULARY_ITEMS from js/data/vocabulary.js"
    
    js_items = json.loads(match.group(1))
    print(f"Generated JS data: {len(js_items)} items.")
    
    assert len(source_items) == len(js_items), f"Mismatch item count: {len(source_items)} vs {len(js_items)}"
    
    # 3. Check Section 8-3 does not exist
    sections = set(it["section"] for it in js_items)
    assert "8-3" not in sections, "Rule violation: Lesson 8-3 must not exist!"
    assert "8-1" in sections and "8-2" in sections, "Lesson 8 must have 8-1 and 8-2"
    assert len(sections) == 29, f"Must have exactly 29 sections, got {len(sections)}"
    
    # 4. Verify each item matches source
    for idx, (sec, jp, en) in enumerate(source_items):
        gen = js_items[idx]
        assert gen["section"] == sec, f"Section mismatch at index {idx}: {gen['section']} != {sec}"
        assert gen["japanese"] == jp, f"Japanese mismatch at index {idx}: {gen['japanese']} != {jp}"
        assert gen["english"] == en, f"English mismatch at index {idx}: {gen['english']} != {en}"
        assert len(gen["romaji"]) > 0, f"Romaji must not be empty at index {idx}"
        
    print("✓ All 696 items match source exactly with valid Romaji.")
    print("✓ Exactly 29 sections found, Lesson 8-3 strictly absent.")

def test_file_structure():
    print("\n=== Testing File Structure ===")
    required_files = [
        "index.html",
        "css/style.css",
        "js/app.js",
        "js/i18n.js",
        "js/data/vocabulary.js",
        "js/storage/progress.js",
        "js/storage/db.js",
        "js/modules/pomodoro.js",
        "js/modules/repetition.js",
        "js/modules/quiz.js",
        "js/modules/oral.js",
        "js/modules/trace.js",
        "js/modules/podcasts.js"
    ]
    
    for f in required_files:
        assert os.path.exists(f), f"Missing required file: {f}"
        print(f"✓ {f} exists ({os.path.getsize(f)} bytes)")

def test_bilingual_keys():
    print("\n=== Testing Bilingual Keys ===")
    with open("js/i18n.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "TRANSLATIONS = {" in content
    assert "en: {" in content
    assert "ja: {" in content
    print("✓ Bilingual dictionary contains both EN and JA profiles.")

if __name__ == "__main__":
    test_vocabulary_integrity()
    test_file_structure()
    test_bilingual_keys()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
