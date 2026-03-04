# GanYaan

**A Socratic math tutor for CBSE Class 6 students.**

GanYaan (गणयान — "math journey" in Hindi) is a desktop app that teaches mathematics through guided questioning rather than direct answers. It covers three chapters from the NCERT Class 6 syllabus, supports English and Hindi, and adapts to each student's learning pace.

Built with Electron, React, and the OpenAI API.

---

## What It Does

A student picks a chapter, and GanYaan starts a conversation. Instead of lecturing, it asks questions — nudging the student toward understanding through the Socratic method. As the student demonstrates understanding, "insights" unlock (like achievements), and the difficulty adapts.

Teachers and parents get dashboards to monitor progress, assign work, and receive alerts when a student is struggling.

### Chapters

| # | Chapter | Insights | Storyline |
|---|---------|----------|-----------|
| 1 | Patterns in Mathematics | Number Patterns, Square Numbers, Triangular Numbers, Shape Patterns, Sequence Relations | Arjun building a tile mosaic |
| 5 | Prime Time | Factors & Multiples, Prime Numbers, Co-primes, Prime Factorisation, Divisibility Rules | Meera organizing a school fair |
| 7 | Fractions | Parts of a Whole, Equivalent Fractions, Comparing Fractions, Add & Subtract, Mixed Numbers | Riya planning a birthday party |

Each chapter has 5 key insights. Unlock all 5 to master the chapter.

### Key Features

**Learning**
- Socratic dialogue — never gives direct answers
- Adaptive difficulty — 3 scaffolding levels based on attempt history
- Misconception detection — recognizes common errors (e.g., adding denominators) and addresses them
- Spaced repetition — SM-2 scheduling for review of mastered concepts
- Practice problems — locally generated exercises with hints
- Worked examples — one per session, on request
- Chapter storylines — 3-act narratives woven into the conversation
- Visual math — inline SVG diagrams (fraction circles, bars, dot arrays, factor trees, number lines)

**Multi-user**
- Student, Teacher, and Parent roles
- PIN authentication for adult accounts
- Multiple students per device

**Teacher & Parent Tools**
- Conversation review — read full student transcripts
- Assignments — assign specific chapters/insights to students
- Struggle alerts — automatic notifications when a student is stuck
- Progress dashboards with per-student breakdowns
- CSV export

**Safety**
- Response validation — catches direct answers, off-topic content, overly long responses
- Daily message rate limiting with token tracking
- API key stored locally in SQLite, never exposed to the renderer

