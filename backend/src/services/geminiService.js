const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash';
let client;
let configuredApiKey;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  if (!client || configuredApiKey !== apiKey) {
    const timeout = Number(process.env.GEMINI_TIMEOUT_MS) || 15000;
    client = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout },
    });
    configuredApiKey = apiKey;
  }

  return client;
}

async function generateContent({
  contents,
  systemInstruction,
  model,
  temperature = 0.7,
  maxOutputTokens = 800,
  responseMimeType,
}) {
  const ai = getClient();
  if (!ai) return null;

  const targetModel = model || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents,
      config: {
        temperature,
        maxOutputTokens,
        ...(systemInstruction ? { systemInstruction } : {}),
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    });

    return typeof response.text === 'string' ? response.text.trim() || null : null;
  } catch (error) {
    const status = error?.status || error?.code || error?.name || 'unknown';
    console.warn(`[geminiService] Request with model ${targetModel} failed (${status}).`);

    if (targetModel !== FALLBACK_MODEL) {
      try {
        console.info(`[geminiService] Attempting fallback to ${FALLBACK_MODEL}...`);
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents,
          config: {
            temperature,
            maxOutputTokens,
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(responseMimeType ? { responseMimeType } : {}),
          },
        });
        return typeof fallbackResponse.text === 'string' ? fallbackResponse.text.trim() || null : null;
      } catch (fallbackError) {
        console.warn(`[geminiService] Fallback model ${FALLBACK_MODEL} also failed: ${fallbackError?.message || fallbackError}`);
      }
    }

    return null;
  }
}

module.exports = { DEFAULT_MODEL, FALLBACK_MODEL, generateContent };