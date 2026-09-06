import { type ReactNode, createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/auth-context'
import type { Association, BureauRole } from '@/types/database'

interface AssociationContextType {
  currentAssociation: Association | null
  associations: Association[]
  userRole: BureauRole | null
  loading: boolean
  setCurrentAssociation: (assoc: Association | null) => void
  refreshAssociations: () => Promise<void>
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined)

export function AssociationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [associations, setAssociations] = useState<Association[]>([])
  const [currentAssociation, setCurrentAssociation] = useState<Association | null>(null)
  const [userRole, setUserRole] = useState<BureauRole | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAssociations = useCallback(async () => {
    if (!user) {
      setAssociations([])
      setCurrentAssociation(null)
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('associations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const assocs = (data || []) as Association[]
      setAssociations(assocs)
      localStorage.setItem('assomboa_offline_associations', JSON.stringify(assocs))
      setCurrentAssociation((prev) => {
        if (prev && assocs.find((a) => a.id === prev.id)) return prev
        return assocs[0] || null
      })
    } catch (err) {
      console.warn('Offline or error loading associations, using cached backup:', err)
      const cached = localStorage.getItem('assomboa_offline_associations')
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as Association[]
          setAssociations(parsed)
          setCurrentAssociation((prev) => {
            if (prev && parsed.find((a) => a.id === prev.id)) return prev
            return parsed[0] || null
          })
        } catch (e) {
          console.error('Error parsing cached associations', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAssociations()
  }, [loadAssociations])

  useEffect(() => {
    async function loadRole() {
      if (!user || !currentAssociation) {
        setUserRole(null)
        return
      }
      const cacheKey = `assomboa_offline_role_${currentAssociation.id}`
      try {
        const { data, error } = await supabase
          .from('bureau_assignments')
          .select('role')
          .eq('association_id', currentAssociation.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error

        const role = (data as { role: BureauRole } | null)?.role || null
        setUserRole(role)
        if (role) {
          localStorage.setItem(cacheKey, role)
        } else {
          localStorage.removeItem(cacheKey)
        }
      } catch (err) {
        console.warn('Offline or error reading role, using cached backup:', err)
        const cachedRole = localStorage.getItem(cacheKey) as BureauRole | null
        setUserRole(cachedRole)
      }
    }
    loadRole()
  }, [user, currentAssociation])

  return (
    <AssociationContext.Provider value={{
      currentAssociation,
      associations,
      userRole,
      loading,
      setCurrentAssociation,
      refreshAssociations: loadAssociations,
    }}>
      {children}
    </AssociationContext.Provider>
  )
}

export function useAssociation() {
  const ctx = useContext(AssociationContext)
  if (!ctx) throw new Error('useAssociation must be used within AssociationProvider')
  return ctx
}
