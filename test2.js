import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyAkTCNDg-Z6jdXNjwgOSB8SYDlJSa4AhGw";
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // wait, is it gemini-2.5-flash-image? They used gemini-2.5-flash-image
      contents: {
        parts: [
          { text: "A tiny cute cat" },
        ],
      },
    });
    console.log("Success with gemini-2.5-flash-image? Wait, text only?");
  } catch (error) {
    console.log("Error:", error.message);
  }
}

run();
