import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Safe access to process.env to prevent ReferenceError in browser environments
  let apiKey = '';
  try {
    // Check if process is actually defined before accessing it to avoid "ReferenceError: process is not defined"
    if (typeof process !== 'undefined' && process && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.warn("Could not access process.env", e);
  }
  return apiKey;
};

export const improveTaskDescription = async (currentDescription: string, tone: 'professional' | 'concise' | 'creative'): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("API Key not found. AI features will be disabled.");
      return currentDescription;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are an expert project manager. Rewrite the following task description to be more ${tone}. 
      Keep the meaning but improve clarity and structure.
      
      Original Description:
      "${currentDescription}"
      
      Output only the improved description, no markdown wrappers if possible.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || currentDescription;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return currentDescription;
  }
};

export const analyzeTaskWithThinking = async (taskTitle: string, currentDescription: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("API Key not found.");
      return "AI features disabled: No API Key found.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the following task and provide a detailed breakdown, potential risks, and suggested subtasks.
      
      Task Title: ${taskTitle}
      Current Description: ${currentDescription}
      
      Think deeply about the implications of this task in a software development context.
    `;

    // Using Gemini 3.0 Pro with Thinking Config
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget
        // Note: Do not set maxOutputTokens when using thinkingBudget to avoid cutting off the response
      }
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini Thinking Error:", error);
    return "Failed to analyze task. Please try again later.";
  }
};