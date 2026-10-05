"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import {
    ArrowLeft,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    BarChart3,
    Loader2,
    ChevronDown,
    ChevronUp,
    Rocket,
    Shield,
    Target,
    Zap,
    CheckCircle2,
    UserCircle,
    PenLine,
    ExternalLink,
    Play,
} from "lucide-react"
import Link from "next/link"
import { categoryOptions } from "@/lib/startup-data-stats"

interface StageAnalysis {
    currentStage: string
    stageScore: number
    nextStage: string
    stageDetails: string
}

interface RiskItem {
    category: string
    severity: "high" | "medium" | "low"
    description: string
    mitigation: string
}

interface RecommendationItem {
    title: string
    priority: "high" | "medium" | "low"
    description: string
    actionItems: string[]
}

interface ProgressAnalysis {
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

interface ResourceItem {
    title: string
    type: "youtube" | "article" | "tool"
    url: string
    description: string
    relevance: string
}

interface AnalysisResult {
    stage: StageAnalysis
    risks: RiskItem[]
    recommendations: RecommendationItem[]
    progress: ProgressAnalysis
    resources: ResourceItem[]
}

interface Profile {
    id: string
    email: string
    user_type: "entrepreneur" | "investor"
    full_name: string | null
    company: string | null
    industry: string | null
    location: string | null
    bio: string | null
    website: string | null
    linkedin: string | null
    company_stage: string | null
    funding_stage: string | null
    amount_raised: string | null
    amount_seeking: string | null
    team_size: string | null
    relationships: string | null
    has_vc: boolean | null
    has_angel: boolean | null
    funding_rounds: string | null
    milestones: string | null
    months_since_founding: string | null
}

const stages = ["Idea", "Prototype", "MVP", "Early Revenue", "Growth", "Scale"]

const stageOptions = [
    { value: "idea", label: "Idea / Concept" },
    { value: "prototype", label: "Prototype" },
    { value: "mvp", label: "MVP" },
    { value: "early_revenue", label: "Early Revenue" },
    { value: "growth", label: "Growth" },
    { value: "scale", label: "Scale" },
]

const fundingStageOptions = [
    { value: "pre_seed", label: "Pre-Seed" },
    { value: "seed", label: "Seed" },
    { value: "series_a", label: "Series A" },
    { value: "series_b", label: "Series B" },
    { value: "series_c", label: "Series C+" },
    { value: "bootstrapped", label: "Bootstrapped" },
]

// Map profile industry values to analyzer category values
const industryToCategoryMap: Record<string, string> = {
    technology: "software",
    healthcare: "biotech",
    fintech: "finance",
    "e-commerce": "ecommerce",
    education: "education",
    "real-estate": "real_estate",
    manufacturing: "hardware",
    energy: "cleantech",
    "food-beverage": "other",
    entertainment: "games_video",
    other: "other",
}

type AnalyzerMode = "my-startup" | "manual"

export default function StartupAnalyzerPage() {
    const [mode, setMode] = useState<AnalyzerMode>("my-startup")
    const [loading, setLoading] = useState(false)
    const [profileLoading, setProfileLoading] = useState(true)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set())
    const [activeTab, setActiveTab] = useState<"stage" | "risks" | "recommendations" | "progress" | "resources">("stage")

