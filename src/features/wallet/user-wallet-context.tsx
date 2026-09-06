import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/auth-context'
import type { UserWallet, UserWalletTransaction } from '@/types/database'

interface UserWalletContextType {
  wallet: UserWallet | null
  transactions: UserWalletTransaction[]
  loading: boolean
  isModalOpen: boolean
  activeTab: 'overview' | 'topup' | 'withdraw'
  openWalletModal: (tab?: 'overview' | 'topup' | 'withdraw') => void
  closeWalletModal: () => void
  setActiveTab: (tab: 'overview' | 'topup' | 'withdraw') => void
  topUp: (amount: number, method: 'mtn_momo' | 'orange_money', phone: string) => Promise<boolean>
  withdraw: (amount: number, method: 'mtn_momo' | 'orange_money', phone: string) => Promise<{ success: boolean; error?: string }>
  payWithWallet: (amount: number, title: string, associationName?: string) => Promise<{ success: boolean; error?: string }>
  receivePayout: (amount: number, title: string, associationName?: string) => Promise<boolean>
  refreshWallet: () => Promise<void>
}

const UserWalletContext = createContext<UserWalletContextType | undefined>(undefined)

export function UserWalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<UserWallet | null>(null)
  const [transactions, setTransactions] = useState<UserWalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'topup' | 'withdraw'>('overview')

  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWallet(null)
      setTransactions([])
      setLoading(false)
      return
    }

    try {
      // 1. Fetch or create user wallet
      const { data: existingWallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingWallet) {
        setWallet(existingWallet as UserWallet)
      } else {
        const newWallet: Partial<UserWallet> = {
          user_id: user.id,
          cached_balance: 100000, // starting demo balance
          total_contributed: 150000,
          total_received: 300000,
          currency: 'XAF',
        }
        const { data: created } = await supabase
          .from('user_wallets')
          .insert(newWallet)
          .select()
          .maybeSingle()
        if (created) setWallet(created as UserWallet)
      }

      // 2. Fetch user wallet transactions
      const { data: txs } = await supabase
        .from('user_wallet_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (txs) {
        setTransactions(txs as UserWalletTransaction[])
      }
    } catch (err) {
      console.error('Error loading user wallet:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshWallet()
  }, [refreshWallet])

  const openWalletModal = (tab: 'overview' | 'topup' | 'withdraw' = 'overview') => {
    setActiveTab(tab)
    setIsModalOpen(true)
  }

  const closeWalletModal = () => {
    setIsModalOpen(false)
  }

  const topUp = async (amount: number, method: 'mtn_momo' | 'orange_money', phone: string): Promise<boolean> => {
    if (!user || !wallet || amount <= 0) return false

    const newBalance = (wallet.cached_balance || 0) + amount
    const methodLabel = method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'

    try {
      await supabase
        .from('user_wallets')
        .update({ cached_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      await supabase.from('user_wallet_transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount,
        title: `Recharge via ${methodLabel} (${phone})`,
        payment_method: method,
        status: 'success',
        created_at: new Date().toISOString(),
      })

      await refreshWallet()
      return true
    } catch (err) {
      console.error('Top-up error:', err)
      return false
    }
  }

  const withdraw = async (amount: number, method: 'mtn_momo' | 'orange_money', phone: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !wallet) return { success: false, error: 'Utilisateur non connecté' }
    if (amount <= 0) return { success: false, error: 'Montant invalide' }
    if ((wallet.cached_balance || 0) < amount) {
      return { success: false, error: 'Solde insuffisant dans votre portefeuille indicatif' }
    }

    const newBalance = wallet.cached_balance - amount
    const methodLabel = method === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'

    try {
      await supabase
        .from('user_wallets')
        .update({ cached_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      await supabase.from('user_wallet_transactions').insert({
        user_id: user.id,
        type: 'withdrawal',
        amount,
        title: `Retrait vers ${methodLabel} (${phone})`,
        payment_method: method,
        status: 'success',
        created_at: new Date().toISOString(),
      })

      await refreshWallet()
      return { success: true }
    } catch (err) {
      console.error('Withdrawal error:', err)
      return { success: false, error: 'Erreur lors du retrait' }
    }
  }

  const payWithWallet = async (amount: number, title: string, associationName?: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !wallet) return { success: false, error: 'Utilisateur non connecté' }
    if ((wallet.cached_balance || 0) < amount) {
      return { success: false, error: 'Solde insuffisant dans votre portefeuille indicatif' }
    }

    const newBalance = wallet.cached_balance - amount
    const newTotalContributed = (wallet.total_contributed || 0) + amount

    try {
      await supabase
        .from('user_wallets')
        .update({
          cached_balance: newBalance,
          total_contributed: newTotalContributed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      await supabase.from('user_wallet_transactions').insert({
        user_id: user.id,
        type: 'cotisation',
        amount,
        title,
        association_name: associationName || null,
        payment_method: 'wallet',
        status: 'success',
        created_at: new Date().toISOString(),
      })

      await refreshWallet()
      return { success: true }
    } catch (err) {
      console.error('Payment error:', err)
      return { success: false, error: 'Erreur lors du paiement' }
    }
  }

  const receivePayout = async (amount: number, title: string, associationName?: string): Promise<boolean> => {
    if (!user || !wallet) return false

    const newBalance = (wallet.cached_balance || 0) + amount
    const newTotalReceived = (wallet.total_received || 0) + amount

    try {
      await supabase
        .from('user_wallets')
        .update({
          cached_balance: newBalance,
          total_received: newTotalReceived,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id)

      await supabase.from('user_wallet_transactions').insert({
        user_id: user.id,
        type: 'tontine_payout',
        amount,
        title,
        association_name: associationName || null,
        payment_method: 'wallet',
        status: 'success',
        created_at: new Date().toISOString(),
      })

      await refreshWallet()
      return true
    } catch (err) {
      console.error('Payout receive error:', err)
      return false
    }
  }

  return (
    <UserWalletContext.Provider
      value={{
        wallet,
        transactions,
        loading,
        isModalOpen,
        activeTab,
        openWalletModal,
        closeWalletModal,
        setActiveTab,
        topUp,
        withdraw,
        payWithWallet,
        receivePayout,
        refreshWallet,
      }}
    >
      {children}
    </UserWalletContext.Provider>
  )
}

export function useUserWallet() {
  const ctx = useContext(UserWalletContext)
  if (!ctx) throw new Error('useUserWallet must be used within UserWalletProvider')
  return ctx
}
