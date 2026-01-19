
# MyLife Master Technical Specification

## 1. Logic Pillars
### The Curious Interviewer (Core Shift)
- **Logic:** The AI is forbidden from writing the user's narrative. It must act as an interlocutor.
- **Goal:** Pull sensory, emotional, and humorous details from the user via evocative questioning.
- **Verification:** Research (Wimbledon '17, etc.) is used to generate specific "Memory Nudges" (e.g., "I see the final was a scorcher—did you have enough sunscreen or just enough Pimms?").

### Entity Persistence
- **Fact-Store:** Tracks people and places to cross-reference stories (e.g., "Dad" or "Wimbledon").

### Historical Grounding
- **Function:** Triangulate precise dates (YYYY-MM) and environmental context (weather, winners, news) to fuel the Interviewer's questions.

## 2. Relational Architecture
- **Memories:** `{ id, narrative (USER VOICE), sortDate, confidenceScore, entityIds[], eraId, sentiment }`

## 3. UI/UX Guardrails
- **Philosophy:** "Voice is King." The user's original words are preserved in the Life Book.
- **Visuals:** High contrast, serif typography for the "Book" feel, glassmorphism for the "Digital Desk" feel.
- **Demographic:** 40–80+ years old.

## 4. Guardrails
- **Anti-AI Speak:** No "I have generated a story for you." Instead: "This sounds incredible. Tell me about the..."
- **No Assumptions:** Never invent facts. Only ask questions based on verified history.
