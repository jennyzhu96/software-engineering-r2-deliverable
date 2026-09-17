/* eslint-disable */
import { generateResponse } from "@/lib/services/species-chat";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { message: string }; // JZ: Wait for user question
  const message = body.message; // JZ: Extract and parse the json and actually get the message / question from the user

  if (!message) {
    // JZ: catch errors (user error)
    return NextResponse.json({ error: "Invalid or missing body" }, { status: 400 });
  }

  try {
    const response = await generateResponse(message); // JZ: get the response from chat
    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({ error: "Failed to get response from AI service" }, { status: 502 });
    // JZ: catch even more errors (smth failed when sending to server)
  }
}
