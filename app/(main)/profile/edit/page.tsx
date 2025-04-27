'use client'

import { useRouter } from 'next/navigation'
import ProfileEdit from '@/components/ProfileEdit'

export default function ProfileEditPage() {
  const router = useRouter()
  
  const handleClose = () => {
    router.push('/profile')
  }
  
  return (
    <ProfileEdit onClose={handleClose} />
  )
}