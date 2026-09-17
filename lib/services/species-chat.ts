/* eslint-disable */
import OpenAI from "openai";

const openai = new OpenAI({
  // JZ: create an open AI client with a personalized key
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(message: string): Promise<string> {
  const response = await openai.responses.create({
    // JZ: create a response using the open AI client
    model: "gpt-5.6-luna",
    instructions:
      "You are a chatbot that ONLY answers questions specifically about animal species — their habitat, diet, conservation status, behavior, and similar facts. If the user asks about anything else, decline by saying 'Nuh-uh! Nice try. I am an animal specialist chatbot, so only animal related questions are allowed! Try asking about my favorite animal instead :).'",
    input: message,
  });

  return response.output_text ?? "Unable to process your request :(. Try again. "; // JZ: return the response text or an empty string if no output";
}
