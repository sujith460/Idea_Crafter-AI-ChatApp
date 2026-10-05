"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const router = useRouter()

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
        if (error) setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long")
            setIsLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password,
            })

            if (updateError) throw updateError

            setIsSuccess(true)

            // Sign out and redirect to sign-in after a short delay
            await supabase.auth.signOut()
            setTimeout(() => {
                router.push("/auth/signin")
            }, 3000)
        } catch (error: unknown) {
            if (error instanceof Error) {
                if (error.message.includes("same password")) {
                    setError("New password must be different from your current password.")
                } else {
                    setError(error.message)
                }
            } else {
                setError("An unexpected error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">StartupMentor</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
                    <p className="text-muted-foreground">Choose a strong password for your account</p>
                </div>

                {isSuccess ? (
                    <Card>
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle>Password updated!</CardTitle>
                            <CardDescription>
                                Your password has been successfully reset. You&apos;ll be redirected to the sign-in page shortly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button asChild className="w-full">
                                <Link href="/auth/signin">Go to Sign In</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Enter your new password below</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        placeholder="At least 6 characters"
                                        required
                                        disabled={isLoading}
                                        className="border border-gray-200"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="border border-gray-200"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-gray-200 p-3 rounded-md">{error}</div>
                                )}

                                <Button type="submit" className="w-full border border-gray-200" disabled={isLoading}>
                                    {isLoading ? "Updating Password..." : "Update Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
