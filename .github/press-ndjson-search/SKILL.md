---
name: press-ndjson-search
description: Use the `emv-pers` search script to find press items in `press.normalized.ndjson` and return small, LLM-safe JSON results (date, title, url, verbatim excerpts). Use when the LLM needs sources, dates, and exact quotes from the press feed.
---

# Press NDJSON Search (data-blog)

## Overview
Provide a small, deterministic way for the `data-blog` agent to query the `press.normalized.ndjson` dataset that lives in this project (or a path you point to). The agent should run the external script shipped in the `emv-pers` repo and only read the script's compact JSONL output — never load the entire NDJSON file into the model context.

## When to use ✅
- User asks for news items or direct **verbatim quotes** from the press dataset.
- User expects authoritative citations: **date**, **title**, **link**, and **quote**.

## How to run (example) ▶️
Run the script from this repository (or call it from an agent):

```bash
python3 /Users/gerthuybrechts/pyprojects/emv-pers/.github/press-ndjson-search/scripts/search_ndjson.py \
  --query "PFAS" --file ./press.normalized.ndjson --limit 5
```

Notes on arguments:
- `--query`: phrase or words (supports quoted phrases, `|` for OR alternatives, and `--fuzzy` for approximate matches).
- `--file`: path to the NDJSON file (here: `./press.normalized.ndjson`).
- `--limit`: max number of results (keep small, e.g., 3–10).
- `--start-date`/`--end-date`: optional YYYY-MM-DD filters.

## What the script returns (JSON Lines, one JSON object per match)
Each line is a JSON object with these keys:
- `id` (string) — document id
- `url` (string) — source link
- `published_at` (ISO 8601 string) — publication date/time
- `title` (string) — headline / first line
- `excerpts` (array[string]) — verbatim strings found in the text (quoted snippets or sentences containing the query)

Example JSONL line:
```json
{"id":"...","url":"https://...","published_at":"2025-06-20T00:00:00Z","title":"Bouwsector opgelucht over PFAS-initiatief van Vlaamse regering","excerpts":["Bouwsector opgelucht over PFAS-initiatief van Vlaamse regering\nNa jarenlange stilstand ..."]}
```

## LLM / Agent instructions (important) ✍️
- **Do not** load `press.normalized.ndjson` into the LLM. Only read the script's JSONL output.
- When answering, include **date**, **title**, **link**, and **verbatim quotes** (from `excerpts`). Do **not** paraphrase quotes if the user asked for direct quotes.
- Keep answers concise and cite sources (title + date + URL) alongside the quotes.

### Example prompt template for generating answers
```
Question: {USER_QUESTION}

Results (from the script):
1) {published_at} — {title} — {url}
   Quote: "{excerpts[0]}"

Answer:
- Short summary sentence using only fields returned above
- Source: {title} ({published_at}) — {url}
  "{excerpts[0]}"
```

## Safety & best practices ⚠️
- Use a small `--limit` so results stay compact.
- Prefer exact phrase queries when you need precise quotes.
- Use `--fuzzy` only when you expect typos or approximate matches; validate excerpts before quoting.

## Optional: programmatic usage
From Python code inside `data-blog` (when the skill package is installed into your venv):
```python
from press_ndjson_search.adapter import search
results = search("PFAS", file="./press.normalized.ndjson", limit=5)
```
The agent should only be fed the `results` list (JSON objects above).

---

If you'd like, I can add a short `scripts/` helper in `data-blog` that runs the above command and prints formatted output for humans or for an LLM-runner; say the word and I'll add it. ✨
