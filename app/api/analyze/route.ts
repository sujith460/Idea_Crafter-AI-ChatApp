import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { startupDataStats } from "@/lib/startup-data-stats"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

export interface StartupInput {
    companyName: string
    category: string
    location: string
    companyStage: string
    fundingStage: string
    amountRaised: number
    amountSeeking: number
    teamSize: number
    relationships: number
    hasVC: boolean
    hasAngel: boolean
    fundingRounds: number
    milestones: number
    monthsSinceFounding: number
}

export interface StageAnalysis {
    currentStage: string
    stageScore: number
    nextStage: string
    stageDetails: string
}

export interface RiskItem {
    category: string
    severity: "high" | "medium" | "low"
    description: string
    mitigation: string
}

export interface RecommendationItem {
    title: string
    priority: "high" | "medium" | "low"
    description: string
    actionItems: string[]
}

export interface ProgressAnalysis {
    overallScore: number
    dimensions: {
        funding: number
        traction: number
        team: number
        market: number
        product: number
    }
    trajectory: "accelerating" | "growing" | "steady" | "declining"
    benchmarkComparison: string
}

export interface ResourceItem {
    title: string
    type: "youtube" | "article" | "tool"
    url: string
    description: string
    relevance: string
}

export interface AnalysisResult {
    stage: StageAnalysis
    risks: RiskItem[]
    recommendations: RecommendationItem[]
    progress: ProgressAnalysis
    resources: ResourceItem[]
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as StartupInput

        // Basic validation
        if (!body.companyName || !body.category) {
            return NextResponse.json(
                { error: "Company name and category are required" },
                { status: 400 }
            )
        }

        const categoryStats =
            startupDataStats.categorySuccessRates[
            body.category as keyof typeof startupDataStats.categorySuccessRates
            ] || startupDataStats.categorySuccessRates.other

