
import { GoogleGenAI, Type } from "@google/genai";
import { Survey, Response, AIAnalysis, RiskAlert } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility function to handle transient API errors (like 500s) with exponential backoff.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 500 || error.code === 500 || error.message?.includes("500"))) {
      console.warn(`Gemini API 500 detected. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeSurveyData(survey: Survey, responses: Response[]): Promise<AIAnalysis> {
  // Using gemini-3-flash-preview for significantly better stability with large structured outputs
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Perform a professional decision intelligence analysis for the survey: "${survey.title}".
    Context: ${survey.description}
    Data: ${JSON.stringify(responses.map(r => r.answers))}

    Return a strictly valid JSON report following this precise structure:
    1. A 2-3 sentence executive summary.
    2. Sentiment score (0.0 to 1.0).
    3. Top 3 actionable recommendations.
    4. 3 observed trends.
    5. List of weak areas.
    6. 5 core keywords.
    7. Emotional distribution (percentages for Joy, Anger, Surprise, Disappointment, Neutral).
    8. Any detected anomalies.
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary of findings" },
            sentimentScore: { type: Type.NUMBER, description: "Normalized sentiment value" },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            emotions: {
              type: Type.OBJECT,
              properties: {
                Joy: { type: Type.NUMBER },
                Anger: { type: Type.NUMBER },
                Surprise: { type: Type.NUMBER },
                Disappointment: { type: Type.NUMBER },
                Neutral: { type: Type.NUMBER }
              },
              required: ["Joy", "Anger", "Surprise", "Disappointment", "Neutral"]
            },
            anomalies: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "sentimentScore", "recommendations", "trends", "weakAreas", "emotions"],
          propertyOrdering: ["summary", "sentimentScore", "recommendations", "trends", "weakAreas", "keywords", "emotions", "anomalies"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI engine");
    return JSON.parse(text);
  });
}

export async function generateRiskAlerts(surveyContext: string, recentResponses: Response[]): Promise<Omit<RiskAlert, 'id' | 'timestamp' | 'status'>[]> {
  const model = 'gemini-3-flash-preview';

  const prompt = `
    You are a real-time risk and alert monitoring assistant for an e-commerce review analytics platform.
    Continuously analyze incoming review and survey data streams in near real time.
    
    Context: ${surveyContext}
    Incoming Data Stream: ${JSON.stringify(recentResponses.map(r => r.answers))}

    Track key risk indicators including:
    – Sudden drops in average rating
    – Spikes in negative sentiment
    – Repeated complaint keywords
    – Abnormal review volume
    – Rating and sentiment mismatches

    Detect anomalies and risk patterns as soon as they appear and classify alert severity as Low, Medium, or High.
    
    Generate 1 to 3 alerts based on this batch.
    Return a strictly valid JSON array of alerts.
  `;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "The affected category or product group" },
              type: { 
                type: Type.STRING, 
                enum: ['Rating Drop', 'Sentiment Spike', 'Keyword Cluster', 'Volume Anomaly', 'Logic Mismatch'],
                description: "The detected issue type"
              },
              severity: { 
                type: Type.STRING, 
                enum: ['Low', 'Medium', 'High'],
                description: "Severity level"
              },
              rootCause: { type: Type.STRING, description: "Probable root cause" },
              action: { type: Type.STRING, description: "Recommended immediate corrective action" }
            },
            required: ["category", "type", "severity", "rootCause", "action"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  });
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const model = 'gemini-3-flash-preview';
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: "Transcribe the following audio precisely. If the audio is unclear, provide a brief summary of the speaker's likely intent. Output only the transcript." },
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } }
        ]
      }
    });
    return response.text || "";
  });
}

export async function summarizeText(text: string): Promise<string> {
  const model = 'gemini-3-flash-preview';
  
  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model,
      contents: `Provide a concise, professional 1-sentence summary of this response (max 15 words): "${text}"`,
    });
    return response.text?.trim() || "";
  });
}
