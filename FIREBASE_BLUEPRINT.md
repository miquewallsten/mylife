# MyLife: Firebase Implementation Blueprint

This document specifies the backend requirements for MyLife. Use this to configure Firebase Firestore, Authentication, and Security Rules.

## 1. Authentication
- **Methods:** Google (OAuth), Apple (OAuth), and Private Passcode (Custom JWT/UID).
- **UID Format:** Social logins use standard UIDs. Passcode logins use a client-side SHA-256 hash prefixed with `vault_`.

## 2. Firestore Schema

### Collection: `users`
- **Path:** `/users/{uid}`
- **Fields:**
  - `displayName`: string (nullable)
  - `email`: string (nullable)
  - `birthYear`: number
  - `birthCity`: string
  - `onboarded`: boolean
  - `preferredTone`: "concise" | "elaborate"
  - `updatedAt`: timestamp

### Collection: `memories`
- **Path:** `/users/{uid}/memories/{memoryId}`
- **Fields:**
  - `narrative`: string (Encrypted AES-GCM)
  - `originalInput`: string (Encrypted AES-GCM)
  - `sortDate`: string (YYYY-MM-DD)
  - `sentiment`: "positive" | "neutral" | "high-stakes" | "nostalgic"
  - `type`: "EVENT" | "INTANGIBLE"
  - `entityIds`: array<string>
  - `aiInsight`: string (nullable)
  - `createdAt`: timestamp

### Collection: `entities`
- **Path:** `/users/{uid}/entities/{entityId}`
- **Fields:**
  - `name`: string
  - `type`: "PERSON" | "PLACE" | "OBJECT" | "DREAM" | "IDENTITY"
  - `relationship`: string (e.g., "Father", "Spouse")
  - `metadata`: object { notes, ancestry, locationOfBirth }
  - `historyTags`: array<string>

### Collection: `eras`
- **Path:** `/users/{uid}/eras/{eraId}`
- **Fields:**
  - `label`: string
  - `startYear`: number
  - `endYear`: number | "present"
  - `category`: "personal" | "professional" | "location"

## 3. Security Rules (Production)
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. AI Ingestion Logic
- **Model:** Gemini-3-Flash-Preview
- **Input:** User text + Image parts (base64)
- **Output:** JSON object matching `INGESTION_SCHEMA`.
- **Constraint:** All extracted facts must be saved as `entities` and linked via `entityIds` in the `memory` document.
