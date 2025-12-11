
import { GoogleGenAI, Type } from "@google/genai";
import { QueueMetric, Visitor } from '../types';

const getClient = () => {
  let apiKey: string | undefined;
  
  try {
    // Check if process is defined (node/shim) before accessing .env
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
    console.warn("Unable to access process environment variables");
  }

  if (!apiKey) {
    console.warn("API_KEY not found. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getQueueInsights = async (metrics: QueueMetric): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI insights unavailable (Missing API Key).";

  try {
    const prompt = `
      You are an operations manager for a busy business using a digital queue system.
      Current Stats:
      - People Waiting: ${metrics.waiting}
      - People Served Today: ${metrics.served}
      - Avg Wait Time: ${metrics.avgWaitTime} min
      - Customer Satisfaction Rating: ${metrics.averageRating || 'N/A'}/5.0

      Provide one single, punchy, actionable sentence of advice.
      If the rating is low (< 3.5), suggest an improvement.
      If the rating is high (> 4.5), congratulate the team.
      Keep it under 25 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Keep the flow moving!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this moment.";
  }
};

export const optimizeQueueOrder = async (visitors: Visitor[]): Promise<{ orderedIds: string[], reasoning: string } | null> => {
  const ai = getClient();
  if (!ai) return null;

  // Minimize payload size
  const inputData = visitors.map(v => ({
    id: v.id,
    name: v.name,
    isPriority: v.isPriority,
    joinTime: v.joinTime,
    isLate: v.isLate
  }));

  const prompt = `
    You are a queue optimization algorithm. Reorder this list of visitors to maximize efficiency and fairness.
    
    Rules:
    1. VIPs (isPriority=true) should generally be served before non-VIPs.
    2. HOWEVER, if a non-VIP has been waiting significantly longer (based on joinTime) than a newly joined VIP, you should prioritize the long-waiting non-VIP to prevent starvation.
    3. Late users (isLate=true) should generally be de-prioritized unless they are VIPs.
    4. Grouping by type is good, but fairness is better.

    Return the result in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: JSON.stringify(inputData) + "\n\n" + prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderedIds: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "The list of visitor IDs in the optimized order."
            },
            reasoning: { 
              type: Type.STRING,
              description: "A short, one-sentence explanation of why this order was chosen (e.g., 'Prioritized 2 VIPs but bumped up John due to long wait time.')."
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Reorder Error:", error);
    return null;
  }
};

export const analyzeCustomerFeedback = async (feedbackData: { rating: number, text?: string }[]): Promise<{ summary: string, sentiment: 'positive' | 'neutral' | 'negative', keywords: string[] } | null> => {
  const ai = getClient();
  if (!ai) return null;

  if (feedbackData.length === 0) return null;

  const prompt = `
    Analyze the following customer feedback entries from a queue management system.
    Identify common themes, complaints, or praises.
    
    Feedback Data:
    ${JSON.stringify(feedbackData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief paragraph summarizing the general customer sentiment." },
            sentiment: { type: Type.STRING, enum: ["positive", "neutral", "negative"] },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3-5 keywords related to the feedback." }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Feedback Analysis Error:", error);
    return null;
  }
};
