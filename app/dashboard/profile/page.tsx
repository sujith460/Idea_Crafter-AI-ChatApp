"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import type { User } from "@supabase/supabase-js"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, UserIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
  created_at: string
  updated_at: string
}

const industries = [
  "technology",
  "healthcare",
  "fintech",
  "e-commerce",
  "education",
  "real-estate",
  "manufacturing",
  "energy",
  "food-beverage",
  "entertainment",
  "other",
]

export default function ProfileEdit() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    company: "",
    industry: "",
    location: "",
    bio: "",
    website: "",
    linkedin: "",
    company_stage: "",
    funding_stage: "",
    amount_raised: "",
    amount_seeking: "",
    team_size: "1",
    relationships: "",
    has_vc: false,
    has_angel: false,
    funding_rounds: "",
    milestones: "",
    months_since_founding: "",
  })
  const router = useRouter()

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
          router.push("/auth/signin")
          return
        }

        setUser(user)

        const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else {
          setProfile(profileData)
          setFormData({
            full_name: profileData.full_name || "",
            company: profileData.company || "",
            industry: profileData.industry || "",
            location: profileData.location || "",
            bio: profileData.bio || "",
            website: profileData.website || "",
            linkedin: profileData.linkedin || "",
            company_stage: profileData.company_stage || "",
            funding_stage: profileData.funding_stage || "",
            amount_raised: profileData.amount_raised || "",
            amount_seeking: profileData.amount_seeking || "",
            team_size: profileData.team_size || "1",
            relationships: profileData.relationships || "",
            has_vc: profileData.has_vc || false,
            has_angel: profileData.has_angel || false,
            funding_rounds: profileData.funding_rounds || "",
            milestones: profileData.milestones || "",
            months_since_founding: profileData.months_since_founding || "",
          })
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    getProfile()
  }, [router, supabase])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Try saving all fields (including startup details)
      const { error } = await supabase
        .from("profiles")
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        // If it fails (e.g. new columns don't exist yet), fall back to saving only base profile fields
        console.warn("Full save failed, trying base fields only:", error.message)
        const { error: fallbackError } = await supabase
          .from("profiles")
          .update({
            full_name: formData.full_name,
            company: formData.company,
            industry: formData.industry,
            location: formData.location,
            bio: formData.bio,
            website: formData.website,
            linkedin: formData.linkedin,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)

        if (fallbackError) {
          console.error("Error updating profile:", fallbackError)
          alert(`Error updating profile: ${fallbackError.message}`)
        } else {
          alert("Profile saved! Note: To save startup details, run the SQL migration in Supabase first.")
          router.push("/dashboard")
        }
      } else {
        alert("Profile updated successfully!")
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error updating profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center text-emerald-600 hover:text-emerald-700">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={profile.user_type === "entrepreneur" ? "default" : "secondary"}>
                {profile.user_type === "entrepreneur" ? "Entrepreneur" : "Investor"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Profile Preview</CardTitle>
                <CardDescription>How others will see your profile</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-lg bg-emerald-100 text-emerald-600">
                    {formData.full_name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{formData.full_name || "Your Name"}</h3>
                  <p className="text-gray-600 text-sm">{formData.company || "Your Company"}</p>
                  {formData.industry && <p className="text-gray-500 text-xs capitalize mt-1">{formData.industry}</p>}
                </div>
                {formData.bio && <p className="text-sm text-gray-600 text-left">{formData.bio}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Edit Profile
                </CardTitle>
                <CardDescription>Update your profile information </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange("full_name", e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">
                        {profile.user_type === "entrepreneur" ? "Company/Startup" : "Company/Fund"} *
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange("company", e.target.value)}
                        placeholder={
                          profile.user_type === "entrepreneur" ? "Your startup name" : "Your company/fund name"
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry.charAt(0).toUpperCase() + industry.slice(1).replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Professional Information</h3>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder={
                        profile.user_type === "entrepreneur"
                          ? "Tell investors about your startup, vision, and what makes you unique..."
                          : "Tell entrepreneurs about your investment focus, experience, and what you look for..."
                      }
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => handleInputChange("linkedin", e.target.value)}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>
                </div>

                {/* Startup Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Startup Details</h3>
                  <p className="text-sm text-gray-500">These details will auto-fill in the Startup Analyzer.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_stage">Company Stage</Label>
                      <Select value={formData.company_stage} onValueChange={(value) => handleInputChange("company_stage", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="idea">Idea / Concept</SelectItem>
                          <SelectItem value="prototype">Prototype</SelectItem>
                          <SelectItem value="mvp">MVP</SelectItem>
                          <SelectItem value="early_revenue">Early Revenue</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="scale">Scale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="funding_stage">Funding Stage</Label>
                      <Select value={formData.funding_stage} onValueChange={(value) => handleInputChange("funding_stage", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series_a">Series A</SelectItem>
                          <SelectItem value="series_b">Series B</SelectItem>
                          <SelectItem value="series_c">Series C+</SelectItem>
                          <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount_raised">Amount Raised ($)</Label>
                      <Input
                        id="amount_raised"
                        type="number"
                        min="0"
                        value={formData.amount_raised}
                        onChange={(e) => handleInputChange("amount_raised", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount_seeking">Amount Seeking ($)</Label>
                      <Input
                        id="amount_seeking"
                        type="number"
                        min="0"
                        value={formData.amount_seeking}
                        onChange={(e) => handleInputChange("amount_seeking", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="team_size">Team Size</Label>
                      <Input
                        id="team_size"
                        type="number"
                        min="1"
                        value={formData.team_size}
                        onChange={(e) => handleInputChange("team_size", e.target.value)}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="relationships">Partnerships</Label>
                      <Input
                        id="relationships"
                        type="number"
                        min="0"
                        value={formData.relationships}
                        onChange={(e) => handleInputChange("relationships", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="months_since_founding">Months Since Founding</Label>
                      <Input
                        id="months_since_founding"
                        type="number"
                        min="0"
                        value={formData.months_since_founding}
                        onChange={(e) => handleInputChange("months_since_founding", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="funding_rounds">Funding Rounds</Label>
                      <Input
                        id="funding_rounds"
                        type="number"
                        min="0"
                        value={formData.funding_rounds}
                        onChange={(e) => handleInputChange("funding_rounds", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="milestones">Milestones</Label>
                      <Input
                        id="milestones"
                        type="number"
                        min="0"
                        value={formData.milestones}
                        onChange={(e) => handleInputChange("milestones", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_vc}
                        onChange={(e) => handleInputChange("has_vc", e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Has VC Funding
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.has_angel}
                        onChange={(e) => handleInputChange("has_angel", e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Has Angel Funding
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
