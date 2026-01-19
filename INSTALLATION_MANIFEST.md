# MyLife: Installation & Project Manifest

To replicate this environment in Firebase Studio or a local IDE, you must install the following packages and configure the environment exactly as specified.

## 1. Core Framework & UI
These packages handle the React structure and the high-end animations seen in the "Neural Map" and "Life Book".

```bash
# Core React & Typing
npm install react react-dom
npm install -D typescript @types/react @types/react-dom

# Animation & Motion (Critical for the Neural Map and Dashboard)
npm install framer-motion

# Styling Engine
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 2. Intelligence & Backend
The app relies on these for AI ingestion and permanent data storage.

```bash
# Google Gemini API
npm install @google/genai

# Firebase Suite
npm install firebase

# Icons & Symbols
# (Used via CDN in index.html, but can be replaced with lucide-react)
npm install lucide-react
```

## 3. Build Tooling (The Engine)
We recommend **Vite** for the fastest development experience and optimized production builds.

```bash
npm install -D vite @vitejs/plugin-react
```

## 4. Environment Variables (.env)
Create a `.env` file in your root directory. **Do not commit this to GitHub.**

```env
VITE_GEMINI_API_KEY=your_google_api_key_here
VITE_FIREBASE_API_KEY=your_google_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=mylife-biographer.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mylife-biographer
```

## 5. Tailwind Configuration (`tailwind.config.js`)
Ensure your tailwind config includes the custom Serif and Sans fonts for the "Heirloom" aesthetic.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Crimson Pro"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'vault-dark': '#1A202C',
        'vault-paper': '#FAF9F6',
      }
    },
  },
  plugins: [],
}
```

## 6. Firebase Initialization Code
Ensure your `services/db.ts` matches the environment variable names used in your setup (e.g., `import.meta.env.VITE_FIREBASE_API_KEY` for Vite).

## 7. AI Performance
The app is optimized for **'gemini-3-flash-preview'**. 
- It provides the fastest response times for real-time chat.
- It is trained on structured JSON output for the "Splitter Rule" (parsing memories).
