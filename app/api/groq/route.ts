// app/api/groq/route.ts
import { NextResponse } from "next/server"
import Groq from "groq-sdk"

type GroqMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date | string
}

interface Options {
  persona?: string
  tone?: string
  temperature?: number
}

interface StartupContext {
  companyName?: string | null
  industry?: string | null
  location?: string | null
  bio?: string | null
  website?: string | null
  linkedin?: string | null
  companyStage?: string | null
  fundingStage?: string | null
  amountRaised?: string | null
  amountSeeking?: string | null
  teamSize?: string | null
  partnerships?: string | null
  hasVC?: boolean | null
  hasAngel?: boolean | null
  fundingRounds?: string | null
  milestones?: string | null
  monthsSinceFounding?: string | null
  founderName?: string | null
}

interface RequestBody {
  conversationId?: string
  history?: Message[]
  userId?: string
  userType?: "entrepreneur" | "investor"
  options?: Options
  startupContext?: StartupContext
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as RequestBody
    const {
      conversationId,
      history = [],
      userId,
      userType = "entrepreneur",
      options = {},
      startupContext
    } = body

    // Validation
    if (!userId) {
      return NextResponse.json({ error: "User not logged in" }, { status: 401 })
    }

    if (!Array.isArray(history)) {
      return NextResponse.json({ error: "History must be an array" }, { status: 400 })
    }

    if (history.some(msg => !msg.role || !msg.content || typeof msg.role !== 'string' || typeof msg.content !== 'string')) {
      return NextResponse.json({ error: "Invalid message structure in history" }, { status: 400 })
    }

    if (history.some(msg => !['user', 'assistant'].includes(msg.role))) {
      return NextResponse.json({ error: "Invalid role in history messages" }, { status: 400 })
    }

    if (userType && !['entrepreneur', 'investor'].includes(userType)) {
      return NextResponse.json({ error: "Invalid userType" }, { status: 400 })
    }

    // Extract options with defaults
    const { persona = "Strategist", tone = "Balanced", temperature = 0.7 } = options

