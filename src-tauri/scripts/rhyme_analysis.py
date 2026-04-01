from __future__ import annotations

import json
import re
import sys
from typing import TypedDict

from sudachipy import dictionary, tokenizer


LATIN_VOWELS = {"a", "e", "i", "o", "u", "y"}

KANA_ROMAJI_MAP = {
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
    "ぁ": "a", "ぃ": "i", "ぅ": "u", "ぇ": "e", "ぉ": "o",
    "ゔ": "vu",
}

DIGRAPH_MAP = {
    "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
    "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
    "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
    "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
    "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
    "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
    "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
    "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
    "じゃ": "ja", "じゅ": "ju", "じょ": "jo",
    "ぢゃ": "ja", "ぢゅ": "ju", "ぢょ": "jo",
    "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
    "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",
    "うぁ": "wa", "うぃ": "wi", "うぇ": "we", "うぉ": "wo",
    "ふぁ": "fa", "ふぃ": "fi", "ふぇ": "fe", "ふぉ": "fo",
    "てぃ": "ti", "でぃ": "di",
    "とぅ": "tu", "どぅ": "du",
    "ゔぁ": "va", "ゔぃ": "vi", "ゔぇ": "ve", "ゔぉ": "vo",
}

TAG_PATTERN = re.compile(r"^\[[^\]]+\]$")


class RhymeGuideRow(TypedDict):
    line: str
    romanizedText: str
    vowelText: str
    consonantText: str
    source: str


def katakana_to_hiragana(value: str) -> str:
    chars: list[str] = []
    for char in value:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6:
            chars.append(chr(code - 0x60))
        else:
            chars.append(char)
    return "".join(chars)


def split_romanized(romaji: str) -> tuple[str, str, str] | None:
    letters = re.sub(r"[^a-z]", "", romaji.lower())
    if not letters:
      return None

    vowels = "".join(char for char in letters if char in LATIN_VOWELS) or "—"
    consonants = "".join(char for char in letters if char not in LATIN_VOWELS) or "—"
    return letters, vowels, consonants


def to_romanized_tokens_from_reading(reading: str) -> list[str]:
    normalized = katakana_to_hiragana(reading.lower())
    tokens: list[str] = []
    index = 0

    while index < len(normalized):
        current = normalized[index]
        next_char = normalized[index + 1] if index + 1 < len(normalized) else ""
        pair = f"{current}{next_char}"

        if current.isspace():
            if not tokens or tokens[-1] != "|":
                tokens.append("|")
            index += 1
            continue

        if current == "っ":
            lookahead = f"{next_char}{normalized[index + 2] if index + 2 < len(normalized) else ''}"
            next_romaji = DIGRAPH_MAP.get(lookahead) or KANA_ROMAJI_MAP.get(next_char) or ""
            if next_romaji:
                tokens.append(next_romaji[0])
            index += 1
            continue

        if current == "ー":
            prev = tokens[-1] if tokens else ""
            match = re.search(r"[aeiou]$", prev)
            if match:
                tokens.append(match.group(0))
            index += 1
            continue

        if pair in DIGRAPH_MAP:
            tokens.append(DIGRAPH_MAP[pair])
            index += 2
            continue

        if current in KANA_ROMAJI_MAP:
            tokens.append(KANA_ROMAJI_MAP[current])
            index += 1
            continue

        if re.match(r"[a-z]", current):
            latin_word = current
            cursor = index + 1
            while cursor < len(normalized) and re.match(r"[a-z]", normalized[cursor]):
                latin_word += normalized[cursor]
                cursor += 1
            tokens.append(latin_word)
            index = cursor
            continue

        index += 1

    return tokens


def normalize_pipe_spacing(value: str) -> str:
    value = re.sub(r"\s*\|\s*", " | ", value).strip()
    return re.sub(r"^\|\s*|\s*\|$", "", value)


def build_row(tokenizer_obj: tokenizer.Tokenizer, line: str) -> RhymeGuideRow | None:
    morphemes = tokenizer_obj.tokenize(line, tokenizer.Tokenizer.SplitMode.C)
    tokens: list[str] = []

    for morpheme in morphemes:
        surface = morpheme.surface()
        if not surface:
            continue

        if surface.isspace():
            if not tokens or tokens[-1] != "|":
                tokens.append("|")
            continue

        reading = morpheme.reading_form()
        if reading == "キゴウ":
            if not tokens or tokens[-1] != "|":
                tokens.append("|")
            continue

        tokens.extend(to_romanized_tokens_from_reading(reading))

    guide_tokens: list[tuple[str, str, str]] = []
    for token in tokens:
        if token == "|":
            guide_tokens.append(("|", "|", "|"))
            continue
        split = split_romanized(token)
        if split:
            guide_tokens.append(split)

    if not guide_tokens:
        return None

    romanized = normalize_pipe_spacing(" ".join(token[0] for token in guide_tokens)) or "—"
    vowels = normalize_pipe_spacing(" ".join(token[1] for token in guide_tokens)) or "—"
    consonants = normalize_pipe_spacing(" ".join(token[2] for token in guide_tokens)) or "—"

    return {
        "line": line,
        "romanizedText": romanized,
        "vowelText": vowels,
        "consonantText": consonants,
        "source": "sudachi_core",
    }


def main() -> int:
    text = sys.stdin.buffer.read().decode("utf-8", errors="ignore")
    tokenizer_obj = dictionary.Dictionary(dict="core").create()
    rows: list[RhymeGuideRow] = []

    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if not stripped or TAG_PATTERN.match(stripped):
            continue
        row = build_row(tokenizer_obj, raw_line)
        if row:
            rows.append(row)

    sys.stdout.buffer.write(json.dumps(rows, ensure_ascii=False).encode("utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
