
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { TransformationConfig, Gender, AIAnalysis, PresetStyle, PersonaType, PersonaResult } from "../types";

// Note: Ensure your environment variable name matches (GEMINI_API_KEY or API_KEY)
const API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).API_KEY || '';

export const analyzeImage = async (base64Image: string, mimeType: string): Promise<AIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Analyze this portrait photo for a professional career profile. 
    Return a JSON object with:
    1. impression: (string) A short descriptive sentence about the first impression.
    2. lighting: (string) Neutral/Poor/Good with a comment.
    3. scoring: (number 1-100) Professionalism score.
    4. personalColor: (string) "Warm", "Cool", or "Neutral" based on skin tone and hair.
    5. recommendedColors: (string array) 3 colors that would suit them best as a background or attire.

    Example Response:
    {
      "impression": "Friendly and approachable, but slightly casual.",
      "lighting": "A bit dark, needs studio brightening.",
      "scoring": 65,
      "personalColor": "Warm",
      "recommendedColors": ["Navy Blue", "Dark Gray", "Sage Green"]
    }
  `;

  try {
    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.response.text());
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new Error("Failed to analyze photo.");
  }
};

export const transformToPersonaSet = async (
  base64Image: string,
  mimeType: string,
  config: TransformationConfig
): Promise<PersonaResult[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const genderPrompt = config.gender === Gender.MALE 
    ? "wearing a professional well-fitted classic suit and tie" 
    : config.gender === Gender.FEMALE 
      ? "wearing a professional high-end business blazer and blouse" 
      : "wearing formal professional business attire";

  const personas = [
    {
      id: PersonaType.EXECUTIVE,
      label: "The Executive",
      description: "Leadership & Authority",
      prompt: `
        TASK: Transform this casual photo into a premium Executive Leadership portrait.
        DETAILS:
        - Identity: Absolute fidelity to face. Identity must be crystal clear.
        - Attire: ${genderPrompt} in charcoal or navy. Premium fabric.
        - Background: Elegant high-end boardroom or minimalist executive studio in grayscale/navy.
        - Lighting: Dramatic but clean studio lighting with slight rim light for authority.
        - Quality: 8k resolution, cinematic professional studio style.
      `
    },
    {
      id: PersonaType.INNOVATOR,
      label: "The Innovator",
      description: "Tech & Future Focus",
      prompt: `
        TASK: Transform this casual photo into a modern Tech Founder/Innovator portrait.
        DETAILS:
        - Identity: Identify face exactly. No distortion.
        - Attire: Smart-casual premium blazer over a stylish knit or minimalist shirt.
        - Background: Modern IT startup office with glass walls, soft bokeh, and warm cinematic plants.
        - Lighting: Natural soft window lighting, airy and approachable.
        - Quality: 8k resolution, contemporary editorial portrait.
      `
    },
    {
      id: PersonaType.SPECIALIST,
      label: "The Specialist",
      description: "Expert & Speaker",
      prompt: `
        TASK: Transform this casual photo into a dynamic Keynote Speaker / Expert Specialist portrait.
        DETAILS:
        - Identity: Exact face fidelity.
        - Attire: Trendy professional contemporary look. High-end modern cut.
        - Background: Sophisticated minimalist studio with a subtle spotlight (Key light) on the subject. Minimalist mood.
        - Lighting: Bold artistic studio lighting contrast.
        - Quality: 8k resolution, magazine-style professional portrait.
      `
    }
  ];

  try {
    const results = await Promise.all(personas.map(async (p) => {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: p.prompt },
          ],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
      
      if (imagePart?.inlineData) {
        return {
          id: p.id,
          label: p.label,
          description: p.description,
          url: `data:image/png;base64,${imagePart.inlineData.data}`
        };
      }
      throw new Error(`Failed to generate ${p.label}`);
    }));

    return results;
  } catch (error) {
    console.error("Persona Set Error:", error);
    throw new Error("AI Persona set generation failed.");
  }
};

export const transformToProfessionalPhoto = async (
  base64Image: string,
  mimeType: string,
  config: TransformationConfig
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  let styleDetails = "";
  switch(config.style) {
    case PresetStyle.TRADITIONAL:
      styleDetails = "Traditional high-end business attire. Think executive leadership.";
      break;
    case PresetStyle.MODERN_TECH:
      styleDetails = "Modern professional. Smart-casual tech startup founder look.";
      break;
    case PresetStyle.CREATIVE:
      styleDetails = "Creative professional. Stylish and expressive but still premium.";
      break;
    case PresetStyle.KOREAN_ID:
      styleDetails = "Clear ID photo style following Korean recruitment standards (clean, bright, formal).";
      break;
    case PresetStyle.PASSPORT:
      styleDetails = "REPLACE THE ENTIRE BACKGROUND with a pure, solid, flat WHITE background (#FFFFFF) with NO shadows. This is for an official passport photo. Maintain neutral expression, eyes looking directly at camera. Clear visibility of both ears. Remove any hats/sunglasses. The background MUST BE 100% WHITE.";
      break;
    case PresetStyle.INSTAGRAM:
      styleDetails = "Aesthetic lifestyle portrait. Background: A trendy, minimalist aesthetic cafe with natural soft lighting and plants. Fashionable contemporary 'Quiet Luxury' look with natural colors and bokeh effect.";
      break;
    default:
      styleDetails = "General professional studio portrait.";
  }

  const genderPrompt = config.gender === Gender.MALE 
    ? "wearing a professional well-fitted classic suit and tie" 
    : config.gender === Gender.FEMALE 
      ? "wearing a professional high-end business blazer and blouse" 
      : "wearing formal professional business attire";

  const prompt = `
    TASK: Transform this casual photo into a premium professional studio portrait.
    
    DETAILS:
    1. Person: KEEP facial features and identity identical. No distortion.
    2. Attire: ${genderPrompt}. ${styleDetails}
    3. Lighting: Apply 3-point studio lighting (Key, Fill, Back light) to create depth and eliminate harsh shadows.
    4. Background: Solid professional ${config.background} background.
    5. Quality: 8k resolution, cinematic studio portrait style.
    
    CRITICAL: Maintain the original soul of the face. Only professionalize the environment and attire.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: prompt },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find(p => p.inlineData);
    
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }

    throw new Error("No image data found in response.");
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("AI Transformation failed.");
  }
};
