## Flashcard Decks

Flashcards are defined in `content/flashcards/flashcards.yaml`. The file is a YAML document where keys are module IDs (as strings) and values are arrays of cards.

```yaml
"1":
  - topic: Topic Name
    q: The question shown on the front of the card.
    a: The answer revealed when the card is flipped.
```

Users access flashcards from the sidebar or dashboard. They can study by module or shuffle across all modules.

## Flip & Rate

Each flashcard session works like this:

1. A card appears face-up showing the **question**
2. The user thinks about the answer, then **flips** the card
3. The **answer** is revealed
4. The user rates their recall: **Got it**, **Struggled**, or **Had to peek**

These ratings feed the same SRS system as exercises, so flashcards are scheduled for review at optimal intervals.

## Spaced Repetition

The SRS algorithm is based on SM-2 (the algorithm behind Anki). Key concepts:

- Each item has an **ease factor** that adjusts based on ratings
- **Got it** increases the interval and ease factor
- **Struggled** keeps the interval short
- **Had to peek** resets the interval to 1 day
- Items are **due** when their interval has elapsed

> **Tip:** The SRS data is stored in localStorage under a key like `your-course-srs`. Each course has its own namespace so progress doesn't collide.

## Streak Tracking

The dashboard tracks:

| Stat | Description |
|------|-------------|
| **Day Streak** | Consecutive days with at least one exercise or flashcard rated |
| **Best Streak** | Longest streak ever achieved |
| **Today** | Number of items completed today |
| **Activity Heatmap** | GitHub-style grid showing activity over the past 3 months |

Streaks reset at midnight local time.

## Data & Privacy

All data stays in the browser:

- **localStorage** stores all progress, SRS data, streaks, and preferences
- **No server** — nothing is ever sent anywhere
- **Export/Import** — users can back up their data as JSON from the dashboard
- **Service worker** — the entire site works offline after first load

> **Warning:** Clearing browser data will erase all progress. Encourage users to use the export feature for backup.

## Module 3 Summary

- Flashcards are defined in a **single YAML file** grouped by module
- Users **flip and rate** cards, feeding the SRS system
- SRS uses **SM-2** to schedule reviews at optimal intervals
- **Streak tracking** and an **activity heatmap** motivate daily practice
- All data is in **localStorage** — no backend, fully offline-capable