    // Cache analysis results per mode so switching tabs doesn't lose them
    const [cachedResults, setCachedResults] = useState<Record<AnalyzerMode, AnalysisResult | null>>({
        "my-startup": null,
        "manual": null,
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Form state — numeric fields stored as strings to avoid leading-zero input bug
    const [form, setForm] = useState({
        companyName: "",
        category: "software",
        location: "",
        companyStage: "idea",
        fundingStage: "pre_seed",
        amountRaised: "",
        amountSeeking: "",
        teamSize: "1",
        relationships: "",
        hasVC: false,
        hasAngel: false,
        fundingRounds: "",
        milestones: "",
        monthsSinceFounding: "",
    })

    // Fetch profile on mount
    useEffect(() => {
        async function fetchProfile() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser()
                if (!user) {
                    setProfileLoading(false)
                    return
                }

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

                if (profileData) {
                    setProfile(profileData)
                    // Auto-fill form from profile
                    setForm((prev) => ({
                        ...prev,
                        companyName: profileData.company || "",
                        category: industryToCategoryMap[profileData.industry || ""] || "other",
                        location: profileData.location || "",
                        companyStage: profileData.company_stage || prev.companyStage,
                        fundingStage: profileData.funding_stage || prev.fundingStage,
                        amountRaised: profileData.amount_raised || prev.amountRaised,
                        amountSeeking: profileData.amount_seeking || prev.amountSeeking,
                        teamSize: profileData.team_size || prev.teamSize,
                        relationships: profileData.relationships || prev.relationships,
                        hasVC: profileData.has_vc ?? prev.hasVC,
                        hasAngel: profileData.has_angel ?? prev.hasAngel,
                        fundingRounds: profileData.funding_rounds || prev.fundingRounds,
                        milestones: profileData.milestones || prev.milestones,
                        monthsSinceFounding: profileData.months_since_founding || prev.monthsSinceFounding,
                    }))
                }
            } catch (err) {
                console.error("Error fetching profile:", err)
            } finally {
                setProfileLoading(false)
            }
        }

        fetchProfile()
    }, [supabase])

