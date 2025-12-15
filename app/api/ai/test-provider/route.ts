import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createAIClient } from "@/lib/ai/providers"
import type { AIProvider } from "@/lib/types"

export async function POST(request: Request) {
  const provider: AIProvider = await request.json()

  try {
    const config = await createAIClient(provider)

    const { text } = await generateText({
      model: config.model,
      prompt: "Say 'AI provider is working!' in one short sentence.",
      maxOutputTokens: 50,
    })

    return NextResponse.json({ success: true, message: text })
  } catch (error) {
    console.error("Provider test error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 })
  }
}
