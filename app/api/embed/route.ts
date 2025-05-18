// app/api/embed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

// Initialiser le client Mistral AI
const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input required" },
        { status: 400 }
      );
    }

    // Générer l'embedding avec Mistral AI
    const response = await client.embeddings.create({
      model: "mistral-embed",
      inputs: text,
    });

    const embedding = response.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}
