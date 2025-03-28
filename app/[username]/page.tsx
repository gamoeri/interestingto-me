'use client'

import { useParams } from 'next/navigation'
import UserProfileView from '@/components/UserProfileView'

export default function UsernamePage() {
  const params = useParams()
  const username = params.username
  
  return <UserProfileView username={username} />
}