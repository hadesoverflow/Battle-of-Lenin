
import { GoogleGenAI, Type } from "@google/genai";
import { QAPair } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ||
  (typeof process !== 'undefined' ? process.env?.API_KEY : undefined);

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const FALLBACK_PAIRS: QAPair[] = [
  { question: "Tác phẩm nào đặt nền móng cho Chủ nghĩa Mác?", answer: "Tuyên ngôn của Đảng Cộng sản (1848)." },
  { question: "Lực lượng nào được xem là nòng cốt của cách mạng vô sản?", answer: "Giai cấp công nhân." },
  { question: "Điểm khác biệt chính giữa giai cấp và tầng lớp xã hội?", answer: "Giai cấp gắn với quan hệ sở hữu; tầng lớp phản ánh vị trí xã hội rộng hơn." },
  { question: "Liên bang Xô viết ra đời năm nào?", answer: "Năm 1922 sau Cách mạng Tháng Mười Nga." },
  { question: "Khái niệm vật chất trong triết học Mác-Lênin là gì?", answer: "Phạm trù triết học chỉ thực tại khách quan, độc lập với ý thức." },
  { question: "Ai lãnh đạo Cách mạng Tháng Mười Nga?", answer: "Vladimir I. Lênin." },
  { question: "Nguyên tắc tổ chức cơ bản của Đảng Cộng sản là gì?", answer: "Tập trung dân chủ." },
  { question: "Liên minh công-nông nhằm mục tiêu gì?", answer: "Tăng cường sức mạnh cách mạng và xây dựng chủ nghĩa xã hội." },
  { question: "Kinh tế nhà nước giữ vai trò gì trong thời kỳ quá độ?", answer: "Lực lượng vật chất chủ đạo, công cụ điều tiết nền kinh tế." },
  { question: "Tính Đảng trong triết học Mác-Lênin thể hiện như thế nào?", answer: "Đứng trên lập trường của giai cấp công nhân để phân tích và cải tạo thế giới." },
];

const getFallbackPairs = (count: number): QAPair[] => {
  if (count <= FALLBACK_PAIRS.length) {
    return FALLBACK_PAIRS.slice(0, count);
  }
  const result: QAPair[] = [];
  while (result.length < count) {
    result.push(...FALLBACK_PAIRS);
  }
  return result.slice(0, count);
};

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
  if (!ai) {
    console.warn("Gemini API key missing. Falling back to static data.");
    return getFallbackPairs(count);
  }

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
    return getFallbackPairs(count);
  }
};
