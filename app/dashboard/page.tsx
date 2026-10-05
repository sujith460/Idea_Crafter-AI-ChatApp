"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  UserIcon,
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Users,
  TrendingUp,
  Edit,
  AlertCircle,
  Bot,
  Star,
  Calendar,
  Target,
  Zap,
  ArrowRight,
  MessageSquare,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

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
  created_at: string
  updated_at: string
}

interface Chat {
  conversation_id: string
  id?: string
  user_id: string
  messages: string
  title: string | null
  updated_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [totalChats, setTotalChats] = useState(0)
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function handleAuthCallback() {
      // Handle email confirmation callback
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (accessToken && refreshToken && type === 'signup') {
        console.log("[v0] Processing email confirmation...")
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error("[v0] Error setting session:", error)
          setError("Failed to confirm email. Please try again.")
          return
        }

        // Clear the hash from URL
        window.history.replaceState({}, document.title, window.location.pathname)

        // Show success message
        setError(null) // Clear any existing errors
        setEmailConfirmed(true)
      }
    }

    async function getProfile() {
      try {
        console.log("[v0] Getting user session...")
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("[v0] No user found, redirecting to signin")
          window.location.href = "/auth/signin"
          return
        }

        console.log("[v0] User found:", user.email)
        setUser(user)

        console.log("[v0] Fetching profile...")
        const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.log("[v0] Profile fetch error:", error.message)

          if (error.message.includes("table") || error.message.includes("schema")) {
            setError("Database setup in progress. Please refresh the page in a moment.")
          } else if (error.code === "PGRST116") {
            console.log("[v0] No profile found, user needs to create one")
            setNeedsProfileCreation(true)
          } else {
            setError("Error loading profile. Please try again.")
          }
        } else {
          console.log("[v0] Profile loaded successfully")
          setProfile(profileData)
          calculateProfileCompletion(profileData)

          // Fetch recent chats
          const { data: chatsData, error: chatsError } = await supabase
            .from("chats")
            .select("*")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(3)

          if (!chatsError) {
            // Normalize the data to ensure consistent column names
            const normalizedChats = ((chatsData as unknown[]) || []).map((chat) => {
              const c = chat as Record<string, unknown>
              return {
                conversation_id: (c.conversation_id || c.id) as string,
                id: c.id as string | undefined,
                user_id: c.user_id as string,
                messages: c.messages as string,
                title: c.title as string | null,
                updated_at: c.updated_at as string
              }
            }) as Chat[]
            setRecentChats(normalizedChats)
          } else {
            console.error("Error fetching recent chats:", chatsError)
          }

          // Fetch total chats count
          const { count, error: countError } = await supabase
            .from('chats')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

          if (countError) {
            console.error("Error fetching chat count:", countError)
          }
          setTotalChats(count || 0)
        }
      } catch (error: unknown) {
        console.error("[v0] Unexpected error:", error)
        setError("An unexpected error occurred. Please refresh the page.")
      } finally {
        setLoading(false)
      }
    }

    // Handle auth callback first
    handleAuthCallback()

    getProfile()
  }, [supabase])

  const createProfile = async () => {
    if (!user) return

    try {
      console.log("[v0] Creating profile for user:", user.email)
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          user_type: user.user_metadata?.user_type || "entrepreneur",
          company: user.user_metadata?.company || "",
          industry: user.user_metadata?.industry || "",
        })
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating profile:", error)
        setError("Failed to create profile. Please try again.")
      } else {
        console.log("[v0] Profile created successfully")
        setProfile(data)
        setNeedsProfileCreation(false)
        calculateProfileCompletion(data)
      }
    } catch (error) {
      console.error("[v0] Unexpected error creating profile:", error)
      setError("Failed to create profile. Please try again.")
    }
  }

  const calculateProfileCompletion = (profile: Profile) => {
    const fields = [
      profile.full_name,
      profile.company,
      profile.industry,
      profile.location,
      profile.bio,
      profile.website || profile.linkedin,
    ]
    const completedFields = fields.filter((field) => field && field.trim() !== "").length
    const completion = Math.round((completedFields / fields.length) * 100)
    setProfileCompletion(completion)
  }

  const getMessageCount = (messagesJson: string) => {
    try {
      return JSON.parse(messagesJson)?.length || 0
    } catch {
      return 0
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              Refresh Page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (needsProfileCreation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Welcome to StartupMentor! 🚀</CardTitle>
            <CardDescription className="text-center">
              Let&apos;s set up your profile to get started. This will only take a moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
              <p className="mb-2">
                <strong>Email:</strong> {user.email}
              </p>
              {user.user_metadata?.full_name && (
                <p className="mb-2">
                  <strong>Name:</strong> {user.user_metadata.full_name}
                </p>
              )}
              {user.user_metadata?.user_type && (
                <p>
                  <strong>Type:</strong> {user.user_metadata.user_type}
                </p>
              )}
            </div>
            <Button onClick={createProfile} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600">
              Create My Profile
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/dashboard/profile">Complete Profile Setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Loading Profile...</CardTitle>
            <CardDescription>Setting up your dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
              >
                StartupMentor
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild className="hover:bg-emerald-50">
                <Link href="/dashboard/chat-history">
                  <Users className="h-4 w-4 mr-2" />
                  Chat History
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hover:bg-emerald-50">
                <Link href="/dashboard/ai-assistant">
                  <Bot className="h-4 w-4 mr-2" />
                  AI Assistant
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hover:bg-emerald-50">
                <Link href="/dashboard/startup-analyzer">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Startup Analyzer
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Email Confirmation Success Message */}
      {emailConfirmed && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Email confirmed successfully!</h3>
                <p className="text-sm text-green-700">Welcome to StartupMentor. Your account is now active.</p>
              </div>
            </div>
            <button
              onClick={() => setEmailConfirmed(false)}
              className="text-green-600 hover:text-green-800 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="relative">
                  <Avatar className="h-28 w-28 mx-auto mb-4 ring-4 ring-emerald-100">
                    <AvatarImage
                      src={`/abstract-geometric-shapes.png?height=112&width=112&query=${profile.full_name || "professional"}`}
                    />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-bold">
                      {profile.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <Badge
                      variant={profile.user_type === "entrepreneur" ? "default" : "secondary"}
                      className={
                        profile.user_type === "entrepreneur"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0"
                      }
                    >
                      {profile.user_type === "entrepreneur" ? "Entrepreneur" : "Investor"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mt-4">
                  {profile.full_name || "Complete Your Profile"}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {profile.company && `${profile.company} • `}
                  {profile.industry && profile.industry.charAt(0).toUpperCase() + profile.industry.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
                    <span className="text-sm font-bold text-emerald-600">{profileCompletion}%</span>
                  </div>
                  <Progress value={profileCompletion} className="h-3 bg-white" />
                  {profileCompletion < 100 && (
                    <p className="text-xs text-gray-600 mt-2 flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      Complete your profile to get better matches
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {profile.company && (
                    <div className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg p-3">
                      <Building2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{profile.company}</span>
                    </div>
                  )}
                  {profile.industry && (
                    <div className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg p-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="capitalize font-medium text-gray-900">{profile.industry.replace("-", " ")}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg p-3">
                      <MapPin className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg p-3">
                      <Globe className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  {profile.linkedin && (
                    <div className="flex items-center space-x-3 text-sm bg-gray-50 rounded-lg p-3">
                      <Linkedin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        LinkedIn
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                  >
                    <Link href="/dashboard/profile">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                  >
                    <Link href="/dashboard/profile/view">
                      <UserIcon className="h-4 w-4 mr-2" />
                      View Public Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white animate-gradient-move">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center">
                  <Zap className="h-6 w-6 mr-2" />
                  Welcome back, {profile.full_name?.split(" ")[0] || "there"}! 👋
                </CardTitle>
                <CardDescription className="text-emerald-100 text-lg">
                  {profile.user_type === "entrepreneur"
                    ? "Ready to review your chat history and continue your conversations?"
                    : "Review your chat history and continue your investment discussions."}
                </CardDescription>
              </CardHeader>
            </Card>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-[1.02]">
                <Link href="/dashboard/chat-history">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-8 w-8 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors">
                      Chat History
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      View and continue your previous conversations with investors or startups.
                    </CardDescription>
                    <div className="flex items-center justify-center mt-4 text-emerald-600 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium mr-2">Get Started</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-[1.02]">
                <Link href="/dashboard/ai-assistant">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Bot className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">AI Assistant</CardTitle>
                    <CardDescription className="text-gray-600">
                      Get personalized advice for{" "}
                      {profile.user_type === "entrepreneur" ? "pitching and fundraising" : "investment strategies"}
                    </CardDescription>
                    <div className="flex items-center justify-center mt-4 text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium mr-2">Chat Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:scale-[1.02] md:col-span-2">
                <Link href="/dashboard/startup-analyzer">
                  <CardHeader className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-8 w-8 text-amber-600" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-amber-600 transition-colors">Startup Analyzer</CardTitle>
                    <CardDescription className="text-gray-600">
                      AI-powered stage prediction, risk assessment, recommendations, and progress tracking for your startup.
                    </CardDescription>
                    <div className="flex items-center justify-center mt-4 text-amber-600 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium mr-2">Analyze Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{totalChats}</div>
                  <div className="text-sm text-gray-600">Total Conversations</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{profileCompletion}%</div>
                  <div className="text-sm text-gray-600">Profile Score</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Stay updated with your latest interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentChats.length > 0 ? (
                  <div className="space-y-4">
                    {recentChats.map((chat, index) => (
                      <div key={chat.conversation_id || `recent-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{chat.title || "Untitled Chat"}</h4>
                          <p className="text-sm text-gray-500">
                            {getMessageCount(chat.messages)} messages • {new Date(chat.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="ml-4">
                          <Link href={`/dashboard/chat-history?chat=${chat.conversation_id || chat.id}`}>View</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity yet</h3>
                    <p className="text-gray-500 mb-6">Start connecting with others to see updates here.</p>
                    <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600">
                      <Link href="/dashboard/ai-assistant">
                        <Bot className="h-4 w-4 mr-2" />
                        Start Chatting
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
