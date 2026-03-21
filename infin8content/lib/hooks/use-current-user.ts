"use client"

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  org_id: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user's organization from users table
          const { data: userData } = await supabase
            .from('users')
            .select('org_id')
            .eq('auth_user_id', user.id)
            .single()
          
          if (userData && 'org_id' in userData && userData.org_id && typeof userData.org_id === 'string') {
            setUser({
              id: user.id,
              email: user.email!,
              org_id: userData.org_id
            })
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  return { user, loading }
}
