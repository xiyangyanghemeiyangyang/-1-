import { GoogleGenAI, Type } from "@google/genai";
import { SongMetadata } from "../types";

const GEMINI_MODEL = "gemini-2.5-flash";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const identifySong = async (base64Audio: string, mimeType: string): Promise<SongMetadata> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the provided audio. 
    1. Identify the song title, artist, and album if it's a known song.
    2. If it is an instrumental or unknown, describe the genre and mood as the title/artist.
    3. EXTRACT THE LYRICS accurately in the original language. Format the lyrics with proper line breaks.
    4. If there are no lyrics, state "[Instrumental]" in the lyrics field.
  `;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the song" },
            artist: { type: Type.STRING, description: "Artist name" },
            album: { type: Type.STRING, description: "Album name" },
            year: { type: Type.STRING, description: "Release year" },
            genre: { type: Type.STRING, description: "Music genre" },
            mood: { type: Type.STRING, description: "Mood of the track" },
            lyrics: { type: Type.STRING, description: "Full lyrics with line breaks" },
            language: { type: Type.STRING, description: "Language of the lyrics" }
          },
          required: ["title", "artist", "lyrics"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(resultText) as SongMetadata;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the Data URL prefix (e.g., "data:audio/mp3;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = error => reject(error);
  });
};