    // When switching modes, pre-fill or clear the basic fields
    const handleModeSwitch = (newMode: AnalyzerMode) => {
        // Save current result into cache before switching
        setCachedResults((prev) => ({ ...prev, [mode]: result }))
        setMode(newMode)
        // Restore cached result for the new mode (or null if none)
        setResult(cachedResults[newMode])
        setError(null)

        if (newMode === "my-startup" && profile) {
            setForm({
                companyName: profile.company || "",
                category: industryToCategoryMap[profile.industry || ""] || "other",
                location: profile.location || "",
                companyStage: profile.company_stage || "idea",
                fundingStage: profile.funding_stage || "pre_seed",
                amountRaised: profile.amount_raised ?? "",
                amountSeeking: profile.amount_seeking ?? "",
                teamSize: profile.team_size ?? "1",
                relationships: profile.relationships ?? "",
                hasVC: profile.has_vc ?? false,
                hasAngel: profile.has_angel ?? false,
                fundingRounds: profile.funding_rounds ?? "",
                milestones: profile.milestones ?? "",
                monthsSinceFounding: profile.months_since_founding ?? "",
            })
        } else if (newMode === "manual") {
            setForm((prev) => ({
                ...prev,
                companyName: "",
                category: "software",
                location: "",
                companyStage: "idea",
                fundingStage: "pre_seed",
                amountRaised: "",
                amountSeeking: "",
                teamSize: "1",
                relationships: "",
                hasVC: false,
                hasAngel: false,
                fundingRounds: "",
                milestones: "",
                monthsSinceFounding: "",
            }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    amountRaised: Number(form.amountRaised) || 0,
                    amountSeeking: Number(form.amountSeeking) || 0,
                    teamSize: Number(form.teamSize) || 1,
                    relationships: Number(form.relationships) || 0,
                    fundingRounds: Number(form.fundingRounds) || 0,
                    milestones: Number(form.milestones) || 0,
                    monthsSinceFounding: Number(form.monthsSinceFounding) || 0,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || "Analysis failed")
            }

            const data = (await res.json()) as AnalysisResult
            setResult(data)
            // Cache the result for the current mode
            setCachedResults((prev) => ({ ...prev, [mode]: data }))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const toggleRec = (idx: number) => {
        setExpandedRecs((prev) => {
            const next = new Set(prev)
            if (next.has(idx)) next.delete(idx)
            else next.add(idx)
            return next
        })
    }

    const severityColor = (s: string) => {
        if (s === "high") return "bg-red-100 text-red-700 border-red-200"
        if (s === "medium") return "bg-amber-100 text-amber-700 border-amber-200"
        return "bg-green-100 text-green-700 border-green-200"
    }

    const priorityColor = (p: string) => {
        if (p === "high") return "bg-red-100 text-red-700 border-red-200"
        if (p === "medium") return "bg-blue-100 text-blue-700 border-blue-200"
        return "bg-gray-100 text-gray-600 border-gray-200"
    }

    const trajectoryIcon = (t: string) => {
        if (t === "accelerating") return "🚀"
        if (t === "growing") return "📈"
        if (t === "steady") return "➡️"
        return "📉"
    }

    const getStageIndex = (stageName: string) => {
        const idx = stages.findIndex((s) => s.toLowerCase() === stageName.toLowerCase())
        return idx >= 0 ? idx : 0
    }

    const isProfileFieldsFilled = profile?.company || profile?.industry || profile?.location

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/dashboard"
                                className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                            >
                                StartupMentor
                            </Link>
                            <span className="text-gray-300">|</span>
                            <span className="text-lg font-semibold text-gray-700">Startup Analyzer</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="hover:bg-emerald-50">
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            AI-Powered
                        </span>{" "}
                        Startup Analyzer
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        Get instant stage prediction, risk assessment, recommendations, and progress tracking
                        powered by AI and real data from 923 startups.
                    </p>
                </motion.div>

                {/* Mode Switcher */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1.5 shadow-lg border border-emerald-100">
                        <button
                            onClick={() => handleModeSwitch("my-startup")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "my-startup"
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <UserCircle className="h-4 w-4" />
                            My Startup
                            {isProfileFieldsFilled && mode !== "my-startup" && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => handleModeSwitch("manual")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "manual"
                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                        >
                            <PenLine className="h-4 w-4" />
                            Other Startup
                        </button>
                    </div>
                </motion.div>

                {/* Auto-fill notification for My Startup mode */}
                <AnimatePresence>
                    {mode === "my-startup" && profile && isProfileFieldsFilled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="max-w-2xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">
                                        Profile details auto-filled!
                                    </p>
                                    <p className="text-xs text-emerald-600 mt-0.5">
                                        Company, industry, and location have been pre-filled from your profile.
                                        You can still edit all fields before analyzing.{" "}
                                        <Link href="/dashboard/profile" className="underline font-medium hover:text-emerald-800">
                                            Update profile →
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {mode === "my-startup" && !profileLoading && (!profile || !isProfileFieldsFilled) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                        >
                            <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">
                                        Complete your profile for auto-fill
                                    </p>
                                    <p className="text-xs text-amber-600 mt-0.5">
                                        Add your company, industry, and location to your profile to auto-fill fields here.{" "}
                                        <Link href="/dashboard/profile" className="underline font-medium hover:text-amber-800">
                                            Go to profile →
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-1"
                    >
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-24">
                            <CardHeader>
                                <CardTitle className="flex items-center text-lg">
                                    <Rocket className="h-5 w-5 mr-2 text-emerald-600" />
                                    {mode === "my-startup" ? "My Startup Details" : "Startup Details"}
                                </CardTitle>
                                <CardDescription>
                                    {mode === "my-startup"
                                        ? "Your profile details are pre-filled. Complete the rest for a full analysis."
                                        : "Enter any startup's information for AI analysis"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Company Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Name *
                                            {mode === "my-startup" && profile?.company && (
                                                <span className="ml-2 text-xs text-emerald-600 font-normal">
                                                    (from profile)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.companyName}
                                            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            placeholder="e.g. TechCo"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category / Industry *
                                            {mode === "my-startup" && profile?.industry && (
                                                <span className="ml-2 text-xs text-emerald-600 font-normal">
                                                    (from profile)
                                                </span>
                                            )}
                                        </label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white"
                                        >
                                            {categoryOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Location */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                            {mode === "my-startup" && profile?.location && (
                                                <span className="ml-2 text-xs text-emerald-600 font-normal">
                                                    (from profile)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            placeholder="e.g. San Francisco, CA"
                                        />
                                    </div>

                                    {/* Stage + Funding Stage */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Company Stage
                                            </label>
                                            <select
                                                value={form.companyStage}
                                                onChange={(e) => setForm({ ...form, companyStage: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white"
                                            >
                                                {stageOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Funding Stage
                                            </label>
                                            <select
                                                value={form.fundingStage}
                                                onChange={(e) => setForm({ ...form, fundingStage: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm bg-white"
                                            >
                                                {fundingStageOptions.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Raised + Seeking */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Raised ($)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.amountRaised}
                                                onChange={(e) =>
                                                    setForm({ ...form, amountRaised: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Seeking ($)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.amountSeeking}
                                                onChange={(e) =>
                                                    setForm({ ...form, amountSeeking: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Team Size + Relationships */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Team Size
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={form.teamSize}
                                                onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Partnerships
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.relationships}
                                                onChange={(e) =>
                                                    setForm({ ...form, relationships: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Checkboxes */}
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.hasVC}
                                                onChange={(e) => setForm({ ...form, hasVC: e.target.checked })}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Has VC
                                        </label>
                                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.hasAngel}
                                                onChange={(e) => setForm({ ...form, hasAngel: e.target.checked })}
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            Has Angel
                                        </label>
                                    </div>

                                    {/* Rounds + Milestones + Months */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Rounds
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.fundingRounds}
                                                onChange={(e) =>
                                                    setForm({ ...form, fundingRounds: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Milestones
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.milestones}
                                                onChange={(e) =>
                                                    setForm({ ...form, milestones: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Months
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={form.monthsSinceFounding}
                                                onChange={(e) =>
                                                    setForm({ ...form, monthsSinceFounding: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading || !form.companyName}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg text-base py-5"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="h-4 w-4 mr-2" />
                                                {mode === "my-startup" ? "Analyze My Startup" : "Analyze Startup"}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Results */}
                    <div className="lg:col-span-2 space-y-6">
                        <AnimatePresence mode="wait">
                            {loading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center py-24"
                                >
                                    <div className="relative">
                                        <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600" />
                                        <Zap className="absolute inset-0 m-auto h-8 w-8 text-emerald-600" />
                                    </div>
                                    <p className="mt-6 text-gray-600 text-lg font-medium">
                                        AI is analyzing your startup...
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">
                                        Comparing against 923 startup data points
                                    </p>
                                </motion.div>
                            )}

                            {error && !loading && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="p-6 text-center">
                                            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                                            <p className="text-red-700 font-medium">{error}</p>
                                            <Button
                                                variant="outline"
                                                className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                                                onClick={() => setError(null)}
                                            >
                                                Dismiss
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {!result && !loading && !error && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-24"
                                >
                                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <BarChart3 className="h-12 w-12 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        Ready to Analyze
                                    </h3>
                                    <p className="text-gray-500 max-w-md mx-auto">
                                        {mode === "my-startup"
                                            ? "Your profile details are pre-filled. Complete the remaining fields and click \"Analyze My Startup\"."
                                            : "Fill in the startup details on the left and click \"Analyze Startup\" to get AI-powered insights across 4 dimensions."}
                                    </p>
                                </motion.div>
                            )}

                            {result && !loading && (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="space-y-6"
                                >
                                    {/* Tab Bar */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-1.5 flex gap-1">
                                        {[
                                            { id: "stage" as const, label: "Stage", icon: <TrendingUp className="h-4 w-4" /> },
                                            { id: "risks" as const, label: "Risks", icon: <Shield className="h-4 w-4" /> },
                                            { id: "recommendations" as const, label: "Actions", icon: <Lightbulb className="h-4 w-4" /> },
                                            { id: "progress" as const, label: "Progress", icon: <BarChart3 className="h-4 w-4" /> },
                                            { id: "resources" as const, label: "Resources", icon: <Play className="h-4 w-4" /> },
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {tab.icon}
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {/* 1. Stage Model */}
                                        {activeTab === "stage" && (
                                            <motion.div
                                                key="tab-stage"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                                                    <CardHeader className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white">
                                                        <CardTitle className="flex items-center text-lg">
                                                            <TrendingUp className="h-5 w-5 mr-2" />
                                                            Startup Stage Model
                                                        </CardTitle>
                                                        <CardDescription className="text-emerald-100">
                                                            Where your startup stands in the growth lifecycle
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        {/* Stage Pipeline */}
                                                        <div className="flex items-center justify-between mb-6 overflow-x-auto">
                                                            {stages.map((stage, idx) => {
                                                                const currentIdx = getStageIndex(result.stage.currentStage)
                                                                const isActive = idx === currentIdx
                                                                const isPast = idx < currentIdx
                                                                return (
                                                                    <div key={stage} className="flex items-center flex-1 min-w-0">
                                                                        <div className="flex flex-col items-center flex-shrink-0">
                                                                            <motion.div
                                                                                initial={{ scale: 0.8 }}
                                                                                animate={{ scale: isActive ? 1.15 : 1 }}
                                                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${isActive
                                                                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-lg shadow-emerald-200"
                                                                                    : isPast
                                                                                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                                                                        : "bg-gray-100 text-gray-400 border-gray-200"
                                                                                    }`}
                                                                            >
                                                                                {isPast ? (
                                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                                ) : (
                                                                                    idx + 1
                                                                                )}
                                                                            </motion.div>
                                                                            <span
                                                                                className={`text-xs mt-1.5 text-center font-medium ${isActive
                                                                                    ? "text-emerald-700"
                                                                                    : isPast
                                                                                        ? "text-emerald-600"
                                                                                        : "text-gray-400"
                                                                                    }`}
                                                                            >
                                                                                {stage}
                                                                            </span>
                                                                        </div>
                                                                        {idx < stages.length - 1 && (
                                                                            <div
                                                                                className={`flex-1 h-0.5 mx-1 ${idx < currentIdx ? "bg-emerald-400" : "bg-gray-200"
                                                                                    }`}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        {/* Score + Details */}
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                                                                <p className="text-sm text-gray-600 mb-1">Stage Score</p>
                                                                <p className="text-3xl font-extrabold text-emerald-700">
                                                                    {result.stage.stageScore}
                                                                    <span className="text-lg text-gray-400">/100</span>
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                                                <p className="text-sm text-gray-600 mb-1">Next Stage</p>
                                                                <p className="text-lg font-bold text-gray-800">
                                                                    {result.stage.nextStage}
                                                                </p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-4">
                                                                <p className="text-sm text-gray-600 mb-1">Details</p>
                                                                <p className="text-sm text-gray-700">{result.stage.stageDetails}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {/* 2. Risk Assessment */}
                                        {activeTab === "risks" && (
                                            <motion.div
                                                key="tab-risks"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center text-lg">
                                                            <Shield className="h-5 w-5 mr-2 text-red-500" />
                                                            Risk Assessment
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Identified risks with severity levels and mitigation strategies
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {result.risks.map((risk, idx) => (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: 0.3 + idx * 0.08 }}
                                                                    className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                                                                >
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <span className="font-semibold text-gray-800 text-sm">
                                                                            {risk.category}
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-xs ${severityColor(risk.severity)}`}
                                                                        >
                                                                            {risk.severity}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                                                                    <div className="bg-emerald-50 rounded-lg p-2.5">
                                                                        <p className="text-xs font-medium text-emerald-700 mb-0.5">
                                                                            💡 Mitigation
                                                                        </p>
                                                                        <p className="text-xs text-emerald-600">{risk.mitigation}</p>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {/* 3. Recommendations */}
                                        {activeTab === "recommendations" && (
                                            <motion.div
                                                key="tab-recommendations"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center text-lg">
                                                            <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                                                            Recommendations
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Prioritized actions to accelerate growth
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            {result.recommendations.map((rec, idx) => (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: 0.4 + idx * 0.08 }}
                                                                    className="border border-gray-100 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                                                                >
                                                                    <button
                                                                        onClick={() => toggleRec(idx)}
                                                                        className="w-full flex items-center justify-between p-4 text-left"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={`text-xs ${priorityColor(rec.priority)}`}
                                                                            >
                                                                                {rec.priority}
                                                                            </Badge>
                                                                            <span className="font-semibold text-gray-800 text-sm">
                                                                                {rec.title}
                                                                            </span>
                                                                        </div>
                                                                        {expandedRecs.has(idx) ? (
                                                                            <ChevronUp className="h-4 w-4 text-gray-400" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                                                        )}
                                                                    </button>
                                                                    <AnimatePresence>
                                                                        {expandedRecs.has(idx) && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                transition={{ duration: 0.2 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                                                                                    <p className="text-sm text-gray-600 mb-3">
                                                                                        {rec.description}
                                                                                    </p>
                                                                                    <div className="space-y-1.5">
                                                                                        {rec.actionItems.map((item, i) => (
                                                                                            <div
                                                                                                key={i}
                                                                                                className="flex items-start gap-2 text-sm"
                                                                                            >
                                                                                                <Target className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                                                                <span className="text-gray-700">{item}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {/* 4. Progress Prediction */}
                                        {activeTab === "progress" && (
                                            <motion.div
                                                key="tab-progress"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center text-lg">
                                                            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                                                            Progress Prediction
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Multi-dimensional progress assessment with trajectory
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {/* Overall Score + Trajectory */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 text-center">
                                                                <p className="text-sm text-gray-600 mb-2">Overall Score</p>
                                                                <div className="relative w-28 h-28 mx-auto">
                                                                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                                                        <circle
                                                                            cx="50"
                                                                            cy="50"
                                                                            r="42"
                                                                            fill="none"
                                                                            stroke="#e5e7eb"
                                                                            strokeWidth="8"
                                                                        />
                                                                        <circle
                                                                            cx="50"
                                                                            cy="50"
                                                                            r="42"
                                                                            fill="none"
                                                                            stroke="url(#progressGradient)"
                                                                            strokeWidth="8"
                                                                            strokeLinecap="round"
                                                                            strokeDasharray={`${result.progress.overallScore * 2.64} 264`}
                                                                        />
                                                                        <defs>
                                                                            <linearGradient
                                                                                id="progressGradient"
                                                                                x1="0%"
                                                                                y1="0%"
                                                                                x2="100%"
                                                                                y2="0%"
                                                                            >
                                                                                <stop offset="0%" stopColor="#059669" />
                                                                                <stop offset="100%" stopColor="#0d9488" />
                                                                            </linearGradient>
                                                                        </defs>
                                                                    </svg>
                                                                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold text-gray-800">
                                                                        {result.progress.overallScore}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-xl p-5 flex flex-col justify-center">
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <span className="text-2xl">
                                                                        {trajectoryIcon(result.progress.trajectory)}
                                                                    </span>
                                                                    <span className="font-bold text-gray-800 capitalize text-lg">
                                                                        {result.progress.trajectory}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600">
                                                                    {result.progress.benchmarkComparison}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Dimension Bars */}
                                                        <div className="space-y-4">
                                                            {(
                                                                Object.entries(result.progress.dimensions) as [string, number][]
                                                            ).map(([key, value]) => (
                                                                <div key={key}>
                                                                    <div className="flex justify-between mb-1.5">
                                                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                                                            {key}
                                                                        </span>
                                                                        <span className="text-sm font-bold text-gray-800">
                                                                            {value}/100
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${value}%` }}
                                                                            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                                                                            className={`h-full rounded-full ${value >= 70
                                                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                                                : value >= 40
                                                                                    ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                                                                                    : "bg-gradient-to-r from-red-400 to-rose-500"
                                                                                }`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                        {/* 5. Resources */}
                                        {activeTab === "resources" && (
                                            <motion.div
                                                key="tab-resources"
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center text-lg">
                                                            <Play className="h-5 w-5 mr-2 text-red-500" />
                                                            Recommended Resources
                                                        </CardTitle>
                                                        <CardDescription>
                                                            Curated YouTube videos and resources tailored to your startup
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {(result.resources || []).map((resource, idx) => (
                                                                <motion.a
                                                                    key={idx}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.08 }}
                                                                    className="group border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-red-200 transition-all bg-white block"
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                                                                            <Play className="h-5 w-5 text-red-500" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <h4 className="font-semibold text-sm text-gray-800 group-hover:text-red-600 transition-colors truncate">
                                                                                    {resource.title}
                                                                                </h4>
                                                                                <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 group-hover:text-red-500" />
                                                                            </div>
                                                                            <p className="text-xs text-gray-600 mb-2">{resource.description}</p>
                                                                            <div className="bg-emerald-50 rounded-md px-2 py-1 inline-block">
                                                                                <p className="text-xs text-emerald-700">
                                                                                    🎯 {resource.relevance}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.a>
                                                            ))}
                                                        </div>
                                                        {(!result.resources || result.resources.length === 0) && (
                                                            <div className="text-center py-8 text-gray-400">
                                                                <Play className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                                                <p>No resources generated for this analysis. Try running the analysis again.</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        )}

                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
