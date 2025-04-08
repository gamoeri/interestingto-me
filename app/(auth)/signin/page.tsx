// app/(auth)/signin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Get all auth context values including isStable
  const { 
    user, 
    userProfile,
    loading, 
    isStable,
    error: authError,
    login 
  } = useAuth()

  // Protected redirect logic (now checks isStable)
  useEffect(() => {
    if (user && isStable && !loading) {
      console.log('🔀 Auth stable - redirecting to /notes')
      router.push('/notes')
    }
  }, [user, loading, isStable, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(email, password)
      // Redirect handled by useEffect
    } catch (err) {
      // Use both local and context-level errors
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
      console.error('SignIn error:', err)
    }
  }

  // Show loader until auth state is stable
  if (loading || !isStable) {
    return (
      <div className="signin-container">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    )
  }

  return (
    <div className="signin-container">
      <h1>Sign In</h1>
      
      {/* Show both local form errors and context auth errors */}
      {(error || authError) && (
        <div className="error-message">
          {error || authError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="username"
          className="signin-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          autoComplete="current-password"
          className="signin-input"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="signin-button"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}