        // Build comprehensive LLM prompt
        const systemPrompt = `You are an expert startup analyst. You will analyze a startup based on its details and real-world data patterns from a dataset of ${startupDataStats.totalStartups} startups.

IMPORTANT DATA PATTERNS FROM REAL STARTUP DATA:
- Overall acquisition rate: ${(startupDataStats.statusDistribution.acquisitionRate * 100).toFixed(1)}%
- Category "${body.category}" success rate: ${(categoryStats.successRate * 100).toFixed(1)}% (${categoryStats.total} startups in dataset)
- VC-backed startups: ${(startupDataStats.fundingRoundImpact.hasVC.successRate * 100).toFixed(1)}% success rate
- Angel-backed startups: ${(startupDataStats.fundingRoundImpact.hasAngel.successRate * 100).toFixed(1)}% success rate
- Avg funding for acquired startups: $${(startupDataStats.fundingPatterns.avgFundingAcquired / 1e6).toFixed(1)}M
- Avg funding for closed startups: $${(startupDataStats.fundingPatterns.avgFundingClosed / 1e6).toFixed(1)}M
- High relationships (10+) success rate: ${(startupDataStats.relationshipsImpact.highRelationships.successRate * 100).toFixed(1)}%
- Low relationships (≤3) success rate: ${(startupDataStats.relationshipsImpact.lowRelationships.successRate * 100).toFixed(1)}%
- Startups with milestones: ${(startupDataStats.milestonesImpact.withMilestones.successRate * 100).toFixed(1)}% success
- Startups without milestones: ${(startupDataStats.milestonesImpact.withoutMilestones.successRate * 100).toFixed(1)}% success
- Top 500 startups: ${(startupDataStats.top500Impact.isTop500.successRate * 100).toFixed(1)}% success rate
- Funding round progression impact: Series A ${(startupDataStats.fundingRoundImpact.hasRoundA.successRate * 100).toFixed(1)}%, B ${(startupDataStats.fundingRoundImpact.hasRoundB.successRate * 100).toFixed(1)}%, C ${(startupDataStats.fundingRoundImpact.hasRoundC.successRate * 100).toFixed(1)}%, D ${(startupDataStats.fundingRoundImpact.hasRoundD.successRate * 100).toFixed(1)}%

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no explanation) in this exact format:
{
  "stage": {
    "currentStage": "one of: Idea, Prototype, MVP, Early Revenue, Growth, Scale",
    "stageScore": <number 0-100>,
    "nextStage": "the next stage after current",
    "stageDetails": "2-3 sentence explanation of current positioning"
  },
  "risks": [
    {
      "category": "e.g. Funding, Market, Team, Product, Competition",
      "severity": "high|medium|low",
      "description": "1-2 sentence risk description",
      "mitigation": "1-2 sentence mitigation strategy"
    }
  ],
  "recommendations": [
    {
      "title": "short actionable title",
      "priority": "high|medium|low",
      "description": "2-3 sentence recommendation",
      "actionItems": ["specific action 1", "specific action 2", "specific action 3"]
    }
  ],
  "progress": {
    "overallScore": <number 0-100>,
    "dimensions": {
      "funding": <number 0-100>,
      "traction": <number 0-100>,
      "team": <number 0-100>,
      "market": <number 0-100>,
      "product": <number 0-100>
    },
    "trajectory": "accelerating|growing|steady|declining",
    "benchmarkComparison": "1-2 sentence comparison to data benchmarks"
  },
  "resources": [
    {
      "title": "Video or article title",
      "type": "youtube",
      "url": "https://www.youtube.com/results?search_query=<relevant+search+query>",
      "description": "1 sentence about what the viewer will learn",
      "relevance": "1 sentence why this is relevant to this startup"
    }
  ]
}

Provide exactly 3-5 risks, 3-5 recommendations, and 4-6 resources. Resources MUST be YouTube search URLs (https://www.youtube.com/results?search_query=...) for topics directly relevant to the startup's current stage, challenges, and industry. Include searches for: fundraising strategies, growth tactics, industry-specific tutorials, and founder advice videos. All scores should be realistic based on the data patterns above and the startup's details.

CRITICAL: All risk descriptions, recommendations, mitigations, and action items MUST be specific to the startup's category/industry. Reference industry-specific challenges, regulations, competitors, market dynamics, customer acquisition strategies, and trends relevant to the "${body.category}" sector. Do NOT give generic startup advice — tailor everything to the specific industry.`

        const userPrompt = `Analyze this startup:
- Company: ${body.companyName}
- Category: ${body.category}
- Location: ${body.location || "Not specified"}
- Current Stage: ${body.companyStage}
- Funding Stage: ${body.fundingStage}
- Amount Raised: $${body.amountRaised.toLocaleString()}
- Amount Seeking: $${body.amountSeeking.toLocaleString()}
- Team Size: ${body.teamSize}
- Relationships/Partnerships: ${body.relationships}
- Has VC: ${body.hasVC ? "Yes" : "No"}
- Has Angel: ${body.hasAngel ? "Yes" : "No"}
- Funding Rounds Completed: ${body.fundingRounds}
- Milestones Achieved: ${body.milestones}
- Time Since Founding: ${body.monthsSinceFounding} months

IMPORTANT: Tailor all analysis specifically to the "${body.category}" industry. Reference real industry-specific challenges, market trends, regulatory considerations, and competitive dynamics in this sector.`

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 2000,
        })

        const rawText = completion.choices?.[0]?.message?.content?.trim() || ""

        // Parse JSON from response, handling potential markdown wrapping
        let parsed: AnalysisResult
        try {
            const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
            parsed = JSON.parse(jsonStr) as AnalysisResult
        } catch {
            console.error("Failed to parse LLM response:", rawText)
            return NextResponse.json(
                { error: "Failed to parse AI analysis. Please try again." },
                { status: 500 }
            )
        }

        return NextResponse.json(parsed)
    } catch (error) {
        console.error("Analyze API Error:", error)

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
        }

        return NextResponse.json(
            { error: "Something went wrong during analysis. Please try again." },
            { status: 500 }
        )
    }
}
