"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import { Bot, UserIcon, MessageSquare, Clock, ArrowLeft, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string | Date
}

interface Chat {
  conversation_id: string
  user_id: string
  messages: string
  title: string | null
  updated_at: string
}

export default function ChatHistoryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Message[] | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [totalMessages, setTotalMessages] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch chats
  const fetchChats = useCallback(async (currentUser?: User) => {
    const u = currentUser || user
    if (!u) return
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("user_id", u.id)
        .order("updated_at", { ascending: false })
      if (!error) {
        // Normalize the data to ensure consistent column names
        const chatData = ((data as unknown[]) || []).map((chat) => {
          const c = chat as Record<string, unknown>
          return {
            conversation_id: c.conversation_id || c.id,
            user_id: c.user_id,
            messages: c.messages,
            title: c.title,
            updated_at: c.updated_at
          }
        }) as Chat[]
        setChats(chatData)
        // Calculate total messages
        const totalMsgs = chatData.reduce((sum, chat) => sum + getMessageCount(chat.messages), 0)
        setTotalMessages(totalMsgs)
      } else {
        console.error("Error fetching chats:", error)
      }
    } catch (err) {
      console.error("Unexpected error fetching chats:", err)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  // Fetch user and chats on mount
  useEffect(() => {
    const fetchUserAndChats = async () => {
      try {
        const res = await supabase.auth.getUser()
        if (!res.data?.user) {
          router.push("/auth/signin")
          return
        }
        setUser(res.data.user)
        await fetchChats(res.data.user)
      } catch (err) {
        console.error(err)
        setIsLoading(false)
      }
    }
    fetchUserAndChats()
  }, [router, fetchChats, supabase.auth])

  // Restore continued chat from localStorage
  useEffect(() => {
    try {
      const continued = localStorage.getItem("continuedChat")
      const continuedId = localStorage.getItem("continuedChatId")
      if (continued && continuedId) {
        const parsed = JSON.parse(continued)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedChat(parsed)
          setConversationId(continuedId)
        }
        localStorage.removeItem("continuedChat")
        localStorage.removeItem("continuedChatId")
      }
    } catch (err) {
      console.warn(err)
    }
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [selectedChat])

  // Auto-select chat from URL param
  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.conversation_id === chatId)
      if (chat) {
        try {
          const msgs = JSON.parse(chat.messages)
          setSelectedChat(msgs)
          setConversationId(chatId)
        } catch (err) {
          console.warn('Failed to parse chat messages', err)
        }
      } else {
        console.warn('Chat not found for ID:', chatId)
      }
    }
  }, [chats, searchParams])





  // Delete chat
  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!user?.id) {
      console.error("User not authenticated")
      setIsDeleting(null)
      return
    }

    console.log("Attempting to delete chat:", { chatId, userId: user.id })

    // First check if the chat exists and belongs to the user
    // Try both possible column names for the primary key
    const fetchQuery = supabase
      .from("chats")
      .select("user_id")
      .eq("user_id", user.id)

    // Try conversation_id first, then id
    let existingChat = null
    let fetchError = null

    try {
      const result = await fetchQuery.eq("conversation_id", chatId).single()
      if (result.error && result.error.code !== 'PGRST116') {
        // Try with id column
        const result2 = await fetchQuery.eq("id", chatId).single()
        existingChat = result2.data
        fetchError = result2.error
      } else {
        existingChat = result.data
        fetchError = result.error
      }
    } catch (err) {
      console.error("Error in fetch query:", err)
      fetchError = { message: "Query failed" }
    }

    if (fetchError) {
      console.error("Error fetching chat for deletion:", fetchError)
      alert("Chat not found or you don't have permission to delete it.")
      setIsDeleting(null)
      return
    }

    if (!existingChat) {
      console.error("Chat not found")
      alert("Chat not found.")
      setIsDeleting(null)
      return
    }

    console.log("Chat found, proceeding with deletion")
    setIsDeleting(chatId)
    try {
      // Try to delete using conversation_id first, then id
      const deleteQuery = supabase
        .from("chats")
        .delete()
        .eq("user_id", user.id)

      let error = null
      const result = await deleteQuery.eq("conversation_id", chatId)
      if (result.error && result.error.code !== 'PGRST116') {
        // Try with id column
        const result2 = await deleteQuery.eq("id", chatId)
        error = result2.error
      } else {
        error = result.error
      }

      if (error) {
        console.error("Error deleting chat:", error)
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        alert(`Failed to delete chat: ${error.message || 'Unknown error'}`)
      } else {
        console.log("Chat deleted successfully")
        const deletedChat = chats.find(chat => chat.conversation_id === chatId)
        const updatedChats = chats.filter(chat => chat.conversation_id !== chatId)
        setChats(updatedChats)
        // Update total messages
        if (deletedChat) {
          const deletedMessages = getMessageCount(deletedChat.messages)
          setTotalMessages(prev => prev - deletedMessages)
        }
        // Clear selected chat if it was the deleted one
        if (conversationId === chatId) {
          setSelectedChat(null)
          setConversationId(null)
        }
      }
    } catch (err) {
      console.error("Unexpected error deleting chat:", err)
      alert("An unexpected error occurred while deleting the chat.")
    } finally {
      setIsDeleting(null)
    }
  }

  // Helpers
  const getMessageCount = (messagesJson: string) => {
    try {
      return JSON.parse(messagesJson)?.length || 0
    } catch {
      return 0
    }
  }

  const getLastMessagePreview = (messagesJson: string) => {
    try {
      const messages = JSON.parse(messagesJson)
      if (!Array.isArray(messages) || messages.length === 0) return "No messages"
      const lastMessage = messages[messages.length - 1]
      return lastMessage.content.slice(0, 100) + (lastMessage.content.length > 100 ? "..." : "")
    } catch {
      return "Unable to load messages"
    }
  }

  const getChatTitle = (messagesJson: string) => {
    try {
      const messages = JSON.parse(messagesJson)
      if (!Array.isArray(messages) || messages.length === 0) return "Untitled Chat"
      const firstUserMessage = messages.find(m => m.role === "user")
      if (firstUserMessage) {
        return firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
      }
      return "Untitled Chat"
    } catch {
      return "Untitled Chat"
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-400"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white transition-all">
      {/* Header */}
      <header className="glass-effect border-b border-green-300 sticky top-0 z-50 backdrop-blur-md bg-white/80 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center text-green-800 hover:text-green-600 transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" /> Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-extrabold text-green-900 tracking-tight">Chat History</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => fetchChats()} className="text-green-800 border-green-600 hover:bg-green-100 hover:border-green-600">
              <RefreshCw className="h-5 w-5 mr-2" /> Refresh
            </Button>
            <Badge variant="secondary" className="bg-green-600 text-white border-green-600 font-semibold">
              Total Chats: {chats.length}
            </Badge>
            <Badge variant="outline" className="text-green-700 border-green-600 font-semibold">
              Total Messages: {totalMessages}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {!selectedChat ? (
          <section className="space-y-8">
            {chats.length === 0 ? (
              <Card className="glass-effect border-green-500 shadow-xl hover:shadow-green-400 transition-shadow duration-500 rounded-xl">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                  <MessageSquare className="h-20 w-20 text-green-400 opacity-70" />
                  <p className="text-xl text-green-800 opacity-80">No conversations found</p>
                  <Button asChild variant="secondary" size="lg" className="px-8 py-4 bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard/ai-assistant" className="text-white font-semibold">
                      Start Your First Chat
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {chats.map((chat, index) => (
                  <Card
                    key={chat.conversation_id || `chat-${index}`}
                    onClick={() => {
                      try {
                        const msgs = JSON.parse(chat.messages)
                        setSelectedChat(msgs)
                        setConversationId(chat.conversation_id)
                      } catch {}
                    }}
                    className="cursor-pointer overflow-hidden rounded-xl border-2 border-white-600 bg-white shadow-lg transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <CardHeader className="pb-2 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg text-green-900 truncate">{getChatTitle(chat.messages)}</CardTitle>
                        <CardDescription className="flex items-center space-x-3 mt-1 text-green-700 opacity-90">
                          <Clock className="h-4 w-4" />
                          <time dateTime={chat.updated_at}>{new Date(chat.updated_at).toLocaleDateString()}</time>
                          <Badge variant="outline" className="text-xs px-2 py-1 border-green-600 text-green-700 font-mono">
                            {getMessageCount(chat.messages)} messages
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/ai-assistant?chatId=${chat.conversation_id}`)
                          }}
                          aria-label="Continue Chat"
                          className="text-green-600 hover:text-green-800"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteChat(chat.conversation_id, e)}
                          disabled={isDeleting === chat.conversation_id}
                          aria-label="Delete Chat"
                          className="text-green-600 hover:text-red-600"
                        >
                          {isDeleting === chat.conversation_id ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="text-green-800 max-h-28 overflow-hidden text-ellipsis">
                      {getLastMessagePreview(chat.messages)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-4xl font-bold text-green-900">Conversation Details</h2>
              <div className="flex space-x-4 items-center">
                <Badge variant="outline" className="text-green-700 text-sm font-mono">
                  {conversationId ? `ID: ${conversationId.slice(0, 8)}...` : "No ID"}
                </Badge>
                <Badge variant="secondary" className="bg-green-600 text-white px-3 py-1 rounded-lg font-mono">
                  {selectedChat.length} messages
                </Badge>
              </div>
            </div>

            <Card className="glass-effect border-green-600 shadow-2xl rounded-xl">
              <CardContent className="p-6">
                <ScrollArea className="h-[60vh]" ref={scrollRef}>
                  <div className="space-y-8">
                    {selectedChat.map((msg, index) => (
                      <div
                        key={msg.id || `msg-${index}`} // UNIQUE key
                        className={`flex items-start space-x-6 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                      >
                        <Avatar
                          className={`h-12 w-12 shadow-lg ${msg.role === "assistant" ? "pulse-glow" : ""}`}
                        >
                          <AvatarFallback
                            className={`${msg.role === "assistant" ? "bg-green-600 text-white" : "bg-gray-300 text-gray-700"}`}
                          >
                            {msg.role === "assistant" ? <Bot className="h-6 w-6" /> : <UserIcon className="h-6 w-6" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[80%] rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:shadow-4xl ${msg.role === "user" ? "bg-green-600 text-white" : "bg-white border border-green-200 text-green-900"}`}>
                          <div className="text-base break-words text-justify">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          <p className={`text-xs mt-4 ${msg.role === "user" ? "text-white/70 font-semibold" : "text-green-700"}`}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex gap-8 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedChat(null)
                  setConversationId(null)
                  router.push('/dashboard/chat-history')
                }}
                className="flex items-center space-x-3 border-green-500 text-green-800 hover:bg-green-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Chat List</span>
              </Button>

              <Button
                asChild
                disabled={!selectedChat || selectedChat.length === 0 || !conversationId}
                className="flex items-center space-x-3 bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 py-3 text-lg shadow-lg"
              >
                <Link href={`/dashboard/ai-assistant?chatId=${conversationId}`}>
                  <MessageSquare className="h-5 w-5" />
                  <span>Continue Chat</span>
                </Link>
              </Button>

            </div>
          </section>
        )}
      </main>
    </div>
  )
}
