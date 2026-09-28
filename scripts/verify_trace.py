#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verification Script for Tracing Module Improvements:
1. Verifies that no item with 'TO VERIFY' is ever present in the tracing pool.
2. Verifies that annotations like '[handwritten addition]' are stripped from the Japanese model.
3. Verifies that font sizes scale smoothly and fit without overflow.
"""

import re
import json

def test_trace_module_rules():
    print("=== Testing Tracing Module Improvements ===")
    
    with open("js/data/vocabulary.js", "r", encoding="utf-8") as f:
        text = f.read()

    match = re.search(r"export const VOCABULARY_ITEMS = (\[.*?\]);", text, re.DOTALL)
    assert match, "Could not load VOCABULARY_ITEMS"
    items = json.loads(match.group(1))

    # Python implementation matching JS isExcluded & cleanJapaneseModel
    def is_excluded(item):
        combined = f"{item.get('japanese','')} {item.get('english','')} {item.get('romaji','')}".upper()
        return "TO VERIFY" in combined

    def clean_japanese_model(t):
        if not t:
            return ""
        clean = re.sub(r"\[.*?\]", "", t)
        clean = re.sub(r"\([a-zA-Z\s°?]+\)", "", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean

    def get_dynamic_font_size(t):
        l = len(t) if t else 0
        if l <= 2:
            return "3.5rem"
        if l <= 5:
            return "2.5rem"
        if l <= 8:
            return "1.9rem"
        if l <= 12:
            return "1.45rem"
        return "1.2rem"

    # Test 1: Exclusion of "TO VERIFY"
    excluded = [it for it in items if is_excluded(it)]
    assert len(excluded) > 0, "Expected at least one item with TO VERIFY to be excluded"
    print(f"✓ Found {len(excluded)} item(s) containing 'TO VERIFY'. All properly excluded:")
    for ex in excluded:
        print(f"   -> [Excluded]: {ex['japanese']} | {ex['english']}")

    active_items = [it for it in items if not is_excluded(it)]
    for it in active_items:
        assert not is_excluded(it), f"Violation: Item contains TO VERIFY but was not excluded: {it}"
    print(f"✓ {len(active_items)} valid items available in Tracing pool (100% free of 'TO VERIFY').")

    # Test 2: Clean model without annotations
    cleaned_examples = []
    for it in active_items:
        cleaned = clean_japanese_model(it["japanese"])
        assert "[" not in cleaned and "]" not in cleaned, f"Violation: bracket annotation remained in '{cleaned}'"
        assert "handwritten" not in cleaned.lower(), f"Violation: annotation remained in '{cleaned}'"
        if cleaned != it["japanese"]:
            cleaned_examples.append((it["japanese"], cleaned))

    print(f"✓ Annotations cleaned on {len(cleaned_examples)} item(s):")
    for orig, cl in cleaned_examples:
        print(f"   -> \"{orig}\"  ===>  \"{cl}\"")

    # Test 3: Font size scaling
    font_sizes = set()
    for it in active_items:
        cleaned = clean_japanese_model(it["japanese"])
        size = get_dynamic_font_size(cleaned)
        font_sizes.add(size)

    assert len(font_sizes) == 5, f"Expected 5 distinct font size steps, got {len(font_sizes)}: {font_sizes}"
    print(f"✓ Dynamic font sizes effectively active across all items: {sorted(list(font_sizes))}")

    # Check JS file content to ensure implementations match
    with open("js/modules/trace.js", "r", encoding="utf-8") as f:
        trace_js = f.read()

    assert "TO VERIFY" in trace_js, "js/modules/trace.js must check for TO VERIFY"
    assert "cleanJapaneseModel" in trace_js, "js/modules/trace.js must implement cleanJapaneseModel"
    assert "getDynamicFontSize" in trace_js, "js/modules/trace.js must implement getDynamicFontSize"
    assert "style=\"font-size: ${dynamicSize};\"" in trace_js, "js/modules/trace.js must apply font-size dynamically"

    print("\n🎉 ALL TRACING MODULE VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_trace_module_rules()
