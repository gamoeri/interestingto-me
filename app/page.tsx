'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, redirect to notes
        router.push('/notes')
      } else {
        // No user is signed in, redirect to signin
        router.push('/signin')
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  )
}