#!/usr/bin/env python3
"""
Generate SQL seed migration files for CET-4 and GaoKao-3500 word banks.

Outputs:
  migrations/000013_seed_cet4_wordbank.sql
  migrations/000014_seed_gaokao_wordbank.sql

Run from the workspace root:
  python scripts/generate_seed_sql.py
"""

import json
import re
import uuid

# ─────────────────────────────────────────────────────────
# Paths (relative to workspace root)
# ─────────────────────────────────────────────────────────
CET4_JSON   = "CET4_T.json"
GAOKAO_JSON = "GaoKao_3500.json"
OUT_CET4    = "migrations/000013_seed_cet4_wordbank.sql"
OUT_GAOKAO  = "migrations/000014_seed_gaokao_wordbank.sql"

# Placeholder owner – the first admin user bootstrapped during setup.
# Matches the system.owner_user_id setting convention.
SYSTEM_OWNER_ID = "00000000-0000-0000-0000-000000000001"

# Stable, deterministic UUIDs so re-running the script is idempotent.
CET4_BANK_ID   = str(uuid.uuid5(uuid.NAMESPACE_DNS, "taptype.wordbank.cet4"))
GAOKAO_BANK_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "taptype.wordbank.gaokao3500"))

# ─────────────────────────────────────────────────────────
# Difficulty calculation (1 – 5)
# ─────────────────────────────────────────────────────────
# Patterns that historically correlate with harder spelling / typing
_UNCOMMON_PATTERNS = [
    "ough", "augh", "tion", "sion", "ious", "eous",
    "cious", "tious", "itious", "ph", "wr", "kn",
    "gn", "mn", "rh", "pn",
]


def _count_syllables(word: str) -> int:
    """
    Estimate syllable count using a vowel-group heuristic:
      1. Count contiguous vowel runs as one syllable each.
      2. Subtract one for a silent trailing 'e' (consonant + e at word end).
      3. Minimum result is 1.
    """
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    count = len(re.findall(r"[aeiou]+", w))
    if w.endswith("e") and len(w) > 2 and w[-2] not in "aeiou":
        count -= 1
    return max(1, count)


def compute_difficulty(word: str) -> int:
    """
    Score on 1-5 scale from three independent signals:

    Length score  (0-4 pts)
      ≤ 3 chars  → 0
      4-5 chars  → 1
      6-7 chars  → 2
      8-10 chars → 3
      ≥ 11 chars → 4

    Syllable score (0-4 pts)
      1 syllable  → 0
      2 syllables → 1
      3 syllables → 2
      4 syllables → 3
      ≥ 5         → 4

    Rare-pattern bonus (0-2 pts)
      Each uncommon digraph / trigraph present, capped at 2.

    Total (0-10) → difficulty bucket:
      0-1 → 1 | 2-3 → 2 | 4-5 → 3 | 6-7 → 4 | 8-10 → 5
    """
    alpha = re.sub(r"[^a-zA-Z]", "", word)
    length    = len(alpha)
    syllables = _count_syllables(alpha)

    if length <= 3:    ls = 0
    elif length <= 5:  ls = 1
    elif length <= 7:  ls = 2
    elif length <= 10: ls = 3
    else:              ls = 4

    if syllables <= 1:    ss = 0
    elif syllables == 2:  ss = 1
    elif syllables == 3:  ss = 2
    elif syllables == 4:  ss = 3
    else:                 ss = 4

    wl    = alpha.lower()
    bonus = min(sum(1 for p in _UNCOMMON_PATTERNS if p in wl), 2)

    total = ls + ss + bonus
    if total <= 1:   return 1
    elif total <= 3: return 2
    elif total <= 5: return 3
    elif total <= 7: return 4
    else:            return 5


# ─────────────────────────────────────────────────────────
# SQL helpers
# ─────────────────────────────────────────────────────────
def _esc(s: str) -> str:
    """Escape single-quotes for an SQL string literal."""
    return s.replace("'", "''")


