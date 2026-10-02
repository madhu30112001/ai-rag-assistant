import 'dotenv/config';

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

let openAIClient;
let googleClient;
export const EMBEDDING_DIMENSIONS = 768;

// Lazily create the OpenAI client only for code paths that need it.
export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error(
      'OPENAI_API_KEY is not set. Add it to Server/.env.'
    );
    error.status = 503;
    throw error;
  }

  openAIClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openAIClient;
}

// Lazily create the Gemini client and fail clearly when its key is missing.
export function getGoogleClient() {
  if (!process.env.GOOGLE_API_KEY) {
    const error = new Error('GOOGLE_API_KEY is not set. Add it to Server.');
    error.status = 503;
    throw error;
  }

  googleClient ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  return googleClient;
}

function getEmbeddingProvider(model) {
  if (/^gemini-/i.test(model)) return 'google';
  if (/^(text-embedding-|openai-)/i.test(model)) return 'openai';
  if (/^claude-/i.test(model)) return 'claude';

  const error = new Error(
    `Unsupported embedding model "${model}". Use a Gemini or OpenAI embedding model.`
  );
  error.status = 400;
  throw error;
}

// Generate vectors with the provider selected by EMBEDDING_MODEL.
export async function createEmbeddings(texts) {
  const model = process.env.EMBEDDING_MODEL;

  if (!Array.isArray(texts) || !texts.length) return [];

  const provider = getEmbeddingProvider(model);
  if (provider === 'claude') {
    const error = new Error(
      'Claude models do not provide an embeddings API. Configure EMBEDDING_MODEL with a Gemini or OpenAI embedding model.'
    );
    error.status = 400;
    throw error;
  }

  try {
    if (provider === 'openai') {
      const response = await getOpenAIClient().embeddings.create({
        model,
        input: texts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      return response.data
        .sort((left, right) => left.index - right.index)
        .map(({ embedding }) => embedding);
    }

    const google = getGoogleClient();
    return await Promise.all(
      texts.map(async (text) => {
        const response = await google.models.embedContent({
          model,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        });
        const values = response.embeddings?.[0]?.values;

        if (!Array.isArray(values)) {
          throw new Error('Gemini returned no embedding values.');
        }

        return values;
      })
    );
  } catch (error) {
    const serviceError = new Error(
      `${provider} embedding request failed: ${error.message}`,
      { cause: error }
    );
    serviceError.status = error.status >= 400 && error.status < 500 ? 502 : 503;
    throw serviceError;
  }
}
