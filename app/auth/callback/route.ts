import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // If code exchange failed, redirect to an error page or sign-in
    return NextResponse.redirect(`${origin}/auth/signin?error=Could+not+authenticate`)
}
