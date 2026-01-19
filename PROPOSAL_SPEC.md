# MyLife Master Technical Specification

## 1. Logic Pillars
### Multi-Event Parsing (The Splitter Rule)
- **Logic:** The AI must unstack dense user narratives. 
- **Example:** "I was married in 2002 and divorced in 2010" -> Create Milestone A (Marriage 2002), Milestone B (Divorce 2010), and Nudge about the 8 years in between.

### Entity Persistence (The Fact-Store)
- **Fact-Store:** A relational database for People (e.g., Godfather Andrew) and Places (e.g., Madeira).
- **Behavior:** Entities are "Remembered Forever." Future prompts use these entities to create continuity (e.g., "Would Andrew have been at that wedding too?").

### Historical Grounding (The Nudge Engine)
- **Function:** Use Google Search/Grounding to verify dates and provide "Memory Triggers" (e.g., "Star Wars came out that summer—did you see it at the cinema?").

## 2. Relational Database Schema (Firestore Ready)
### `memories`
- `id`: UUID
- `narrative`: Encrypted String (AES-GCM)
- `sortDate`: ISO String
- `confidenceScore`: Float
- `entityIds`: Array of Entity UUIDs
- `eraIds`: Array of Era UUIDs
- `sentiment`: 'positive' | 'neutral' | 'high-stakes' | 'nostalgic'

### `entities`
- `name`: String
- `type`: 'Person' | 'Place' | 'Object'
- `relationship`: String (e.g., 'Father')
- `historyTags`: Array of biographical facts.

### `eras`
- `label`: String (e.g., 'The Oracle Years')
- `start`: Year
- `end`: Year | 'present'
- `colorTheme`: String (mapped to EraCategory)

## 3. DOs & DON’Ts
- **DO** prioritize sensory details (smells, sounds, feelings).
- **DO** use 'Example-Based Reasoning' for parsing.
- **DON'T** use corporate jargon (no 'KPIs', 'Managed', 'Responsibilities').
- **DON'T** ignore trauma; acknowledge high-stakes events with empathetic "High-Stakes" sentiment flagging.

## 4. Security (Heirloom Encryption)
- All personal narratives are encrypted on the client-side before storage using the WebCrypto API. MyLife staff cannot read your stories.