# MyLife: Master Implementation Blueprint (V1.0)

This is the definitive, all-in-one technical guide for MyLife. Use this for project initialization, Firebase configuration, and AI behavioral tuning.

---

## 1. Project Foundation & Tech Stack
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS (Fonts: Crimson Pro & Inter)
- **Animation:** Framer Motion (Neural Mapping & Transitions)
- **Intelligence:** Google Gemini-3-Flash-Preview (Fast Ingestion) & Pro-Preview (Synthesis)
- **Database:** Firebase Firestore (Relational / NoSQL hybrid)
- **Security:** Client-side AES-GCM Heirloom Encryption

---

## 2. Installation & Initialization

### Step 1: Install Dependencies
Run these commands in your project root:
```bash
# Core UI & Motion
npm install react react-dom framer-motion lucide-react

# Backend & AI
npm install firebase @google/genai

# Build Tools & Styling
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer typescript @types/react
npx tailwindcss init -p
```

### Step 2: Configure Environment (.env)
Create a `.env` file and populate it. **Never commit this file.**
```env
VITE_GEMINI_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=mylife-biographer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mylife-biographer
```

---

## 3. Infrastructure & Firebase Config

### Authentication
- Enable Google & Apple OAuth in Firebase Console.
- Enable Email/Password (Passcode) provider.

### Firestore Security Rules
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Data Schema (Collections)
1. **`/users/{uid}`**: Root profile (birthYear, birthCity, preferredTone).
2. **`/users/{uid}/memories`**: The narrative ledger. Contains `narrative` (Encrypted), `sortDate`, `entityIds`, and `aiInsight`.
3. **`/users/{uid}/entities`**: The Fact-Store. Persistent data on people, places, and skills.
4. **`/users/{uid}/eras`**: Timeline segments (e.g., "The Early Years").

---

## 4. Intelligence Engine (The AI Rules)

### I. The Splitter Rule (Multi-Event Parsing)
The AI must identify if a user input contains multiple life events and split them into individual memory documents. 
- *Input:* "I met Sarah in 1990 and we moved to London in 1995."
- *Output:* Memory A (Meeting Sarah, 1990), Memory B (Moving to London, 1995).

### II. The User-Centric Rule (MANDATORY)
The AI must never pivot the biography to a relative. 
- *Rule:* If the user mentions their father, do not ask about the father's life. Ask how the father's presence impacted the **user**.

### III. Direct vs. Warm Tone
- **Concise (Direct):** No conversational filler. Max 2 sentences. Focus on fact capture.
- **Elaborate (Warm):** Empathetic acknowledgement followed by a deep-dive prompt.

---

## 5. Heirloom Encryption Logic
To ensure 100% privacy, the `narrative` and `originalInput` fields are encrypted client-side using **WebCrypto API (AES-GCM)** before being sent to Firebase.
- The `uid` (or a derived hash) acts as the derivation salt.
- Server-side indexing is performed on `sortDate` and `entityIds`, which remain unencrypted for mapping purposes.

---

## 6. Execution Checklist (Dos & Don'ts)
- **DO** verify `onboarded` status immediately after login to prevent UI resets.
- **DO** use Gemini-3-Flash for chat (low latency) and Gemini-3-Pro for "Life Book" assembly (high reasoning).
- **DON'T** ask questions about historical facts the AI can look up (use Grounding instead).
- **DON'T** store the plain-text secret key in LocalStorage; store only the Hashed UID.
