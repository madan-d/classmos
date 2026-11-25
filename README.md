# Classmos

Classmos is an AI-powered, gamified learning platform for students and teachers. It combines a Duolingo-inspired interactive learning interface with Google Gemini AI for document-to-course generation and adaptive quizzes, Firebase for authentication and real-time persistence, and a FastAPI Python backend for an AI Tutor and machine-learning student analytics.

---

## Features

### Student Experience
- **Interactive Learning Path:** Progress through courses organized into units, sections, and multi-part lessons (`Part 1`, `Part 2`, `Part 3`) with built-in **Guidebook** cheat-sheets.
- **AI-Generated Quizzes:** Exercises are dynamically generated from section content using Gemini (`gemini-2.5-flash`) across four formats:
  - Multiple Choice (`MULTIPLE_CHOICE`)
  - Fill in the Blank (`FILL_IN_THE_BLANK`)
  - Matching (`MATCHING`)
  - Sentence/Process Ordering (`ORDERING`)
- **Difficulty & Bloom's Taxonomy Scaling:** Lessons scale across `Easy`, `Medium`, and `Hard` levels, adjusting question counts and cognitive focus.
- **Gamification & Retention:**
  - **Hearts System:** 5 maximum hearts with automatic regeneration (1 heart every 5 minutes).
  - **XP, Streaks & Achievements:** Earn XP per session, build daily streaks, unlock leveled achievements, and compete on **Leaderboards**.
  - **Adaptive Elo Rating:** Tracks student proficiency (starting at `800`, K-factor `32`) relative to lesson difficulty (`800` Easy, `1200` Medium, `1600` Hard).
- **AI Chat Tutor:** Context-aware tutor (`gemma-3-27b-it`) that answers student questions using the active course's syllabus as context.
- **Classroom Enrollment:** Join teacher-created courses using a 6-digit course join code.

### Teacher Experience
- **AI Course Generation:** Upload a PDF or image (up to 10 MB) with a subject and language to automatically generate a structured learning unit and section cheat-sheets.
- **Course Editor:** Create, edit, and manage units, sections, and course join codes.
- **Analytics Dashboard:**
  - Track student XP, accuracy, streaks, and Elo history.
  - Interactive **Student Classification Scatter Plot** powered by K-Means clustering (`Top Performer`, `Consistent Learner`, `Needs Support`) and Random Forest at-risk prediction (`retention_rate < 60%`).

### Authentication & Role-Based Access
- Email/password and Google OAuth authentication via **Firebase Auth**.
- Role-based routing and views for `student` and `teacher` accounts persisted in **Cloud Firestore** (students can also upgrade to a teacher account in-app).

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React
- **AI & ML:**
  - `@google/genai` (`gemini-2.5-flash` for course & quiz generation)
  - `google-genai` (`gemma-3-27b-it` for the `/chat` AI Tutor)
  - `scikit-learn`, `pandas`, `numpy`, `scipy` (K-Means clustering, Random Forest, Decision Tree, and McNemar's test)
- **Backend & Database:**
  - Firebase Authentication & Cloud Firestore (`firebase` client SDK + `firebase-admin`)
  - Python FastAPI & Uvicorn

---

## Project Structure

```text
Classmos/
├── App.tsx                       # Main application state, routing, and gamification logic
├── index.html                    # Entry HTML and Tailwind CSS configuration
├── types.ts                      # TypeScript interfaces (User, Course, Lesson, Exercise, etc.)
├── vite.config.ts                # Vite configuration (port 3000, env mapping)
├── components/                   # UI screens and modals (LessonPath, ExerciseModal, AITutorScreen, CourseAnalyticsScreen, etc.)
├── services/
│   ├── firebase.ts               # Firebase app, Auth, and Firestore initialization
│   ├── db.ts                     # Firestore data access helpers and initial mock data
│   └── geminiService.ts          # Gemini API schemas and generation calls
├── main.py                       # FastAPI entrypoint (port 8000, CORS, router registration)
├── chat.py                       # POST /chat endpoint for the AI Tutor
├── model.py                      # GET /analytics endpoint for ML clustering and risk prediction
├── verify_significance.py        # Runs classification and McNemar's significance test on synthetic data
├── print_metrics.py              # Prints classification report, confusion matrix, and feature importances
├── methodology.md                # Detailed architecture and algorithmic methodology notes
├── package.json                  # Frontend dependencies and npm scripts
└── requirements.txt              # Python backend dependencies
```

---

## Getting Started

### Prerequisites
- **Node.js** and **npm**
- **Python** and **pip**
- A **Google Gemini API Key**

### 1. Configure Environment Variables

Create a `.env.local` file in the project root and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> Both the Vite frontend (`vite.config.ts`) and the FastAPI AI Tutor (`chat.py`) read `GEMINI_API_KEY` from `.env.local`.

### 2. Run the Frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

Other available npm scripts:
- `npm run build` — Build the production bundle
- `npm run preview` — Preview the production build locally

### 3. Run the Python Backend (AI Tutor & Analytics)

Create and activate a virtual environment, install dependencies, and start the FastAPI server:

```bash
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python main.py
```

The backend runs at `http://localhost:8000`.

> **Firestore Analytics Note:** `model.py` looks for `serviceAccountKey.json` in the project root to read live student records from Firestore. If `serviceAccountKey.json` is not present or Firebase cannot be initialized, it automatically falls back to generating synthetic student data so the analytics dashboard remains functional for local testing.

---

## Backend API Endpoints

| Method | Endpoint | Source | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | `chat.py` | Accepts `{ message, context, history }` and returns `{ reply }` from the AI Tutor. |
| `GET` | `/analytics` | `model.py` | Returns student metrics, K-Means category labels, and Random Forest `is_at_risk` predictions. |

---

## Evaluation & Verification Scripts

You can inspect the ML pipeline metrics and statistical significance tests directly from the CLI:

```bash
# Print classification report, confusion matrix, and feature importances
python print_metrics.py

# Run McNemar's significance test comparing Random Forest vs. accuracy heuristic
python verify_significance.py
```

For a deeper breakdown of the system design, Elo rating equations, and methodology, see [methodology.md](methodology.md).
