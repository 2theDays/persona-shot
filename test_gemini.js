import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyAkTCNDg-Z6jdXNjwgOSB8SYDlJSa4AhGw";
const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}`);
    const prompt = "A tiny cute cat";
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseModalities: ['Image'],
      },
    });
    console.log(`✅ Success with ${modelName}`);
  } catch (error) {
    console.log(`❌ Failed with ${modelName}:`, error.message);
  }
}

async function run() {
  await testModel('gemini-2.5-flash-image');
  await testModel('gemini-3.1-flash-image-preview');
  await testModel('gemini-3-pro-image-preview');
  await testModel('imagen-3.0-generate-002');
  await testModel('gemini-2.0-flash');
}

run();
