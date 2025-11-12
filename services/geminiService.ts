
import { GoogleGenAI, Type } from "@google/genai";
import { QAPair } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    pairs: {
      type: Type.ARRAY,
      description: "An array of question and answer pairs.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "A concise question." },
          answer: { type: Type.STRING, description: "A short, direct answer to the question." }
        },
        required: ["question", "answer"]
      }
    }
  },
  required: ["pairs"]
};

export const generateQAPairs = async (topic: string, count: number): Promise<QAPair[]> => {
  try {
    const prompt = `Generate ${count} distinct question/answer pairs about the topic "${topic}". The questions and answers should be concise enough to fit on a small card.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.pairs && Array.isArray(parsed.pairs)) {
      return parsed.pairs;
    } else {
      throw new Error("Invalid data format from API");
    }
  } catch (error) {
    console.error("Error generating Q&A pairs:", error);
    throw new Error("Could not generate content from Gemini. Please check your API key and network connection.");
  }
};
