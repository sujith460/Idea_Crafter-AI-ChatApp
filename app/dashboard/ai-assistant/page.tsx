"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Send,
  Bot,
  UserIcon,
  TrendingUp,
  Target,
  DollarSign,
  FileText,
  BarChart3,
  ArrowLeft,
  Sparkles,
  Zap,
  Copy,
  Trash2,
  Download,
  Link as LinkIcon,
  Loader2,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createBrowserClient(supabaseUrl, supabaseKey)

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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ConversationStarter {
  icon: React.ReactNode
  title: string
  description: string
  prompt: string
}

interface ChatSummary {
  conversation_id: string
  title: string | null
  updated_at: string
  messages?: string | null
}

export default function AIAssistant() {
  const searchParams = useSearchParams()
  const urlChatId = searchParams.get("chatId")

  // core states
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)

  // input & UI states
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [stopTyping, setStopTyping] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // assistant options
  const [persona, setPersona] = useState<string>("Strategist")
  const [tone, setTone] = useState<string>("Balanced")
  const [temperature, setTemperature] = useState<number>(0.2)

  // refs
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // UX: keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
      // if (e.key === "Escape") {
      //   handleStopTyping()
      // }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Conversation starters

  // Helper: create a friendly welcome
  const getWelcomeMessage = (userType: "entrepreneur" | "investor", fullName: string | null) => {
    const name = fullName?.split(" ")[0] || "there"
    return userType === "entrepreneur"
      ? `Hi ${name}! 👋 I'm your AI business advisor, here to help with pitch prep, fundraising, market research, and growth. What would you like to work on today?`
      : `Hello ${name}! 👋 I'm your AI investment advisor — I can help with deal evaluation, market insights, portfolio strategy, and more. What can I do for you today?`
  }

  // Load profile & initial state
  useEffect(() => {
    async function loadProfileAndSession() {
      setIsInitializing(true)
      try {
        console.log("Initializing user session...")
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error("Auth error:", authError)
          return window.location.href = "/auth/signin"
        }

        if (!currentUser) {
          console.log("No user found, redirecting to signin")
          return window.location.href = "/auth/signin"
        }

        console.log("User authenticated:", currentUser.id)
        setUser(currentUser)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
        }

        if (profileData) {
          console.log("Profile loaded:", profileData.user_type)
          setProfile(profileData as Profile)
        } else {
          console.warn("No profile found for user")
        }

        // If there's no chat in URL and no messages loaded yet, show welcome
        if (!urlChatId && profileData && messages.length === 0) {
          console.log("Setting welcome message")
          setMessages([{
            id: uuidv4(),
            role: "assistant",
            content: getWelcomeMessage(profileData.user_type, profileData.full_name),
            timestamp: new Date(),
          }])
        }

      } catch (err) {
        console.error("Error initializing profile:", err)
      } finally {
        setIsInitializing(false)
      }
    }
    loadProfileAndSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlChatId])

  // Load all chats for sidebar whenever user available
  const loadChats = useCallback(async () => {
    if (!user?.id) {
      console.log("User not authenticated, skipping chat load")
      return
    }

    console.log("Loading chats for user:", user.id)

    // First test basic connectivity
    try {
      const { error: testError } = await supabase.from("chats").select("count").limit(1)
      if (testError) {
        console.error("Supabase connectivity test failed:", testError)
      } else {
        console.log("Supabase connectivity OK")
      }
    } catch (testErr) {
      console.error("Supabase test error:", testErr)
    }

    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) {
        console.error("Error loading chats:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })

        // Check if it's an RLS or table issue
        if (error.code === 'PGRST116') {
          console.warn("No chats table found or RLS policies not applied. Please run the database scripts.")
          alert("Database not set up properly. Please run the SQL scripts in the scripts/ folder in your Supabase dashboard.\n\nRequired scripts:\n1. scripts/005_create_chats_table.sql\n2. scripts/007_chats_rls_policies.sql")
        } else if (error.message?.includes('relation "public.chats" does not exist')) {
          console.warn("Chats table doesn't exist. Please run scripts/005_create_chats_table.sql")
          alert("Chats table not found. Please run scripts/005_create_chats_table.sql in your Supabase SQL editor.")
        } else if (error.message?.includes('column chats.conversation_id does not exist')) {
          console.warn("Chats table exists but missing conversation_id column. Please run migration script.")
          alert("Database column mismatch. Please run scripts/migrate-chats-table.sql in your Supabase SQL editor to fix the column names.")
        } else if (error.message?.includes('permission denied') || error.message?.includes('insufficient_privilege')) {
          console.warn("RLS policies blocking access. Please run scripts/007_chats_rls_policies.sql")
          alert("Database permissions not set up. Please run scripts/007_chats_rls_policies.sql in your Supabase SQL editor.")
        } else if (error.message?.includes('JWT') || error.message?.includes('auth')) {
          console.warn("Authentication issue with Supabase")
          alert("Authentication error. Please check your Supabase configuration and try logging out and back in.")
        } else {
          alert(`Database error: ${error.message || 'Unknown error'}. Please check the console for details.`)
        }

        return
      }

      console.log("Raw chat data received:", data?.length || 0, "chats")

      // Normalize the data to ensure consistent column names
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedChats = ((data as any[]) || []).map(chat => ({
        conversation_id: chat.conversation_id || chat.id,
        title: chat.title,
        updated_at: chat.updated_at,
        messages: chat.messages
      })) as ChatSummary[]

      setChats(normalizedChats)
      console.log("Loaded and normalized chats:", normalizedChats.length)
    } catch (err) {
      console.error("Unexpected error loading chats:", err)
    }
  }, [user])

  useEffect(() => {
    if (user) loadChats()
  }, [user, loadChats])

  // Load conversation by chatId from URL when present (only if not loaded from localStorage)
  useEffect(() => {
    if (!urlChatId || !user?.id) return

    // Don't load from URL if we already have messages (from localStorage or other sources)
    if (messages.length > 0) return

    console.log("Loading conversation from URL:", urlChatId)
    const loadConversation = async () => {
      try {
        // Try to load using conversation_id first, then id
        const query = supabase
          .from("chats")
          .select("messages")
          .eq("user_id", user.id)

        let data = null
        let error = null

        const result = await query.eq("conversation_id", urlChatId).single()
        if (result.error && result.error.code !== 'PGRST116') {
          // Try with id column
          const result2 = await query.eq("id", urlChatId).single()
          data = result2.data
          error = result2.error
        } else {
          data = result.data
          error = result.error
        }

        if (error) {
          console.error("Error loading conversation from URL:", error)
          // Don't show alert for URL loading errors, just log them
          return
        }
        if (data?.messages) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parsed: any[] = JSON.parse(data.messages)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const loaded: Message[] = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          console.log("Loaded conversation from URL:", loaded.length, "messages")
          setMessages(loaded)
          setConversationId(urlChatId)
        }
      } catch (err) {
        console.error("Error parsing conversation from URL:", err)
      }
    }
    loadConversation()
  }, [urlChatId, user?.id, messages.length]) // Added messages.length to prevent running when messages exist

  // read-from-local-storage "continue chat" fallback - only run once on mount
  useEffect(() => {
    const continued = localStorage.getItem("continuedChat")
    const continuedId = localStorage.getItem("continuedChatId")
    if (continued && continuedId) {
      console.log("Loading continued chat from localStorage")
      try {
        const parsed = JSON.parse(continued)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const messagesWithDates = parsed.map((msg: any) => ({ ...msg, timestamp: new Date(msg.timestamp) }))
          setMessages(messagesWithDates)
          setConversationId(continuedId)
          // Clear localStorage after loading
          localStorage.removeItem("continuedChat")
          localStorage.removeItem("continuedChatId")
        }
      } catch (err) {
        console.warn("Error restoring continued chat:", err)
        // Clear corrupted data
        localStorage.removeItem("continuedChat")
        localStorage.removeItem("continuedChatId")
      }
    }
  }, []) // Empty dependency array ensures this only runs once on mount

  // scroll to bottom on messages or typing change
  useEffect(() => {
    if (scrollRef.current) {
      try {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      } catch {
        /* ignore */
      }
    }
  }, [messages.length])

  // generate AI response via your API
  const generateAIResponse = async (history: Message[], userType: "entrepreneur" | "investor" | undefined) => {
    if (!user) return "User not logged in."
    try {
      // Build startup context from the user's profile
      const startupContext = profile ? {
        companyName: profile.company,
        industry: profile.industry,
        location: profile.location,
        bio: profile.bio,
        website: profile.website,
        linkedin: profile.linkedin,
        companyStage: profile.company_stage,
        fundingStage: profile.funding_stage,
        amountRaised: profile.amount_raised,
        amountSeeking: profile.amount_seeking,
        teamSize: profile.team_size,
        partnerships: profile.relationships,
        hasVC: profile.has_vc,
        hasAngel: profile.has_angel,
        fundingRounds: profile.funding_rounds,
        milestones: profile.milestones,
        monthsSinceFounding: profile.months_since_founding,
        founderName: profile.full_name,
      } : undefined

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          userType,
          userId: user.id,
          conversationId,
          options: { persona, tone, temperature },
          startupContext,
        }),
      })
      if (!res.ok) {
        console.error("API error", res.statusText)
        return "Something went wrong while generating the response."
      }
      const data = await res.json()
      // if server returned a conversation id, capture it
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
        const url = new URL(window.location.href)
        url.searchParams.set("chatId", data.conversationId)
        window.history.replaceState(null, "", url.toString())
      }
      return data.text || "No response received."
    } catch (err) {
      console.error(err)
      return "Something went wrong while generating the response."
    }
  }

  // Save chat (create or update)
  const saveChat = async (messagesToSave: Message[]) => {
    if (!user || messagesToSave.length === 0) return
    const hasUserMessage = messagesToSave.some(m => m.role === "user")
    if (!hasUserMessage) return // avoid saving pure welcome
    setIsSaving(true)
    const firstUserMessage = messagesToSave.find(m => m.role === "user")?.content
    const title = firstUserMessage
      ? firstUserMessage.slice(0, 50) + (firstUserMessage.length > 50 ? "..." : "")
      : "Untitled Chat"

    try {
      if (conversationId) {
        // Try to update using conversation_id first, then id
        const updateQuery = supabase
          .from("chats")
          .update({
            messages: JSON.stringify(messagesToSave),
            updated_at: new Date().toISOString(),
            title,
          })
          .eq("user_id", user.id)

        let error = null
        const result = await updateQuery.eq("conversation_id", conversationId)
        if (result.error && result.error.code !== 'PGRST116') {
          // Try with id column
          const result2 = await updateQuery.eq("id", conversationId)
          error = result2.error
        } else {
          error = result.error
        }

        if (error) console.error("Error updating chat:", error)
      } else {
        const { data, error } = await supabase
          .from("chats")
          .insert([{
            user_id: user.id,
            title,
            messages: JSON.stringify(messagesToSave),
            updated_at: new Date().toISOString(),
          }])
          .select()
          .single()
        if (error) {
          console.error("Error creating chat:", error)
        } else if (data) {
          // Use conversation_id if available, otherwise id
          const chatId = data.conversation_id || data.id
          if (chatId) {
            setConversationId(chatId)
            const url = new URL(window.location.href)
            url.searchParams.set("chatId", chatId)
            window.history.replaceState(null, "", url.toString())
          }
        }
      }
      // refresh sidebar chat list
      await loadChats()
    } catch (err) {
      console.error("Unexpected error saving chat:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Send message flow (user -> AI)
  const handleSendMessage = async (messageContent?: string) => {
    if (!user || !profile) return
    const content = messageContent ?? inputMessage.trim()
    if (!content) return

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage("")
    inputRef.current?.blur()

    setIsLoading(true)
    setIsTyping(true)
    setStopTyping(false)

    // get ai text
    const aiText = await generateAIResponse(updatedMessages, profile.user_type)

    // insert a placeholder assistant message that will be typed-out
    const aiMessageId = uuidv4()
    const aiResponsePlaceholder: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, aiResponsePlaceholder])

    // type out the AI text quickly, but allow stopTyping
    let index = 0
    typingIntervalRef.current = setInterval(() => {
      if (stopTyping) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        setIsLoading(false)
        setIsTyping(false)
        return
      }
      index++
      setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, content: aiText.slice(0, index) } : msg))
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      if (index >= aiText.length) {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
        setIsLoading(false)
        setIsTyping(false)
        // finalize and save
        const finalMessages: Message[] = [...updatedMessages, { ...aiResponsePlaceholder, content: aiText }]
        saveChat(finalMessages)
      }
    }, 3)
  }

  // const handleStopTyping = () => {
  //   setStopTyping(true)
  //   setIsLoading(false)
  //   setIsTyping(false)
  //   if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
  // }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // New chat: save current if needed, reset to welcome
  const handleNewChat = async () => {
    if (!user || !profile) return
    // save current if it has meaningful content
    if (messages.length > 1 && conversationId) {
      await saveChat(messages)
    }
    setIsInitializing(true)
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: getWelcomeMessage(profile.user_type, profile.full_name),
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      setConversationId(null)
      const url = new URL(window.location.href)
      url.searchParams.delete("chatId")
      window.history.replaceState(null, "", url.toString())
      setIsInitializing(false)
    }, 350)
  }

  // Sidebar: load a chat by id
  const handleLoadChatFromSidebar = async (id: string) => {
    console.log("Loading chat from sidebar:", id)
    if (!user?.id) {
      console.error("User not authenticated")
      alert("You must be logged in to load chats.")
      return
    }

    try {
      // Clear any existing localStorage data to prevent conflicts
      localStorage.removeItem("continuedChat")
      localStorage.removeItem("continuedChatId")

      console.log("Querying database for chat:", id, "user:", user.id)

      // Try to load using conversation_id first, then id
      const query = supabase
        .from("chats")
        .select("messages")
        .eq("user_id", user.id)

      let data = null
      let error = null

      const result = await query.eq("conversation_id", id).single()
      console.log("First query result:", { data: result.data, error: result.error })

      if (result.error && result.error.code !== 'PGRST116') {
        console.log("Trying with id column...")
        // Try with id column
        const result2 = await query.eq("id", id).single()
        console.log("Second query result:", { data: result2.data, error: result2.error })
        data = result2.data
        error = result2.error
      } else {
        data = result.data
        error = result.error
      }

      if (error) {
        console.error("Error loading chat:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })
        alert(`Failed to load chat: ${error.message || 'Unknown error'}`)
        return
      }

      if (data?.messages) {
        console.log("Raw messages data:", data.messages)
        const parsed = JSON.parse(data.messages)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedMessages = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        console.log("Loaded messages:", parsedMessages.length)
        setMessages(parsedMessages)
        setConversationId(id)
        const url = new URL(window.location.href)
        url.searchParams.set("chatId", id)
        window.history.replaceState(null, "", url.toString())
      } else {
        console.warn("No messages found for chat:", id)
        alert("No messages found for this chat.")
      }
    } catch (err) {
      console.error("Unexpected error loading chat:", err)
      alert("An unexpected error occurred while loading the chat.")
    }
  }

  // Delete a chat
  const handleDeleteChat = async (id: string) => {
    if (!user?.id) {
      console.error("User not authenticated")
      alert("You must be logged in to delete chats.")
      return
    }

    if (!confirm("Delete this chat permanently?")) return

    console.log("Attempting to delete chat:", id, "for user:", user.id)

    try {
      // Try to delete using conversation_id first, then id
      const deleteQuery = supabase
        .from("chats")
        .delete()
        .eq("user_id", user.id)

      let error = null
      const result = await deleteQuery.eq("conversation_id", id)
      console.log("Delete query result:", { error: result.error, count: result.count })

      if (result.error && result.error.code !== 'PGRST116') {
        console.log("Trying delete with id column...")
        // Try with id column
        const result2 = await deleteQuery.eq("id", id)
        console.log("Delete query result 2:", { error: result2.error, count: result2.count })
        error = result2.error
      } else {
        error = result.error
      }

      if (error) {
        console.error("Error deleting chat:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error
        })

        // Provide specific error messages
        if (error.code === 'PGRST116') {
          alert("Chat not found or database not set up properly.")
        } else if (error.message?.includes('relation "public.chats" does not exist')) {
          alert("Database table not found. Please run the setup scripts.")
        } else if (error.message?.includes('permission denied') || error.message?.includes('insufficient_privilege')) {
          alert("Permission denied. Please check RLS policies.")
        } else {
          alert(`Failed to delete chat: ${error.message || 'Unknown error'}`)
        }
      } else {
        console.log("Chat deleted successfully")
        // remove from local list and if current chat, reset
        setChats(prev => prev.filter(c => c.conversation_id !== id))
        if (conversationId === id) {
          handleNewChat()
        }
      }
    } catch (err) {
      console.error("Unexpected error deleting chat:", err)
      alert("An unexpected error occurred while deleting the chat.")
    }
  }

  // Message actions
  const handleCopyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // small visual feedback could be added here
    } catch (err) {
      console.error("Could not copy message:", err)
    }
  }

  const handleDeleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id)
    setMessages(updated)
    saveChat(updated)
  }

  // Export / copy whole conversation
  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(messages, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${conversationId ?? "chat"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyConversationMarkdown = async () => {
    const md = messages.map(m => m.role === "user" ? `**You:** ${m.content}` : `**AI:** ${m.content}`).join("\n\n")
    try {
      await navigator.clipboard.writeText(md)
    } catch (err) {
      console.error("Copy failed:", err)
    }
  }

  // quick follow-ups shown below last assistant message
  const quickFollowUps = useMemo(() => [
    "Summarize key takeaways.",
    "Convert to a 2-minute investor pitch.",
    "List 5 risks and mitigations.",
    "Give a concise one-liner."
  ], [])

  if (isInitializing || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-muted-foreground animate-pulse">Initializing AI Assistant...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-card to-muted">
      <header className="glass-effect border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
              <Link href="/dashboard" className="flex items-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <Badge variant="outline" className="ml-2 text-sm">
              <Zap className="h-4 w-4 mr-1" />
              {profile.user_type === "entrepreneur" ? "Entrepreneur Mode" : "Investor Mode"}
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Signed in as</div>
              <div className="text-sm font-medium">{profile.full_name ?? profile.email}</div>
            </div>
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : profile.email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="w-full h-screen px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Chat List and Settings */}
        <aside className="lg:col-span-3 flex flex-col space-y-0 overflow-hidden">
          <Card className="glass-effect border-border/50 shadow-lg overflow-hidden flex-1 flex flex-col">
            <CardHeader className="flex items-center justify-between pb-0">
              <CardTitle className="text-sm">Conversations</CardTitle>
              <div className="flex items-left space-x-2">
                <Button onClick={() => loadChats()} variant="ghost" size="sm">Refresh</Button>
                <Button onClick={handleNewChat} variant="outline" size="sm">New</Button>
                <Button onClick={() => { setMessages([]); setConversationId(null) }} variant="ghost" size="sm">Clear</Button>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col space-y-2 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
                {chats.length === 0 && (
                  <div className="text-xs text-muted-foreground p-4">No saved chats yet — start a conversation or use a starter.</div>
                )}
                {chats.map(chat => {
                  // small preview snippet for UI
                  let preview = "No messages"
                  try {
                    const parsed = chat.messages ? JSON.parse(chat.messages) : []
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (Array.isArray(parsed) && parsed.length > 0) preview = parsed.find((m: any) => m.role === "user")?.content?.slice(0, 80) ?? parsed[0]?.content?.slice(0, 80) ?? "Conversation"
                  } catch { preview = "Conversation" }
                  return (
                    <div key={chat.conversation_id} className="flex items-center justify-between p-2 rounded-md hover:bg-primary/5 cursor-pointer" onClick={() => handleLoadChatFromSidebar(chat.conversation_id)}>
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{chat.title ?? "Untitled chat"}</div>
                          <div className="text-xs text-muted-foreground mt-1 max-w-[180px] truncate">{preview}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="text-xs text-muted-foreground">{new Date(chat.updated_at).toLocaleDateString()}</div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.origin + window.location.pathname + `?chatId=${chat.conversation_id}`) }}>
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.conversation_id) }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50 overflow-hidden flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm">Assistant Settings & Tips</CardTitle>
              <CardDescription className="text-xs">Customize responses and get better answers</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent hover:scrollbar-thumb-primary/40">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Persona</div>
                      <div className="text-xs text-muted-foreground">Pick a role for tailored responses</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["Strategist", "Critic", "Founder", "Investor"].map(p => (
                      <Button key={p} variant={persona === p ? "default" : "outline"} size="sm" onClick={() => setPersona(p)}>
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Tone</div>
                  <div className="text-xs text-muted-foreground mb-2">How the assistant should phrase answers</div>
                  <div className="flex gap-2">
                    {["Balanced", "Formal", "Casual", "Concise"].map(t => (
                      <Button key={t} variant={tone === t ? "default" : "outline"} size="sm" onClick={() => setTone(t)}>{t}</Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium">Creativity</div>
                  <div className="text-xs text-muted-foreground">Lower = more factual, Higher = more creative</div>
                  <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} className="w-full mt-2" />
                  <div className="text-xs text-muted-foreground mt-1">Temperature: {temperature.toFixed(1)}</div>
                </div>

                <div className="border-t pt-4">
                  <div className="text-sm font-medium mb-2">Tips for Better Answers</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Provide context (company, stage, metrics)</li>
                    <li>• Ask for specific formats (e.g., &quot;5-bullet summary&quot;)</li>
                    <li>• Use follow-ups to refine answers</li>
                  </ul>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button onClick={() => { handleCopyConversationMarkdown() }} variant="outline" size="sm" className="flex-1">Copy MD</Button>
                  <Button onClick={handleExportJson} size="sm" className="flex-1">Export</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: Chat */}
        <main className="lg:col-span-9 flex flex-col h-[700px] overflow-hidden">
          <Card className="h-full flex flex-col glass-effect border-border/50 shadow-2xl">
            <CardHeader className="pb-4 border-b border-border/50 flex justify-between items-center sticky top-0 bg-card/95 backdrop-blur-sm z-10">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Bot className="h-5 w-5 text-primary mr-3" />
                  AI {profile.user_type === "entrepreneur" ? "Business Advisor" : "Investment Advisor"}
                  {isSaving && <Loader2 className="h-4 w-4 ml-3 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  Get personalized advice for your {profile.user_type === "entrepreneur" ? "startup journey" : "investment choices"} — Persona: <strong>{persona}</strong> • Tone: <strong>{tone}</strong>
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleCopyConversationMarkdown} title="Copy conversation as Markdown">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleExportJson} title="Export as JSON">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNewChat}>New Chat</Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-6 relative overflow-y-auto scrollbar scrollbar-thumb-primary/40 scrollbar-track-primary/20 hover:scrollbar-thumb-primary/60">
              <div ref={scrollRef} className="flex-1 space-y-6 pb-32">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`group relative flex items-start ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    <div
                      className={`flex items-start space-x-4 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                    >
                      <Avatar className={`h-10 w-10 shadow-lg ${message.role === "assistant" ? "pulse-glow" : ""}`}>
                        <AvatarFallback
                          className={`${message.role === "assistant"
                              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                          {message.role === "assistant" ? <Bot className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={`max-w-[80%] rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${message.role === "user"
                            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                            : "bg-card border border-border/50 text-card-foreground"
                          }`}
                      >
                        <div className="text-sm break-words whitespace-pre-wrap">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p
                            className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                            <Button onClick={() => handleCopyMessage(message.content)} variant="ghost" size="sm" className="p-1">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDeleteMessage(message.id)} variant="ghost" size="sm" className="p-1">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-10 w-10 pulse-glow">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                        {/* <Button onClick={handleStopTyping} variant="ghost" size="sm" className="ml-3">
              Stop
            </Button> */}
                      </div>
                    </div>
                  </div>
                )}

                {messages.length > 0 &&
                  messages[messages.length - 1].role === "assistant" &&
                  !isTyping && (
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-lg">
                        <div className="text-sm text-muted-foreground mb-3">Quick follow-ups:</div>
                        <div className="flex flex-wrap gap-2">
                          {quickFollowUps.map((followUp, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendMessage(followUp)}
                              className="text-xs"
                            >
                              {followUp}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>


            {/* Input area fixed to screen, perfectly aligned with assistant section width */}
            <div className="fixed bottom-0 left-[25%] right-[2%] bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 rounded-t-lg z-50">
              <div className="flex items-center space-x-3">
                <Input
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ref={inputRef as any}
                  placeholder={`Ask about ${profile.user_type === "entrepreneur" ? "fundraising, pitching, or business strategy" : "deal evaluation, market trends, or portfolio management"}...`}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 pr-12 h-12 bg-background border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl shadow-sm"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className="h-12 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Send className="h-4 w-4" />
                </Button>
                {/* {isLoading && (
                  // <Button onClick={handleStopTyping} variant="destructive" className="h-12 px-4 ml-2">
                  //   Stop
                  // </Button>
                )} */}
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  )
}
