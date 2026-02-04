
import { GoogleGenAI } from "@google/genai";

export class BotBrain {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async getResponse(prompt: string, persona: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
    try {
      // Re-initialize to ensure we use the latest injected API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: `You are a WhatsApp bot. ${persona}. Keep responses concise and use emojis where appropriate. Respond in the same language as the user.`,
          temperature: 0.7,
        }
      });

      return response.text || "I'm sorry, I couldn't process that.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "System Error: Unable to reach the bot brain.";
    }
  }
}

export const botBrain = new BotBrain();
