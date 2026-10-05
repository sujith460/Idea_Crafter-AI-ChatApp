"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Building2, MapPin, Globe, Linkedin, Edit, TrendingUp, Calendar } from "lucide-react"
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
  avatar?: string | null
}

export default function ProfileView() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    async function getProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/signin"
          return
        }

        setUser(user)

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else {
          setProfile(profileData)
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load profile information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full hover:bg-emerald-600 transition-colors">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center text-emerald-600 hover:text-emerald-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 transition-colors">
              <Link href="/dashboard/profile" className="flex items-center gap-1">
                <Edit className="h-4 w-4" /> Edit Profile
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-emerald-200 to-teal-200 text-emerald-700">
                    {profile.full_name?.split(" ").map((n) => n[0]).join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-semibold">{profile.full_name || "Name Not Set"}</CardTitle>
                <CardDescription className="space-y-2 mt-2">
                  <Badge
                    variant={profile.user_type === "entrepreneur" ? "default" : "secondary"}
                    className="text-sm rounded-full px-3 py-1"
                  >
                    {profile.user_type === "entrepreneur" ? "Entrepreneur" : "Investor"}
                  </Badge>
                  {profile.company && (
                    <div className="flex items-center justify-center space-x-2 text-sm mt-2">
                      <Building2 className="h-4 w-4" />
                      <span>{profile.company}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {profile.industry && (
                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="capitalize">{profile.industry.replace("-", " ")}</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 hover:underline transition-colors flex items-center gap-1"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  {profile.linkedin && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-800 hover:underline transition-colors flex items-center gap-1"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold border-b-2 border-emerald-300 pb-1">
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No bio added yet.</p>
                    <Link href="/dashboard/profile" className="text-emerald-600 hover:text-emerald-800 hover:underline text-sm">
                      Add a bio to tell others about yourself
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold border-b-2 border-emerald-300 pb-1">
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">
                      {profile.user_type === "entrepreneur" ? "Company/Startup" : "Company/Fund"}
                    </h4>
                    <p className="text-lg">{profile.company || "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">Industry</h4>
                    <p className="text-lg capitalize">{profile.industry?.replace("-", " ") || "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">Location</h4>
                    <p className="text-lg">{profile.location || "Not specified"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-2">User Type</h4>
                    <Badge variant={profile.user_type === "entrepreneur" ? "default" : "secondary"}>
                      {profile.user_type === "entrepreneur" ? "Entrepreneur" : "Investor"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completion Prompt */}
            {(!profile.bio || !profile.location || !profile.website) && (
              <Card className="border-emerald-300 bg-emerald-50 hover:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Complete Your Profile</CardTitle>
                  <CardDescription className="text-emerald-700">
                    Add more information to attract better connections and opportunities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-emerald-700">
                  {!profile.bio && <p className="flex items-center gap-2">📝 Add a bio to tell others about yourself</p>}
                  {!profile.location && <p className="flex items-center gap-2">📍 Add your location</p>}
                  {!profile.website && !profile.linkedin && (
                    <p className="flex items-center gap-2">🌐 Add your website or LinkedIn profile</p>
                  )}
                  <Button asChild className="mt-4 w-full hover:bg-emerald-600 transition-colors">
                    <Link href="/dashboard/profile">Complete Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
