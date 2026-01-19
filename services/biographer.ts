
import { GoogleGenAI, Type } from "@google/genai";
import { Memory, Era, DraftMemory, Entity, EntityType, GroundingSource, LifeStory, LegacyInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MEMORY_PARSER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    proposals: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING, description: "Synthesized memoir snippet. Capture the thrill and sensory details." },
          sortDate: { type: Type.STRING, description: "The deduced year/date. Use cross-referencing from the FACT STORE to be as precise as possible." },
          reasoning: { type: Type.STRING, description: "Tell the user WHY you suggested this date (e.g., 'Since this was before your 2002 wedding...')" },
          location: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'high-stakes', 'nostalgic'] },
          historicalContext: { type: Type.STRING, description: "Demographic-relevant cultural anchor from that year." }
        },
        required: ['narrative', 'sortDate', 'reasoning']
      }
    },
    proposedEntities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['PERSON', 'PLACE', 'OBJECT'] },
          details: { type: Type.STRING, description: "Biographical detail or relationship." }
        },
        required: ['name', 'type']
      }
    },
    biographerFeedback: { type: Type.STRING, description: "Warm, witty response that shows you 'connected the dots'." },
    currentInvestigationTopic: { type: Type.STRING },
    isStoryComplete: { type: Type.BOOLEAN }
  },
  required: ['proposals', 'proposedEntities', 'biographerFeedback', 'isStoryComplete']
};

export async function parseMemories(
  input: string, 
  context: { 
    eras: Era[], 
    birthYear: number, 
    existingFacts: string, 
    chatHistory: any[],
    latLng?: { latitude: number, longitude: number },
    gaps?: number[]
  }
) {
  const groundingPrompt = `
    IDENTITY: You are the Lead AI Biographer & Master Orchestrator. 
    FACT STORE (Your Memory Vault):
    ${context.existingFacts}

    USER INPUT: "${input}"
    
    MISSION:
    Perform "Deductive Dating." If the user is vague about time ("The Belgium trip before my wedding"), look at the FACT STORE for the wedding date (e.g., 2002) and conclude the date for the new memory (e.g., 2001).
    
    THE SPLITTER RULE: If the user describes a complex scene (The Porche, the Cop, the Family visit), split these into distinct, rich narrative milestones.
    THE ANTI-CV RULE: Focus on the thrill (250km/h), the adrenaline, and the human connection.
    HISTORICAL GROUNDING: Use Search to verify details like Belgian speed limits in the early 2000s or cultural touchstones from that year to "flesh out" the memory.
  `;

  // Use gemini-2.5-flash for tool-heavy grounding
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: groundingPrompt,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: { retrievalConfig: { latLng: context.latLng } }
    }
  });

  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const chunk of groundingChunks) {
    if (chunk.maps) sources.push({ title: chunk.maps.title || "Mapped Location", uri: chunk.maps.uri });
    else if (chunk.web) sources.push({ title: chunk.web.title || "Historical Anchor", uri: chunk.web.uri });
  }

  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Convert the biographer's deductions into structured JSON. 
      Cross-reference the FACT STORE to provide the 'reasoning' for the suggested dates.
      
      BIOGRAPHER INSIGHTS: "${response.text}"
      RAW INPUT: "${input}"
    `,
    config: { responseMimeType: 'application/json', responseSchema: MEMORY_PARSER_SCHEMA }
  });

  try {
    const result = JSON.parse(structResponse.text?.trim() || '{}');
    return { ...result, sources };
  } catch (e) {
    return { proposals: [], proposedEntities: [], biographerFeedback: response.text || "Tell me more...", isStoryComplete: false, sources };
  }
}

export async function synthesizeLegacyInsights(story: LifeStory): Promise<LegacyInsight[]> {
  const memoriesStr = story.memories.map(m => `[${m.sortDate}]: ${m.narrative}`).join('\n');
  const prompt = `Analyze these life records for recurring themes and "Wisdom Crumbs." Identify the profound threads. RECORDS: ${memoriesStr}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            description: { type: Type.STRING },
            relatedMemories: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['theme', 'description']
        }
      }
    }
  });
  return JSON.parse(response.text?.trim() || '[]');
}

export async function generateCharacterPortrait(entity: Entity, memories: Memory[]): Promise<string> {
  const mentions = memories.filter(m => m.entityIds.includes(entity.id)).map(m => m.narrative).join('\n');
  const prompt = `Write a soulful character portrait of ${entity.name} based on these records: ${mentions}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });
  return response.text?.trim() || "A soul remembered.";
}

export async function answerLegacyQuestion(question: string, story: LifeStory) {
  const memoriesStr = story.memories.map(m => `[${m.sortDate}]: ${m.narrative}`).join('\n');
  const prompt = `You are the Voice of the Vault. Answer this: "${question}" using these records: ${memoriesStr}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });
  return response.text?.trim() || "Searching the vault...";
}

export async function synthesizeEraNarrative(era: Era, memories: Memory[]) {
  if (memories.length === 0) return "";
  const crumbs = memories.map(m => `[${m.sortDate}]: ${m.narrative}`).join('\n');
  const prompt = `Synthesize a first-person memoir chapter for the "${era.label}" era. FRAGMENTS: ${crumbs}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt
  });
  return response.text?.trim() || "A chapter in progress.";
}

export async function analyzeMedia(base64Data: string, mimeType: string, context: any) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Analyze this artifact for a life memoir. Context: " + context.existingFacts }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedYear: { type: Type.STRING },
          narrative: { type: Type.STRING },
          analysis: { type: Type.STRING },
          biographerCuriosity: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{}');
}
