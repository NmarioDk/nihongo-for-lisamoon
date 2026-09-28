#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to parse japanese_vocabulary.md and generate js/data/vocabulary.js
Compliant with AGENTS.md:
- Unique source: japanese_vocabulary.md
- No invented vocabulary
- Standard Hepburn romaji transliteration from kana
"""

import json
import re

# Kanji readings dictionary for the 26 words in the source containing Kanji
KANJI_READINGS = {
    "会います": "あいます",
    "バーベキュー大会": "バーベキューたいかい",
    "木": "き",
    "こうりゅう会": "こうりゅうかい",
    "名前": "なまえ",
    "出します": "だします",
    "休みます": "やすみます",
    "生ごみ": "なまごみ",
    "入ります": "はいります",
    "出（だし）ます": "だします",
    "入れます": "いれます",
    "電話": "でんわ",
    "住所": "じゅうしょ",
    "生年月日": "せいねんがっぴ",
    "電話番号": "でんわばんごう",
    "時間です": "じかんです",
    "住みます": "すみます",
    "男の子": "おとこのこ",
    "女の子": "おんなのこ",
    "父": "ちち",
    "高校": "こうこう",
    "南": "みなみ",
    "人口": "じんこう",
    "高い": "たかい",
    "せが 高い": "せが たかい",
    "目": "め",
}

# Hiragana & Katakana combination kana (digraphs)
COMPOUND_KANA = {
    # Hiragana
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
    "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
    "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
    "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
    "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
    "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
    "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
    # Katakana
    "キャ": "kya", "キュ": "kyu", "キョ": "kyo",
    "シャ": "sha", "シュ": "shu", "ショ": "sho",
    "チャ": "cha", "チュ": "chu", "チョ": "cho",
    "ニャ": "nya", "ニュ": "nyu", "ニョ": "nyo",
    "ヒャ": "hya", "ヒュ": "hyu", "ヒョ": "hyo",
    "ミャ": "mya", "ミュ": "myu", "ミョ": "myo",
    "リャ": "rya", "リュ": "ryu", "リョ": "ryo",
    "ギャ": "gya", "ギュ": "gyu", "ギョ": "gyo",
    "ジャ": "ja", "ジュ": "ju", "ジョ": "jo",
    "ビャ": "bya", "ビュ": "byu", "ビョ": "byo",
    "ピャ": "pya", "ピュ": "pyu", "ピョ": "pyo",
    "ティ": "ti", "ディ": "di", "トゥ": "tu", "ドゥ": "du",
    "ファ": "fa", "フィ": "fi", "フェ": "fe", "フォ": "fo",
    "ウィ": "wi", "ウェ": "we", "ウォ": "wo",
    "ヴァ": "va", "ヴィ": "vi", "ヴ": "vu", "ヴェ": "ve", "ヴォ": "vo",
    "チェ": "che", "シェ": "she", "ジェ": "je",
}

# Single kana
SINGLE_KANA = {
    # Hiragana
    "あ": "a", "い": "i", "う": "u", "え": "e", "お": "o",
    "か": "ka", "き": "ki", "く": "ku", "け": "ke", "こ": "ko",
    "さ": "sa", "し": "shi", "す": "su", "せ": "se", "そ": "so",
    "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
    "な": "na", "に": "ni", "ぬ": "nu", "ね": "ne", "の": "no",
    "は": "ha", "ひ": "hi", "ふ": "fu", "へ": "he", "ほ": "ho",
    "ま": "ma", "み": "mi", "む": "mu", "め": "me", "も": "mo",
    "や": "ya", "ゆ": "yu", "よ": "yo",
    "ら": "ra", "り": "ri", "る": "ru", "れ": "re", "ろ": "ro",
    "わ": "wa", "を": "o", "ん": "n",
    "が": "ga", "ぎ": "gi", "ぐ": "gu", "げ": "ge", "ご": "go",
    "ざ": "za", "じ": "ji", "ず": "zu", "ぜ": "ze", "ぞ": "zo",
    "だ": "da", "ぢ": "ji", "づ": "zu", "で": "de", "ど": "do",
    "ば": "ba", "び": "bi", "ぶ": "bu", "べ": "be", "ぼ": "bo",
    "ぱ": "pa", "ぴ": "pi", "ぷ": "pu", "ぺ": "pe", "ぽ": "po",
    # Katakana
    "ア": "a", "イ": "i", "ウ": "u", "エ": "e", "オ": "o",
    "カ": "ka", "キ": "ki", "ク": "ku", "ケ": "ke", "コ": "ko",
    "サ": "sa", "シ": "shi", "ス": "su", "セ": "se", "ソ": "so",
    "タ": "ta", "チ": "chi", "ツ": "tsu", "テ": "te", "ト": "to",
    "ナ": "na", "ニ": "ni", "ヌ": "nu", "ネ": "ne", "ノ": "no",
    "ハ": "ha", "ヒ": "hi", "フ": "fu", "ヘ": "he", "ホ": "ho",
    "マ": "ma", "ミ": "mi", "ム": "mu", "メ": "me", "モ": "mo",
    "ヤ": "ya", "ユ": "yu", "ヨ": "yo",
    "ラ": "ra", "リ": "ri", "ル": "ru", "レ": "re", "ロ": "ro",
    "ワ": "wa", "ヲ": "o", "ン": "n",
    "ガ": "ga", "ギ": "gi", "グ": "gu", "ゲ": "ge", "ゴ": "go",
    "ザ": "za", "ジ": "ji", "ズ": "zu", "ゼ": "ze", "ゾ": "zo",
    "ダ": "da", "ヂ": "ji", "ヅ": "zu", "デ": "de", "ド": "do",
    "バ": "ba", "ビ": "bi", "ブ": "bu", "ベ": "be", "ボ": "bo",
    "パ": "pa", "ピ": "pi", "プ": "pu", "ペ": "pe", "ポ": "po",
}

def kana_to_romaji(text):
    """Convert Japanese text with Kana to Hepburn Romaji."""
    # Common greeting particle exceptions
    text_clean = text
    text_clean = text_clean.replace("こんにちは", "こんにちわ")
    text_clean = text_clean.replace("こんばんは", "こんばんわ")
    text_clean = text_clean.replace("こんばんは。", "こんばんわ。")

    # Substitute kanji with kana if found
    for kanji, kana in KANJI_READINGS.items():
        text_clean = text_clean.replace(kanji, kana)
    
    # Process text character by character
    res = []
    i = 0
    n = len(text_clean)
    
    while i < n:
        ch = text_clean[i]
        
        # Check two-character compounds
        if i + 1 < n:
            pair = text_clean[i:i+2]
            if pair in COMPOUND_KANA:
                res.append(COMPOUND_KANA[pair])
                i += 2
                continue
        
        # Sokuon (っ or ッ)
        if ch in ("っ", "ッ"):
            if i + 1 < n:
                # Next romaji sound first consonant
                nxt = ""
                if i + 2 < n and text_clean[i+1:i+3] in COMPOUND_KANA:
                    nxt = COMPOUND_KANA[text_clean[i+1:i+3]]
                elif text_clean[i+1] in SINGLE_KANA:
                    nxt = SINGLE_KANA[text_clean[i+1]]
                
                if nxt:
                    # if nxt starts with "ch", sokuon is "t" (e.g., matchi)
                    if nxt.startswith("ch"):
                        res.append("t")
                    else:
                        res.append(nxt[0])
            i += 1
            continue
            
        # Chōonpu (ー long vowel mark)
        if ch == "ー":
            if res and res[-1]:
                last_char = res[-1][-1]
                if last_char in "aeiou":
                    # Macron or double vowel in Hepburn: ā, ī, ū, ē, ō
                    macron_map = {"a": "ā", "i": "ī", "u": "ū", "e": "ē", "o": "ō"}
                    res[-1] = res[-1][:-1] + macron_map.get(last_char, last_char)
                else:
                    res.append("-")
            i += 1
            continue
            
        # Single kana
        if ch in SINGLE_KANA:
            res.append(SINGLE_KANA[ch])
            i += 1
            continue
            
        # Non-kana characters (punctuation, numbers, spaces, symbols)
        if ch in " \t　":
            res.append(" ")
        elif ch in "、,":
            res.append(", ")
        elif ch in "・/":
            res.append(" / ")
        elif ch in "～〜":
            res.append("~ ")
        elif ch in "（(":
            res.append("(")
        elif ch in "）)":
            res.append(")")
        elif ch in "？?":
            res.append("?")
        elif ch in "！!":
            res.append("!")
        elif ch in "：:":
            res.append(": ")
        elif ch in "。":
            res.append(". ")
        elif ch in "0123456789":
            res.append(ch)
        elif ch in "０１２３４５６７８９":
            # fullwidth to halfwidth
            res.append(chr(ord(ch) - 0xFEE0))
        elif ch in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":
            res.append(ch)
        else:
            # Other characters (like brackets or notes)
            res.append(ch)
            
        i += 1
        
    romaji = "".join(res)
    # Clean up spaces
    romaji = re.sub(r"\s+", " ", romaji).strip()
    return romaji

def parse_markdown(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    lessons = {}
    current_lesson_num = 0
    current_part_num = 0
    current_section = ""
    
    item_counter = 0
    all_items = []
    
    for line in lines:
        line = line.strip()
        if line.startswith("## Lesson"):
            sec = line.replace("## Lesson", "").strip()
            current_section = sec
            parts = sec.split("-")
            current_lesson_num = int(parts[0])
            current_part_num = int(parts[1])
            if current_lesson_num not in lessons:
                lessons[current_lesson_num] = {}
            lessons[current_lesson_num][current_part_num] = []
        elif line.startswith("|") and not ("Japanese" in line) and not ("---" in line):
            raw_parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(raw_parts) >= 2:
                jp = raw_parts[0]
                ro_source = raw_parts[1] if len(raw_parts) >= 3 else ""
                en = raw_parts[-1]
                
                # Clean up display if needed
                item_counter += 1
                item_id = f"v_{current_lesson_num}_{current_part_num}_{item_counter:03d}"
                
                # Generate romaji
                computed_romaji = kana_to_romaji(jp)
                
                # Kana reading (with kanji converted to kana for furigana/study)
                kana_reading = jp
                for kanji, kana in KANJI_READINGS.items():
                    kana_reading = kana_reading.replace(kanji, kana)
                
                entry = {
                    "id": item_id,
                    "lesson": current_lesson_num,
                    "part": current_part_num,
                    "section": current_section,
                    "japanese": jp,
                    "kana": kana_reading,
                    "romaji": computed_romaji,
                    "english": en
                }
                lessons[current_lesson_num][current_part_num].append(entry)
                all_items.append(entry)
                
    return lessons, all_items

def main():
    source_file = "japanese_vocabulary.md"
    lessons, all_items = parse_markdown(source_file)
    
    total_sections = sum(len(parts) for parts in lessons.values())
    print(f"Parsed {len(all_items)} entries across {total_sections} sections in {len(lessons)} lessons.")
    
    # Check lesson 8 has only 2 parts
    assert 3 not in lessons[8], "Error: Lesson 8 should not have part 3!"
    assert len(lessons[8]) == 2, "Error: Lesson 8 should have exactly 2 parts!"
    assert len(lessons) == 10, "Error: There should be 10 lessons!"
    assert total_sections == 29, f"Error: There should be 29 sections, got {total_sections}!"
    
    # Save as JS ES module
    js_content = "/**\n"
    js_content += " * Japanese Vocabulary Data - Extracted strictly from japanese_vocabulary.md\n"
    js_content += " * Rules: 10 lessons, 29 sections (Lesson 8 has parts 1 and 2 only).\n"
    js_content += " * Total items: " + str(len(all_items)) + "\n"
    js_content += " */\n\n"
    js_content += "export const VOCABULARY_ITEMS = " + json.dumps(all_items, ensure_ascii=False, indent=2) + ";\n\n"
    
    # Metadata about sections
    sections_meta = []
    for l_num in sorted(lessons.keys()):
        for p_num in sorted(lessons[l_num].keys()):
            sec_name = f"{l_num}-{p_num}"
            count = len(lessons[l_num][p_num])
            sections_meta.append({
                "lesson": l_num,
                "part": p_num,
                "section": sec_name,
                "count": count
            })
            
    js_content += "export const SECTIONS_METADATA = " + json.dumps(sections_meta, ensure_ascii=False, indent=2) + ";\n"
    
    with open("js/data/vocabulary.js", "w", encoding="utf-8") as f:
        f.write(js_content)
        
    print("Successfully generated js/data/vocabulary.js!")

if __name__ == "__main__":
    main()
