
# MyLife: Master Implementation Blueprint (V1.1)

---

## ⚡ FINAL VERIFICATION (POST-MIGRATION)
To ensure your app is using the **real database** and not the "sandbox local storage":
1. Open the App in your browser.
2. Sign in with **Google** or **Apple**.
3. Open the browser Console (`F12`).
4. You should see: `MyLife: Production Firebase Connection Established.`
5. Go to your **Firebase Console > Firestore**. You should see a new document under `/users/{your_uid}` within seconds of onboarding.

---

## 1. Technical Stack
- **Framework:** React 19 (Vite)
- **Database:** Firestore (Real-time Sync + Offline Persistence)
- **Auth:** Firebase Auth (Identity)
- **AI:** Google Gemini-3-Flash (Chat) & Gemini-3-Pro (Synthesis)
- **Encryption:** Client-side AES-GCM (Hardware Accelerated)

---

## 2. Firebase Rules (Production Level)
Paste this into your Firestore "Rules" tab to protect user data:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    // Only users can read/write their own life records
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 3. Data Flow Order
1. **AUTH:** User logs in via Social/Passcode.
2. **PROFILE:** App checks Firestore `/users/{uid}`. If `onboarded` is false, triggers Onboarding.
3. **COLLECTIONS:** Memories, Entities, and Eras are loaded from `/users/{uid}/sub-collections`.
4. **ENCRYPTION:** The `narrative` field is decrypted on-the-fly using the user's secret hash.
