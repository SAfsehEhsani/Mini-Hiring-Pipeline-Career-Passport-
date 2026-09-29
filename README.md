# 🚀 Mini Hiring Pipeline

An enterprise-grade recruiter workspace built with **React 19, TypeScript, and Vite 8**. It helps recruiters manage talent pipelines across five sequential stages (`Applied` → `Screening` → `Interview` → `Offer` → `Hired`) with an **immutable audit trail** and a **single natural language search engine**.

[![Test Suite](https://img.shields.io/badge/Verification%20Suite-14%2F14%20Passing-emerald?style=flat-square)](scripts/verify-all.ts)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square)](tsconfig.json)
[![Architecture PDF](https://img.shields.io/badge/Architecture-PDF%20Deliverable-indigo?style=flat-square)](Mini_Hiring_Pipeline_Architecture.pdf)

---

## 📑 Deliverables Quick Links
- **Architecture PDF:** : https://github.com/SAfsehEhsani/Mini-Hiring-Pipeline-Career-Passport-/blob/main/Mini%20Hiring%20Panel%20Documents.pdf
- **Detailed Architecture Specification:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **AI Collaboration Logs & Prompt History:** [chat_logs/AI_COLLABORATION_LOGS.md](chat_logs/AI_COLLABORATION_LOGS.md)
- **Automated Verification Test Suite:** [scripts/verify-all.ts](scripts/verify-all.ts)

---

## 🏃 Quick Start (Clone & Run in 60 Seconds)

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+ or v10+)

```bash
# 1. Clone repository
git clone https://github.com/SAfsehEhsani/Mini-Hiring-Pipeline-Career-Passport-.git
cd Mini-Hiring-Pipeline-Career-Passport-

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Run Automated Invariant & Search Verification Suite
```bash
npm test
```
Runs **14/14 automated test assertions** verifying State Machine rules, terminal outcome immutability, cryptographic audit seals, and all 6 prompt natural language search questions.

### 5. Build for Production
```bash
npm run build
```

### 6. Re-generate Architecture PDF
```bash
npm run generate:pdf
```

---

## 🎯 What the Recruiter Can Do (Features & Capabilities)

### 1. Executive Dashboard & Visual Controls
- **4 Live KPI Metric Cards:**
  - **Active Talent Pool:** Total active applicants in the requisition across the 4 active pipeline stages. *(1-click filter)*
  - **Pipeline Velocity & SLA Alerts:** Average stage dwell time (`d`) with an automated **pulsating amber indicator** for candidates stuck &ge; 7 days. *(1-click filter: `"stuck for more than a week"`)*
  - **Offer Conversion:** Live count of hires and candidate-to-offer **Win Rate %**. *(1-click filter: `"stage:hired"`)*
  - **Compliance Audit Trail:** Total cryptographically signed, immutable events sealed in the SHA-256 ledger.
- **Stage Flow Distribution Ribbon:** Real-time proportional distribution bar across Applied (sky), Screening (amber), Interview (purple), Offer (pink), and Hired (emerald). Hover to see percentages and click any segment to filter.
- **Dual View Mode Switcher:** Seamlessly switch between:
  - **Kanban Board:** Card-based workflow with stage progression, quick rejection, and dwell-time meters.
  - **Executive Table List:** High-density data grid with avatar icons, stage pills, live dwell timers, sealed audit record counts, match relevance badges, and inline actions.
- **Local Persistence & Demo Reset:** Automatically persists state to browser `localStorage` and includes a 1-click **"Reset Demo"** button in the header.

---

### 2. Strict Pipeline Management (Domain FSM)
- **Add Candidates:** Click **"+ Add Candidate"** to introduce new candidates directly into `Applied`, immediately sealing an initial creation audit entry.
- **Stage Progression:** Move candidates forward strictly **one stage at a time** (`Applied` → `Screening` → `Interview` → `Offer` → `Hired`). Skipping stages or jumping forward is mathematically prohibited at the domain layer.
- **Terminal State Locks:** Once a candidate is `Hired` or `Rejected`, their outcome is permanently locked. Reversals or subsequent transitions are blocked.
- **Pre-Hired Rejection:** Candidates can be rejected from any stage prior to being hired, capturing a mandatory audit rationale.
- **Live Stage Dwell-Time:** Every candidate card and profile calculates live duration in the current stage (e.g. `9 days, 4 hours`). Candidates waiting for &ge; 7 days are automatically flagged with visual **⚠️ Stalled** SLA warning badges.
- **Immutable Audit Trail:** Click any candidate to inspect their complete, tamper-evident audit history sealed with cryptographic fingerprints (`sha256:aud_...`).

---

### 3. Single Intelligent Search Box (Zero Cloud LLMs — 100% Native)

The recruiter can ask complex natural language questions in a single search bar. Every question from the prompt is supported and verified:

| Question from Prompt | How It Works | Verified Result |
| :--- | :--- | :--- |
| **`"Find Priya Sharma"` (even with typo `"sharam"`)** | **Damerau-Levenshtein** edit distance handles adjacent transpositions (`am` ↔ `ma` is distance 1; 83% similarity). | **Priya Sharma** returned as #1 best match with similarity badge. |
| **`"Who's in Interview right now?"`** | Intent extractor detects current stage filter (`stage = Interview`, `status = ACTIVE`). | **Marcus Chen, Elena Rostova, Lucas Silva** |
| **`"Who has been stuck in Screening for more than a week?"`** | Temporal duration resolver identifies `stage = Screening` and `elapsedDays >= 7`. | **Priya Sharma (9d) & Aarav Patel (12d)** |
| **`"Who moved to Interview since Monday?"`** | Dynamic calendar day resolver inspects immutable transition history timestamps relative to `Date.now()`. | **Marcus Chen & Lucas Silva** |
| **`"Who reached the Offer stage but didn't get hired?"`** | Historical milestone inspector looks back through the candidate's event stream. | **Amina Diallo** (Reached Offer, declined counter-offer, outcome: Rejected) |
| **`"Everyone except rejected candidates"`** | Negation and exclusion filter (`status !== 'REJECTED'`). | Returns all active and hired candidates, excluding rejected ones. |

#### Compound Combinations
Queries can be combined naturally (e.g., `"Who's in Interview right now since Monday named Marcus?"`). The relevance ranker scores each matched dimension so **the best matches always come first**.

#### Explainability & Diagnostic Feedback
When a query returns 0 matches or includes unrecognized terms, the search engine **never shows an empty screen without context**. It displays a diagnostic banner explaining *why* (e.g. *"0 candidates found stuck in Screening for > 30 days; longest waiting candidate is currently at 9 days"*), along with clickable suggestion chips.

---

### 4. Extra Enterprise Features (100% Native — Zero External APIs/Tools)
- **🎙️ Native Web Speech Voice Search:** Click the microphone icon in the search box to dictate search questions hands-free (e.g. *"Who moved to Interview since Monday?"*). Built using the native HTML5 Web Speech API (`webkitSpeechRecognition`), requiring 0 third-party packages and 0 cloud API keys.
- **✉️ Context-Aware Polite Rejection Email Previews:** When rejecting a candidate, recruiters can toggle a live decline email preview tailored specifically to whether the candidate was in `Applied`, `Screening`, `Interview`, or `Offer` stage. Incorporates the audit rationale and includes a 1-click **"Copy Draft"** clipboard action to protect candidate experience (CX).
- **📋 Architecture & Engineering Decisions Modal:** Click **"Architecture & Report"** in the top navbar to inspect interactive architectural diagrams, trade-off analysis, and print or download the documentation.

---

## 🧠 Architectural Decisions & Why

### 1. Finite State Machine (FSM) vs. Ad-Hoc Status Flags
- **Decision:** Encapsulated transition rules inside a centralized `PipelineStateMachine` domain class.
- **Why:** In recruiting workflows, accidental stage skipping (e.g. Applied straight to Offer) or unrecorded status flips cause compliance violations. The FSM guarantees that valid transitions are mathematically constrained at the model layer.

### 2. Event-Sourced Immutable Audit Trail vs. Column Overwrite
- **Decision:** State is represented as a projection of append-only `AuditEntry` records with SHA-256 signatures.
- **Why:** Real recruiting compliance (EEOC, GDPR, SOC-2) mandates that candidate history can never be altered or backdated. Once an action is recorded, it is frozen.

### 3. Client-Side Hybrid Search Engine vs. Cloud LLM API
- **Decision:** Built a high-performance in-browser tokenizer, Damerau-Levenshtein distance calculator, and dynamic calendar anchor.
- **Why:** Sub-millisecond instant feedback (&lt; 2ms), 100% offline functionality, zero API costs, zero PII privacy leaks, and 100% deterministic reproducibility.

---

## 🤝 Human-in-the-Loop: Where I Disagreed with the AI

> **The AI Assistant Proposal:**
> During initial system architecture, the AI suggested integrating an external Cloud LLM API (such as OpenAI GPT-4o or Claude 3.5) to parse every search keystroke via serverless function calls, or alternatively falling back to simple regex substring matching.

### Why I Disagreed with the AI:
1. **Recruiter Search Latency:** Calling an external cloud LLM on every keystroke incurs a **500ms to 1,500ms round-trip latency**. Recruiters expect instant filtering as they type without UI lag or rate limit errors.
2. **Candidate PII Data Privacy (GDPR & SOC-2):** Streaming private applicant data (names, phone numbers, notes) across third-party LLM endpoints introduces serious legal and security compliance risks.
3. **Hallucination & Date Inconsistency:** Generative LLMs frequently hallucinate or interpret relative dates non-deterministically based on temperature settings.

### The Superior Alternative Implemented:
We implemented an **In-Browser Deterministic Hybrid Engine**:
- Damerau-Levenshtein fuzzy matching (captures transpositions with edit distance 1).
- Relative calendar day resolver anchored directly to the system clock.
- Historical audit stream inspector.
- Sub-millisecond latency (&lt; 2ms), zero cloud cost, complete PII privacy, and 100% explainable diagnostics.

*(Read the complete discussion in [chat_logs/AI_COLLABORATION_LOGS.md](chat_logs/AI_COLLABORATION_LOGS.md)).*

---

## 🔮 What I Would Do With More Time

1. **Multi-Requisition & Department Workspaces:** Extend the single-job pipeline into a multi-job workspace where recruiters can define custom stage sequences per department (e.g., Executive vs. Engineering loops).
2. **Distributed Event Sourcing (CQRS & Kafka):** Back the in-memory audit store with an append-only distributed event log (PostgreSQL WAL or Apache Kafka) with real-time multi-recruiter synchronization via WebSockets.
3. **Cryptographic Merkle Tree Log Proofs:** Hash-chain candidate audit records into a Merkle DAG so external compliance auditors can cryptographically verify that zero records were tampered with or backdated.
4. **Automated SLA Notifications & Calendar Hooks:** Set up automated Slack webhooks when candidates approach stage SLAs (&gt; 5 days in Screening), plus direct Google Calendar / Outlook interview scheduling.

---

## 🧪 Running Tests
```bash
npm test
```
All 14 automated verification tests run through [scripts/verify-all.ts](scripts/verify-all.ts) and validate all functional requirements from the prompt.