    // Validate options
    if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
      return NextResponse.json({ error: "Temperature must be a number between 0 and 1" }, { status: 400 })
    }

    // Persona descriptions
    const personaPrompts = {
      "Strategist": "You are a strategic business advisor who provides comprehensive, long-term planning and market analysis.",
      "Critic": "You are a critical analyst who provides honest feedback, identifies weaknesses, and suggests improvements.",
      "Founder": "You are an experienced founder who shares practical insights from real startup experiences.",
      "Investor": "You are a seasoned investor who focuses on financial viability, scalability, and return potential."
    }

    // Tone descriptions
    const tonePrompts = {
      "Balanced": "Respond in a balanced, professional manner with appropriate detail.",
      "Formal": "Respond in a formal, business-appropriate manner with structured analysis.",
      "Casual": "Respond in a conversational, friendly manner that's easy to understand.",
      "Concise": "Respond with brief, direct answers focusing on key points only."
    }

    // Build startup context section for the system prompt
    let startupContextPrompt = ""
    if (startupContext) {
      const details: string[] = []
      if (startupContext.founderName) details.push(`Founder Name: ${startupContext.founderName}`)
      if (startupContext.companyName) details.push(`Company/Startup Name: ${startupContext.companyName}`)
      if (startupContext.industry) details.push(`Industry: ${startupContext.industry}`)
      if (startupContext.location) details.push(`Location: ${startupContext.location}`)
      if (startupContext.bio) details.push(`About the startup: ${startupContext.bio}`)
      if (startupContext.website) details.push(`Website: ${startupContext.website}`)
      if (startupContext.linkedin) details.push(`LinkedIn: ${startupContext.linkedin}`)
      if (startupContext.companyStage) details.push(`Company Stage: ${startupContext.companyStage}`)
      if (startupContext.fundingStage) details.push(`Funding Stage: ${startupContext.fundingStage}`)
      if (startupContext.amountRaised) details.push(`Amount Raised: $${startupContext.amountRaised}`)
      if (startupContext.amountSeeking) details.push(`Amount Seeking: $${startupContext.amountSeeking}`)
      if (startupContext.teamSize) details.push(`Team Size: ${startupContext.teamSize}`)
      if (startupContext.partnerships) details.push(`Number of Partnerships: ${startupContext.partnerships}`)
      if (startupContext.hasVC !== null && startupContext.hasVC !== undefined) details.push(`Has VC Funding: ${startupContext.hasVC ? 'Yes' : 'No'}`)
      if (startupContext.hasAngel !== null && startupContext.hasAngel !== undefined) details.push(`Has Angel Funding: ${startupContext.hasAngel ? 'Yes' : 'No'}`)
      if (startupContext.fundingRounds) details.push(`Funding Rounds Completed: ${startupContext.fundingRounds}`)
      if (startupContext.milestones) details.push(`Milestones Achieved: ${startupContext.milestones}`)
      if (startupContext.monthsSinceFounding) details.push(`Months Since Founding: ${startupContext.monthsSinceFounding}`)

      if (details.length > 0) {
        startupContextPrompt = `

      IMPORTANT — The user's current startup/company details are provided below. Use this information to give personalized, contextually relevant advice. When the user asks about "my startup", "my company", or any details about their business, refer to these details:
      
      --- USER'S STARTUP PROFILE ---
      ${details.join("\n      ")}
      --- END OF STARTUP PROFILE ---

      Always use the above startup details as context when answering. If the user asks about their startup name, industry, funding, team, or any related topic, answer based on the information above. Do not make up details that contradict the provided profile.`
      }
    }

    // System prompt for AI
    const systemPrompt = `
      ${personaPrompts[persona as keyof typeof personaPrompts] || personaPrompts.Strategist}

      ${tonePrompts[tone as keyof typeof tonePrompts] || tonePrompts.Balanced}

      Tailor your advice to the user type:
      - Entrepreneur: focus on value proposition, market traction, scaling, and funding.
      - Investor: focus on due diligence, team assessment, market size, risks, and portfolio optimization.

      User type: ${userType}
      Current persona: ${persona}
      Communication tone: ${tone}
      ${startupContextPrompt}
    `

    const conversationHistory: Message[] = Array.isArray(history) ? history : []

    const messages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Generate AI response with streaming
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature,
      max_tokens: 500,
      stream: true,
    })

    let aiResponse = ""
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ""
      aiResponse += content
    }
    aiResponse = aiResponse.trim() || "Sorry, I couldn't generate a response."

    let updatedChatId = conversationId
    let chatTitle = "Untitled Chat"

    // Generate summary for new conversation
    if (!conversationId) {
      const summaryPrompt = `
        Create a brief, descriptive title (3-7 words) for this conversation based on the user's first message and the AI's response.
        Focus on the main topic or question. Be specific but concise.

        User: ${conversationHistory[0]?.content || "No user message"}
        AI: ${aiResponse}

        Title:
      `
      const summaryCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: summaryPrompt }],
        temperature: 0.3,
        max_tokens: 15,
      })
      chatTitle = summaryCompletion.choices?.[0]?.message?.content?.trim() || "New Conversation"

      // Generate a new conversation ID for new conversations
      updatedChatId = crypto.randomUUID()
    }

    return NextResponse.json({
      conversationId: updatedChatId,
      text: aiResponse,
      title: chatTitle,
    })
  } catch (error) {
    console.error("Groq API Error:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "API configuration error. Please check your API key." },
          { status: 500 }
        )
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      }
      if (error.message.includes("model")) {
        return NextResponse.json(
          { error: "AI model temporarily unavailable. Please try again." },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: "Something went wrong while generating the response. Please try again." },
      { status: 500 }
    )
  }
}
