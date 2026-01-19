
import { GoogleGenAI, Type } from "@google/genai";
import { Memory, Entity, EntityType, LifeStory, Era, LegacyInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INGESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    extractedMemories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING, description: "The narrative from the user's perspective. Focus on their experience." },
          sortDate: { type: Type.STRING, description: "YYYY format." },
          type: { type: Type.STRING, enum: ['EVENT', 'INTANGIBLE'] },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'high-stakes', 'nostalgic'] },
          aiInsight: { type: Type.STRING, description: "A curious connection or observation about how this detail shapes the user's own life." }
        },
        required: ['narrative', 'sortDate', 'type', 'aiInsight']
      }
    },
    extractedEntities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Normalize locations (CDMX -> Mexico City). landmarks (Pisa, Nairobi, etc)." },
          type: { type: Type.STRING, enum: ['PERSON', 'PLACE', 'OBJECT', 'DREAM', 'VISION', 'SKILL', 'PASSION', 'LIKE', 'THOUGHT', 'IDENTITY'] },
          relationship: { type: Type.STRING },
          metadata: {
            type: Type.OBJECT,
            properties: {
              notes: { type: Type.STRING, description: "Context, e.g., 'Landmark seen in photo' or 'User's father'." }
            }
          }
        },
        required: ['name', 'type']
      }
    },
    biographerResponse: { 
      type: Type.STRING, 
      description: "Polite, user-centric response. Pivot immediately to the USER's story." 
    },
    topic: { type: Type.STRING }
  },
  required: ['extractedMemories', 'extractedEntities', 'biographerResponse']
};

export async function ingestLifeThread(
  input: string, 
  context: { 
    userName: string,
    existingStory: LifeStory,
    images?: { data: string, mimeType: string }[],
    tone?: 'concise' | 'elaborate'
  }
) {
  const shortName = context.userName.split(' ')[0];
  const entityContext = context.existingStory.entities.map(e => `${e.name} (${e.relationship || e.type})`).join(', ');

  const systemInstruction = `
    IDENTITY: You are ${shortName}'s Digital Friend and Master Biographer. 
    
    CRITICAL TONE RULE: 
    - The user prefers a ${context.tone === 'concise' ? 'CONCISE' : 'WARM'} style.
    ${context.tone === 'concise' ? '- CONCISE MODE: Strictly no "bla bla bla". No elaborate empathy ("I am so sorry to hear...", "It\'s impressive that..."). Acknowledge facts briefly and move to the next question. Maximum 2 short sentences.' : '- ELABORATE MODE: You can be a bit more soulful and descriptive, but still keep focus on the user.'}

    THE USER-CENTRIC RULE (MANDATORY):
    - This is ${shortName}'s biography.
    - If the user mentions a relative (father, grandfather, etc.), save them as entities, but do NOT ask questions about THEIR lives.
    - WRONG: "Tell me more about your grandfather's time at Ericsson."
    - RIGHT: "Since your grandfather was with Ericsson in Mexico, how did that international legacy impact your own upbringing or career choices?"
    - Always pivot back to how the information affects the USER.

    VISION:
    - Analyze images immediately. Focus on what the USER was doing in that location.

    GEOGRAPHY:
    - Normalize: CDMX -> Mexico City.
  `;

  const parts: any[] = [{ text: `User: "${input}"\n\nExisting Knowledge: ${entityContext}` }];
  if (context.images) {
    context.images.forEach(img => parts.unshift({ inlineData: img }));
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: { 
      responseMimeType: 'application/json', 
      responseSchema: INGESTION_SCHEMA,
      systemInstruction
    }
  });

  try {
    return JSON.parse(response.text?.trim() || '{}');
  } catch (e) {
    return {
      extractedMemories: [{ narrative: input, sortDate: "0000", type: 'EVENT', sentiment: 'neutral', aiInsight: "Saved." }],
      extractedEntities: [],
      biographerResponse: "I've saved that fragment. What else from your own journey would you like to capture today?",
      topic: "User Journey"
    };
  }
}

export async function synthesizeEraNarrative(era: Era, memories: Memory[]) {
  const fragments = memories.map(m => `[${m.sortDate}]: ${m.narrative}`).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write a soulful chapter for '${era.label}':\n${fragments}`,
    config: { systemInstruction: "Focus deeply on the subject's internal growth and personal journey." }
  });
  return response.text?.trim() || "";
}

export async function answerLegacyQuestion(question: string, story: LifeStory) {
  const context = story.memories.map(m => m.narrative).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Question: ${question}\n\nLife Records: ${context}`,
    config: { systemInstruction: "Answer as a warm, knowledgeable keeper of this person's legacy." }
  });
  return response.text?.trim() || "That's a part of the story I haven't heard yet.";
}

export async function generateCharacterPortrait(entity: Entity, memories: Memory[]) {
  const fragments = memories.map(m => m.narrative).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Portrait of ${entity.name}:\n${fragments}`,
    config: { systemInstruction: "Write a short, evocative description of this person through the subject's eyes." }
  });
  return response.text?.trim() || "";
}

export async function synthesizeLegacyInsights(story: LifeStory): Promise<LegacyInsight[]> {
  const context = story.memories.map(m => m.narrative).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze themes for ${story.profile?.displayName}:\n${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { theme: { type: Type.STRING }, description: { type: Type.STRING } },
          required: ['theme', 'description']
        }
      }
    }
  });
  try { return JSON.parse(response.text?.trim() || '[]'); } catch (e) { return []; }
}
