
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TransformationConfig, Gender } from "../types";

// Declare process for TypeScript to avoid build errors during 'tsc'
declare var process: {
  env: {
    API_KEY: string;
  };
};

export const transformToProfessionalPhoto = async (
  base64Image: string,
  mimeType: string,
  config: TransformationConfig
): Promise<string> => {
  // Use the API key from process.env.API_KEY injected by Vite
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const genderPrompt = config.gender === Gender.MALE 
    ? "wearing a professional well-fitted suit and tie" 
    : config.gender === Gender.FEMALE 
      ? "wearing a professional business blazer or blouse" 
      : "wearing professional business attire";

  const prompt = `
    TASK: Transform this casual photo into a high-quality professional studio portrait for a resume or CV.
    
    DETAILS:
    1. Person: Maintain the person's facial features and identity accurately.
    2. Attire: Change clothing to be ${genderPrompt}.
    3. Lighting: Apply professional studio lighting (soft box lighting) to eliminate harsh shadows and enhance facial clarity.
    4. Background: Replace the background with a clean, professional, solid ${config.background} studio background.
    5. Style: The final image should look like it was taken in a professional photo studio (ID photo style). 
    6. Framing: Centered headshot or half-body portrait.
    
    CRITICAL: Do not distort the person's face. Keep the original features recognizable but enhance the overall professional aesthetic.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("Failed to generate professional photo.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("AI Transformation failed. Please try again with a clearer photo.");
  }
};
