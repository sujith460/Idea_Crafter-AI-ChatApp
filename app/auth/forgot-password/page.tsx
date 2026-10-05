"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (!email) {
                throw new Error("Please enter your email address")
            }

            const supabase = createClient()
            const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
            })

            if (resetError) throw resetError

            setIsSubmitted(true)
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message)
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
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to sign in</span>
                    </Link>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">StartupMentor</span>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
                    <p className="text-muted-foreground">We&apos;ll send you a link to reset it</p>
                </div>

                {isSubmitted ? (
                    <Card>
                        <CardHeader className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle>Check your email</CardTitle>
                            <CardDescription>
                                We&apos;ve sent a password reset link to <strong>{email}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Click the link in the email to reset your password. You may need to check your spam folder.
                            </p>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full bg-transparent"
                                    onClick={() => {
                                        setIsSubmitted(false)
                                        setEmail("")
                                    }}
                                >
                                    Try a different email
                                </Button>
                                <Button asChild className="w-full">
                                    <Link href="/auth/signin">Back to Sign In</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Forgot Password</CardTitle>
                            <CardDescription>Enter the email address associated with your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value)
                                            if (error) setError(null)
                                        }}
                                        placeholder="you@example.com"
                                        required
                                        disabled={isLoading}
                                        className="border border-gray-200"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-600 bg-red-50 border border-gray-200 p-3 rounded-md">{error}</div>
                                )}

                                <Button type="submit" className="w-full border border-gray-200" disabled={isLoading}>
                                    {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Remember your password?{" "}
                                    <Link href="/auth/signin" className="text-primary hover:underline">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
