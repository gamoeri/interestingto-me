'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signup, user, loading, error: authError } = useAuth()
  const router = useRouter()
  
  // If user is already logged in, redirect to notes
  useEffect(() => {
    if (user) {
      console.log("User already authenticated, redirecting to notes")
      router.push('/notes')
    }
  }, [user, router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    console.log("Attempting to sign up with:", email, displayName)
    
    try {
      // Perform signup
      await signup(email, password, displayName)
      console.log("Signup successful, redirecting to /notes")
      
      // Add a small delay to ensure auth state is processed
      setTimeout(() => {
        // Use window.location for a full page navigation
        // This helps avoid router issues with auth state
        window.location.href = '/notes'
      }, 500)
      
    } catch (error) {
      console.error('Signup error in component:', error)
      setIsSubmitting(false)
    }
  }

  // Don't render the form if already authenticated or loading
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4">Checking authentication...</p>
      </div>
    )
  }
  
  // Don't render if already logged in
  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4">Already authenticated, redirecting...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
      {authError && <p className="text-red-500 mb-4">{authError}</p>}
      <form onSubmit={handleSignUp} className="w-full max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </button>
        <p className="text-center">
          Already have an account? <Link href="/signin" className="text-blue-500">Sign In</Link>
        </p>
      </form>
    </div>
  )
}