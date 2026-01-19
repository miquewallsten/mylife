
import { GoogleGenAI, Type } from "@google/genai";
import { Memory, Era, DraftMemory, Entity, EntityType, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MEMORY_PARSER_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    proposals: { 
      type: Type.ARRAY, 
      items: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          sortDate: { type: Type.STRING },
          location: { type: Type.STRING },
          sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'high-stakes', 'nostalgic'] },
          suggestedEventAnchor: { type: Type.STRING },
          suggestedEraCategories: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING, enum: ['personal', 'professional', 'location'] } 
          }
        },
        required: ['narrative', 'sortDate']
      }
    },
    proposedEntities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['PERSON', 'PLACE'] },
          details: { type: Type.STRING, description: "New biographical facts discovered (e.g., 'Born in 1945', 'Died in 2010')" }
        },
        required: ['name', 'type']
      }
    },
    biographerFeedback: { type: Type.STRING },
    currentInvestigationTopic: { type: Type.STRING },
    isStoryComplete: { type: Type.BOOLEAN }
  },
  required: ['proposals', 'proposedEntities', 'biographerFeedback', 'currentInvestigationTopic', 'isStoryComplete']
};

export async function parseMemories(
  input: string, 
  context: { 
    eras: Era[], 
    birthYear: number, 
    existingFacts: string, 
    chatHistory: any[],
    latLng?: { latitude: number, longitude: number }
  }
) {
  // Pass 1: Interactive Biographer with grounding tools
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      You are the Curious Biographer. You are a warm, humble, and endlessly interested friend.
      
      MISSION: Listen to the user's life stories. Act as a dear companion.
      
      CRITICAL ROLE: You are a synthesizer, not a data entry clerk. 
      If a user gives you bits and pieces of a story (e.g., "My dad was born in Spain", then later "He was born in 1940"), 
      do NOT create two separate timeline entries. Connect them. 
      
      If the user is providing biographical details about a person, treat it as "Research" and "Enrichment" for that person. 
      Only suggest a new Timeline Entry (Proposal) if it's a major milestone, a clear "story" (e.g., "The day we moved to London"), or a distinct era change.
      
      CRITICAL INSTRUCTION:
      If the user mentions an address, street name, hospital, or specific house, you MUST use the googleMaps tool to find the exact pinpoint URI. 
      
      USER INPUT: "${input}"
      CONTEXT OF WHAT WE ALREADY KNOW: ${context.existingFacts}
    `,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: context.latLng
        }
      }
    }
  });

  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  for (const chunk of groundingChunks) {
    if (chunk.maps) {
      sources.push({
        title: chunk.maps.title || "Pinned Location",
        uri: chunk.maps.uri
      });
    } else if (chunk.web) {
      sources.push({
        title: chunk.web.title || "Historical Context",
        uri: chunk.web.uri
      });
    }
  }

  // Pass 2: Structuring for DB
  const structResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Format this conversation into the JSON schema. 
      
      CONSOLIDATION RULES:
      1. If the user input is just adding a detail to a person already mentioned (e.g., "He died in 1990"), do NOT create a separate timeline 'proposal'. Instead, put it in 'proposedEntities' with details.
      2. 'proposals' are for MAJOR LIFE EVENTS or STORIES. (e.g., "I grew up in X", "The kidnapping", "Our wedding").
      3. If the input is just one fact in a series of facts about the same subject, merge them in your 'biographerFeedback' but only create ONE proposal if a story is actually being told.
      4. DO NOT create multiple proposals for the same sentence.
      
      USER INPUT: "${input}"
      BIOGRAPHER'S RESPONSE: "${response.text}"
      EXISTING CONTEXT: ${context.existingFacts}
    `,
    config: {
      responseMimeType: 'application/json',
      responseSchema: MEMORY_PARSER_SCHEMA,
    }
  });

  try {
    const result = JSON.parse(structResponse.text?.trim() || '{}');
    return {
      ...result,
      sources
    };
  } catch (e) {
    return { proposals: [], proposedEntities: [], biographerFeedback: response.text || "I'm listening.", currentInvestigationTopic: "Listening", isStoryComplete: false, sources };
  }
}

export async function analyzeMedia(base64Data: string, mimeType: string, context: { birthYear: number, existingFacts: string }) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "What's the story behind this? Context: " + context.existingFacts }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedYear: { type: Type.STRING },
          suggestedLocation: { type: Type.STRING },
          narrative: { type: Type.STRING },
          analysis: { type: Type.STRING },
          biographerCuriosity: { type: Type.STRING },
          suggestedEraCategories: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['narrative', 'analysis', 'biographerCuriosity']
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{}');
}
