import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const API_KEY = "AIzaSyAkTCNDg-Z6jdXNjwgOSB8SYDlJSa4AhGw";
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function run() {
  try {
    // Generate a 1x1 black png in base64 to test
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/png",
            },
          },
          { text: "Transform this image" },
        ],
      },
    });
    console.log("Success with gemini-2.5-flash-image!");
    console.log(response);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

run();