**Bilingual**
- Full English and Hindi support across all UI and AI prompts

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An [OpenAI API key](https://platform.openai.com/api-keys) (GPT-4o-mini)

### Install

```bash
git clone https://github.com/jjayarajdev/ganyaan.git
cd ganyaan
npm install
```

### Run

```bash
npm run dev
```

On first launch:
1. Create a student profile
2. Enter your OpenAI API key when prompted (stored locally)
3. Pick a chapter and start learning

### Build for Distribution

```bash
npm run build
```

Produces platform-specific installers in `out/`:
- **Windows** — Squirrel installer + ZIP
- **macOS** — ZIP
- **Linux** — DEB + RPM

---

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── main.ts              # App entry, window creation
│   ├── database.ts          # SQLite schema & queries (17 tables)
│   ├── ipc-handlers.ts      # ~45 IPC channel handlers
│   ├── openai-client.ts     # GPT-4o-mini streaming + marker parsing
│   ├── prompt-builder.ts    # Modular system prompt assembly
│   ├── prompts/             # Prompt modules
│   │   ├── common.ts        # Personality, rules, adaptive blocks
│   │   ├── storylines.ts    # 3-act chapter narratives
│   │   ├── ch1-patterns.ts
│   │   ├── ch5-prime-time.ts
│   │   └── ch7-fractions.ts
│   ├── cache-manager.ts     # Two-tier offline cache
│   ├── rate-limiter.ts      # Daily usage limits
│   ├── response-validator.ts # Socratic method enforcement
│   ├── practice-generator.ts # Local problem generation
│   ├── misconception-catalog.ts # Known error patterns
│   ├── alert-engine.ts      # Struggle detection
│   └── streaks.ts           # Daily activity tracking
│
├── preload/
│   └── preload.ts           # contextBridge API (~45 methods)
│
├── renderer/                # React frontend
│   ├── App.tsx              # Screen router
│   ├── components/
│   │   ├── ChapterLauncher.tsx    # Chapter selection (notebook style)
│   │   ├── ChatInterface.tsx      # Socratic conversation
│   │   ├── ChatBubble.tsx         # Message display + visual rendering
│   │   ├── ChatInput.tsx          # Message input
│   │   ├── PracticeMode.tsx       # Flash-card practice
│   │   ├── TeacherDashboard.tsx   # Teacher view
│   │   ├── ParentReportCard.tsx   # Parent view
│   │   ├── ProfilePicker.tsx      # User selection
│   │   ├── StreakBanner.tsx        # Streak & daily goal
│   │   ├── ConversationViewer.tsx  # Read-only transcript
│   │   └── visuals/               # SVG math diagrams
│   ├── stores/              # Zustand state
│   ├── hooks/               # useChat, useLanguage
│   └── i18n/                # en.json, hi.json
│
├── shared/
│   ├── types.ts             # TypeScript types & IPC constants
│   └── constants.ts         # Chapters, insights, definitions
│
├── data/cache/              # Static offline Q&A cache (~100 per chapter)
└── tests/
    └── prompt-regression.test.ts  # 42 tests
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Electron 40 + Electron Forge |
| Bundler | Vite 5 |
| Frontend | React 18 + Tailwind CSS 3 |
| State management | Zustand 5 |
| Language | TypeScript 5.5 |
| Database | better-sqlite3 (WAL mode) |
| AI | OpenAI SDK (GPT-4o-mini streaming) |
| Testing | Vitest 4 |
| Animations | canvas-confetti |

> **Note:** Tailwind CSS v3 is used intentionally. v4 has ESM conflicts with Electron Forge's CJS configuration.

---

## Database

SQLite with 17 tables, WAL mode, and foreign keys enabled.

**Core:** `users`, `settings`, `progress`, `chat_messages`, `sessions`, `dynamic_cache`, `student_parent_link`

**Adaptive learning:** `attempt_tracking`, `usage_tracking`, `validation_log`, `misconceptions`, `review_schedule`, `practice_results`

**Engagement:** `daily_activity`

**Teacher tools:** `assignments`, `assignment_students`, `alerts`

The database is created automatically at `{userData}/ganyaan/ganyaan.db` on first run. Schema migrations are idempotent.

---

## AI Markers

The AI responds with hidden markers that the app parses to track progress:

| Marker | Purpose |
|--------|---------|
| `[INSIGHT_UNLOCKED:id]` | Student demonstrated understanding |
| `[STUDENT_RESPONSE:correct\|wrong\|unclear]` | Attempt classification |
| `[MISCONCEPTION:type]` | Known error pattern detected |
| `[VISUAL:type:params]` | Render inline SVG diagram |
| `[REVIEW_RESULT:id:quality]` | Spaced repetition review outcome |

Markers are stripped from displayed text and processed by the main process.

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start in development mode (HMR) |
| `npm run build` | Package for distribution |
| `npm test` | Run test suite (42 tests) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |

---

## Testing

```bash
npm test
```

The test suite (`tests/prompt-regression.test.ts`) covers:

- **Prompt assembly** — verifies personality traits, core rules, language switching, student state handling, conversation flow, session pacing, insight tracking
- **Adaptive difficulty** — scaffolding levels 1-3
- **Misconception context** — empty state, populated state
- **Review mode** — instructions and quality scale
- **Worked examples** — instruction content
- **Visual aids** — correct marker availability per chapter
- **Storylines** — act progression for all 3 chapters
- **Response validation** — direct answer detection, missing questions, off-topic, length checks
- **Marker parsing** — all 4 marker types, multiple markers per response
- **Practice generator** — problem generation for all chapters, hints, edge cases

---

## Architecture Notes

**IPC boundary** — All AI calls, database access, and file operations happen in the main process. The renderer communicates exclusively through typed IPC channels via `contextBridge`. The API key never touches renderer code.

**Prompt composition** — System prompts are built modularly from blocks: personality + rules + chapter context + adaptive difficulty + misconceptions + storyline + visual aids. Each block is a pure function that can be tested independently.

**Offline support** — A two-tier cache provides offline capability: static JSON files (~100 Q&A per chapter) for common questions, plus a dynamic LRU cache (500 entries in SQLite) for previously seen AI responses.

**Adaptive scaffolding** — The system tracks every student attempt. After 3+ wrong answers on the same concept, scaffolding increases (simpler questions, more hints, step-by-step guidance). High accuracy reduces scaffolding.

**Security** — Electron Fuses are configured: RunAsNode disabled, node CLI inspect disabled, cookie encryption enabled, ASAR integrity validation on.

---

## Screen Flow

```
Launch
  └─ Profile Picker (or create first profile)
       ├─ Student  → Chapter Launcher → Chat / Practice / Review
       ├─ Teacher  → Dashboard (Overview / Assignments / Alerts)
       └─ Parent   → Report Card (per linked student)
```

---

## Adding a New Chapter

1. Define the chapter and its insights in `src/shared/constants.ts`
2. Add insight IDs to the `InsightId` union type in `src/shared/types.ts`
3. Create a prompt file at `src/main/prompts/ch{N}-{name}.ts`
4. Register it in `src/main/prompts/index.ts`
5. Add a storyline in `src/main/prompts/storylines.ts`
6. Add visual aid markers in `getVisualAidsBlock()` in `src/main/prompts/common.ts`
7. Add practice problems in `src/main/practice-generator.ts`
8. Add misconception patterns in `src/main/misconception-catalog.ts`
9. Build an offline cache at `data/cache/`
10. Add translations to `src/renderer/i18n/en.json` and `hi.json`

---

## License

MIT

---

## Author

Jay Jayakeerthy (jay.jayakeerthy@syntegreti.com)
