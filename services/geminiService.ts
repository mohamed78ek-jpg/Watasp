
import { GoogleGenAI } from "@google/genai";

export class BotBrain {
  async getResponse(prompt: string, persona: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
    try {
      // Create a new instance right before the call to ensure it uses the current API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ role: h.role, parts: h.parts })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: `أنت بوت واتساب سينمائي متخصص. ${persona}. اجعل الردود قصيرة ومفيدة واستخدم الرموز التعبيرية السينمائية. أجب بنفس لغة المستخدم.`,
          temperature: 0.8,
        }
      });

      // Directly access .text property as per guidelines
      return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
    } catch (error: any) {
      console.error("Gemini Error:", error);
      if (error?.message?.includes("Requested entity was not found")) {
        return "خطأ: مفتاح API غير صالح أو غير مفعل. يرجى التحقق من الإعدادات.";
      }
      return "خطأ في النظام: تعذر الوصول إلى عقل البوت.";
    }
  }
}

export const botBrain = new BotBrain();
