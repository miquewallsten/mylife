
# MyLife: Master Implementation Blueprint (Final Clean State)

This is the definitive technical guide for the MyLife Biographer. All previous versions are deprecated.

---

## 1. Technical Stack
- **Framework:** React 19 (Vite)
- **Database:** Firestore (Production: `mylife-2-83922535-c259e`)
- **Auth:** Firebase Auth (Google, Apple, Passcode)
- **AI:** Google Gemini-3-Flash-Preview (Ingestion) & Gemini-3-Pro-Preview (Synthesis)
- **Security:** Client-side AES-GCM Heirloom Encryption

---

## 2. Manual Firebase Setup (Required)
Before running the app, you MUST perform these 3 steps in the Firebase Console:
1. **Authentication**: Enable Google, Apple, and Email/Password providers.
2. **Firestore**: Create a Database in **Production Mode**.
3. **Security Rules**: Paste the following:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Data Schema Mapping
- `/users/{uid}`: Root profile document.
- `/users/{uid}/memories`: Sub-collection for all narrative documents.
- `/users/{uid}/entities`: Sub-collection for extracted people, places, and objects.
- `/users/{uid}/eras`: Sub-collection for timeline segments.

---

## 4. AI Behavioral Rules
- **Splitter Rule**: Long inputs are parsed into individual memory documents.
- **User-Centric Rule**: AI questions must ALWAYS pivot back to the User's personal journey, even when discussing external entities.
- **Tone Control**: `Concise` (Direct/Fact-only) vs `Elaborate` (Empathetic/Deep-dive).