def _bank_sql(bank_id: str, name: str, description: str) -> str:
    return (
        f"INSERT INTO word_banks\n"
        f"    (id, owner_id, name, description, is_public, created_at, updated_at)\n"
        f"VALUES\n"
        f"    ('{bank_id}', '{SYSTEM_OWNER_ID}',\n"
        f"     '{_esc(name)}', '{_esc(description)}',\n"
        f"     1, datetime('now'), datetime('now'));\n"
    )


_WORD_COLS = (
    "(id, bank_id, content, pronunciation, definition, "
    "example_sentence, difficulty, tags, created_at, updated_at)"
)


def _word_rows(bank_id: str, entries: list) -> list[str]:
    rows   = []
    seen   = set()   # guard against duplicate names in the source JSON

    for entry in entries:
        name = entry.get("name", "").strip()
        if not name or name in seen:
            continue
        seen.add(name)

        word_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{bank_id}:{name}"))

        # pronunciation: "usphone；ukphone" – collapse if identical
        us = entry.get("usphone", "").strip()
        uk = entry.get("ukphone", "").strip()
        pronunciation = us if us == uk else f"{us}；{uk}"

        # definition: join trans items with ；
        trans      = entry.get("trans", [])
        definition = "；".join(t.strip() for t in trans if t.strip())

        difficulty = compute_difficulty(name)

        rows.append(
            f"('{word_id}', '{bank_id}', '{_esc(name)}', "
            f"'{_esc(pronunciation)}', '{_esc(definition)}', "
            f"NULL, {difficulty}, NULL, datetime('now'), datetime('now'))"
        )
    return rows


# ─────────────────────────────────────────────────────────
# File writer
# ─────────────────────────────────────────────────────────
CHUNK_SIZE = 500   # rows per INSERT … VALUES statement


def _write_migration(
    path: str,
    bank_id: str,
    bank_name: str,
    bank_desc: str,
    entries: list,
) -> None:
    rows = _word_rows(bank_id, entries)

    with open(path, "w", encoding="utf-8") as f:

        # ── Up ──────────────────────────────────────────
        f.write("-- +goose Up\n-- +goose StatementBegin\n\n")

        # 1. Word bank record
        f.write("-- Word bank\n")
        f.write(_bank_sql(bank_id, bank_name, bank_desc))
        f.write("\n")

        # 2. Words (batched to keep individual statements reasonable)
        f.write("-- Words\n")
        for i in range(0, len(rows), CHUNK_SIZE):
            chunk = rows[i : i + CHUNK_SIZE]
            f.write(f"INSERT INTO words {_WORD_COLS} VALUES\n")
            f.write(",\n".join(chunk))
            f.write(";\n\n")

        f.write("-- +goose StatementEnd\n\n")

        # ── Down ────────────────────────────────────────
        f.write("-- +goose Down\n-- +goose StatementBegin\n")
        f.write(f"DELETE FROM words     WHERE bank_id = '{bank_id}';\n")
        f.write(f"DELETE FROM word_banks WHERE id      = '{bank_id}';\n")
        f.write("-- +goose StatementEnd\n")

    print(f"[OK] {path}  ({len(rows)} words)")


# ─────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    with open(CET4_JSON, encoding="utf-8") as f:
        cet4_entries = json.load(f)

    with open(GAOKAO_JSON, encoding="utf-8") as f:
        gaokao_entries = json.load(f)

    _write_migration(
        OUT_CET4,
        CET4_BANK_ID,
        "大学英语四级词汇 (CET-4)",
        "全国大学英语四级考试核心词汇，约 2700 词。来源：公开 CET-4 词汇表。",
        cet4_entries,
    )

    _write_migration(
        OUT_GAOKAO,
        GAOKAO_BANK_ID,
        "高考英语核心词汇 3500",
        "教育部课程标准要求高考掌握的英语核心词汇，共 3500 词。来源：公开高考词汇表。",
        gaokao_entries,
    )
