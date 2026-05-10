import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const providerError = searchParams.get('error')
  const providerErrorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/'

  if (providerError) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth')
    loginUrl.searchParams.set('provider_error', providerError)
    if (providerErrorDescription) {
      loginUrl.searchParams.set('provider_error_description', providerErrorDescription)
    }
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'auth')
    loginUrl.searchParams.set('auth_code_exchange', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
