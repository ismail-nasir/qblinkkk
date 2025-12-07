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
      You are an operations manager for a busy retail store.
      Current Queue Stats:
      - People Waiting: ${metrics.waiting}
      - People Served Today: ${metrics.served}
      - Average Wait Time: ${metrics.avgWaitTime} minutes.

      Provide one single, punchy, motivating sentence of advice or observation for the staff managing this queue.
      Keep it under 20 words.
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