
import { GoogleGenAI } from "@google/genai";
import { QueueMetric } from '../types';

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
