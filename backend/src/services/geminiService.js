const { GoogleGenAI } = require('@google/genai');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.8-flash';
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

async function generateContentResponse({
  contents,
  systemInstruction,
  model,
  temperature = 0.7,
  maxOutputTokens = 800,
  responseMimeType,
  tools,
}) {
  const ai = getClient();
  if (!ai) return null;

  const targetModel = model || process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const config = {
    temperature,
    maxOutputTokens,
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(responseMimeType ? { responseMimeType } : {}),
    ...(tools ? { tools } : {}),
  };

  try {
    return await ai.models.generateContent({
      model: targetModel,
      contents,
      config,
    });
  } catch (error) {
    const status = error?.status || error?.code || error?.name || 'unknown';
    console.warn(`[geminiService] Request with model ${targetModel} failed (${status}).`);

    if (targetModel !== FALLBACK_MODEL) {
      try {
        console.info(`[geminiService] Attempting fallback to ${FALLBACK_MODEL}...`);
        return await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents,
          config,
        });
      } catch (fallbackError) {
        const fallbackStatus = fallbackError?.status || fallbackError?.code || fallbackError?.name || 'unknown';
        console.warn(`[geminiService] Fallback model ${FALLBACK_MODEL} also failed (${fallbackStatus}).`);
      }
    }

    return null;
  }
}

async function generateContent(options) {
  const response = await generateContentResponse(options);
  return typeof response?.text === 'string' ? response.text.trim() || null : null;
}

module.exports = {
  DEFAULT_MODEL,
  FALLBACK_MODEL,
  generateContent,
  generateContentResponse,
};