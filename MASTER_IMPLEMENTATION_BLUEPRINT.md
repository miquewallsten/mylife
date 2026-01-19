# MyLife: Master Implementation Blueprint (V1.0)

This is the definitive guide for migrating MyLife to a real production environment.

---

## ⚡ FIREBASE STUDIO HAND-OFF (COPY & PASTE THIS)
"I am building a Digital Biographer app called MyLife. 
1. Enable **Firebase Auth** (Google, Apple, and Email/Passcode).
2. Create a **Firestore Database** in production mode.
3. Create the following root collection: `/users`.
4. Create these sub-collections for every user: 
   - `/users/{uid}/memories`
   - `/users/{uid}/entities`
   - `/users/{uid}/eras`
5. Apply the Security Rules provided in Section 3 of my Blueprint.
6. Set the Environment Variables: VITE_GEMINI_API_KEY, VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID."

---

## 1. Technical Stack
- **Framework:** React 19 (Vite)
- **Database:** Firestore (Real-time Sync + Offline Persistence)
- **Auth:** Firebase Auth (Identity)
- **AI:** Google Gemini-3-Flash (Chat) & Gemini-3-Pro (Synthesis)
- **Encryption:** Client-side AES-GCM (Hardware Accelerated)

---

## 2. Installation & Configuration Order

### Step 1: Install Dependencies
```bash
npm install firebase @google/genai framer-motion lucide-react react-dom
```

### Step 2: Environment Setup (.env)
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 3. Database & Security

### Firestore Security Rules (Strict Privacy)
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Real-Time Data Schema
1. **`/users/{uid}`**: 
   - `onboarded`: boolean
   - `displayName`: string
   - `preferredTone`: 'concise' | 'elaborate'
2. **`/users/{uid}/memories`**:
   - `narrative`: string (ENCRYPTED)
   - `sortDate`: string (YYYY-MM-DD)
   - `entityIds`: array
   - `sentiment`: string
3. **`/users/{uid}/entities`**:
   - `name`: string
   - `type`: 'PERSON'|'PLACE'|'OBJECT'
   - `relationship`: string

---

## 4. AI Ingestion Rules (The "Secret Sauce")

### The Splitter Rule
If a user provides a long story, the AI MUST split it into individual `memory` documents.
- *Input:* "I married June in 1970 then moved to Paris in 1975."
- *Action:* Create Memory A (Marriage) and Memory B (Moving).

### The User-Centric Rule
Always keep the spotlight on the User. If they mention their grandfather's career, ask how that grandfather's career influenced the **User's** worldview.

---

## 5. Deployment Dos & Don'ts
- **DO** enable `IndexedDB Persistence` for offline mobile use.
- **DO** verify the user's `onboarded` status on every session start.
- **DON'T** store the plain-text encryption key in Firestore; only use the derived UID hash for client-side decryption.
