import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { useUserWallet } from '@/features/wallet/user-wallet-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, ProgressBar, Spinner, EmptyState } from '@/components/ui'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { supabase } from '@/lib/supabase'
import { formatXAF, getProgressPercentage, daysUntil } from '@/lib/utils'
import type { MainLevee, TontineRound, TontineContribution } from '@/types/database'
import {
  HandCoins,
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  HeartHandshake,
  AlertCircle,
  Smartphone,
  CreditCard,
} from 'lucide-react'

export function TontinesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation } = useAssociation()
  const { wallet, payWithWallet, openWalletModal } = useUserWallet()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab: 'tontine' (Tours de tontine & cotisations) | 'main-levee' (Main levée & cagnottes)
  const [activeTab, setActiveTab] = useState<'tontine' | 'main-levee'>(
    searchParams.get('tab') === 'main-levee' ? 'main-levee' : 'tontine'
  )

  // Tontine rounds data
  const [rounds, setRounds] = useState<TontineRound[]>([])
  const [myContributions, setMyContributions] = useState<TontineContribution[]>([])
  const [loadingTontine, setLoadingTontine] = useState(true)

  // Payment modal for Tontine round
  const [payingRound, setPayingRound] = useState<TontineRound | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mtn_momo' | 'orange_money'>('wallet')
  const [momoPhone, setMomoPhone] = useState('+237 ')
  const [paying, setPaying] = useState(false)
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Main Levée data & modal
  const [levees, setLevees] = useState<MainLevee[]>([])
  const [loadingLevees, setLoadingLevees] = useState(true)
  const [showCreateLevee, setShowCreateLevee] = useState(false)
  const [showContributeLevee, setShowContributeLevee] = useState<MainLevee | null>(null)
  const [creatingLevee, setCreatingLevee] = useState(false)
  const [contributingLevee, setContributingLevee] = useState(false)
  const [leveeContribAmount, setLeveeContribAmount] = useState('')
  const [leveePaymentMethod, setLeveePaymentMethod] = useState<'wallet' | 'mtn_momo' | 'orange_money'>('wallet')

  // Create Levee Form
  const [leveeTitle, setLeveeTitle] = useState('')
  const [leveeBeneficiary, setLeveeBeneficiary] = useState('')
  const [leveeBeneficiaryPhone, setLeveeBeneficiaryPhone] = useState('')
  const [leveeTargetAmount, setLeveeTargetAmount] = useState('')
  const [leveeDeadline, setLeveeDeadline] = useState('')
  const [leveeMode, setLeveeMode] = useState<'flexible' | 'tout_ou_rien'>('flexible')

  // Load Tontine rounds & contributions
  const loadTontineData = useCallback(async () => {
    if (!currentAssociation) {
      setLoadingTontine(false)
      return
    }

    try {
      const { data: roundsData } = await supabase
        .from('tontine_rounds')
        .select('*')
        .eq('association_id', currentAssociation.id)
        .order('round_number', { ascending: true })

      if (roundsData && roundsData.length > 0) {
        setRounds(roundsData as TontineRound[])
      } else {
        // Generate initial default rounds based on association contribution
        const amount = currentAssociation.contribution_amount || 50000
        const pot = amount * 12
        const defaultRounds: TontineRound[] = [
          {
            id: 'round-1',
            association_id: currentAssociation.id,
            round_number: 1,
            title: 'Tour n°1 - Juillet 2026',
            beneficiary_id: 'usr-demo-3',
            beneficiary_name: 'Marcelle Tchatchoua',
            pot_amount: pot,
            contribution_amount: amount,
            due_date: '2026-07-31',
            status: 'completed',
          },
          {
            id: 'round-2',
            association_id: currentAssociation.id,
            round_number: 2,
            title: 'Tour n°2 - Août 2026',
            beneficiary_id: user?.id || 'usr-demo-1',
            beneficiary_name: 'Alain Mboa (Moi)',
            pot_amount: pot,
            contribution_amount: amount,
            due_date: '2026-08-31',
            status: 'completed',
          },
          {
            id: 'round-3',
            association_id: currentAssociation.id,
            round_number: 3,
            title: 'Tour n°3 - Septembre 2026',
            beneficiary_id: 'usr-demo-2',
            beneficiary_name: 'Clarisse Ngo',
            pot_amount: pot,
            contribution_amount: amount,
            due_date: '2026-09-30',
            status: 'active',
          },
          {
            id: 'round-4',
            association_id: currentAssociation.id,
            round_number: 4,
            title: 'Tour n°4 - Octobre 2026',
            beneficiary_id: 'usr-demo-4',
            beneficiary_name: 'Jean-Paul Kamga',
            pot_amount: pot,
            contribution_amount: amount,
            due_date: '2026-10-31',
            status: 'upcoming',
          },
        ]
        setRounds(defaultRounds)
      }

      // Load user's contributions
      if (user) {
        const { data: contribs } = await supabase
          .from('tontine_contributions')
          .select('*')
          .eq('user_id', user.id)

        if (contribs) {
          setMyContributions(contribs as TontineContribution[])
        }
      }
    } catch (err) {
      console.error('Error loading tontine data:', err)
    } finally {
      setLoadingTontine(false)
    }
  }, [currentAssociation, user])

  // Load Main Levée data
  const loadLevees = useCallback(async () => {
    if (!currentAssociation) {
      setLoadingLevees(false)
      return
    }
    try {
      const { data } = await supabase
        .from('main_levees')
        .select('*, main_levee_contributions(*)')
        .eq('association_id', currentAssociation.id)
        .order('created_at', { ascending: false })

      setLevees((data || []) as MainLevee[])
    } catch (err) {
      console.error('Error loading main levees:', err)
    } finally {
      setLoadingLevees(false)
    }
  }, [currentAssociation])

  useEffect(() => {
    loadTontineData()
    loadLevees()
  }, [loadTontineData, loadLevees])

  // Handle Tab Switch
  const switchTab = (tab: 'tontine' | 'main-levee') => {
    setActiveTab(tab)
    setSearchParams(tab === 'main-levee' ? { tab: 'main-levee' } : {})
  }

  // Handle paying contribution for a round
  const handlePayRound = async () => {
    if (!user || !payingRound) return

    setPaying(true)
    setPaymentFeedback(null)

    const amount = payingRound.contribution_amount || 50000

    if (paymentMethod === 'wallet') {
      const res = await payWithWallet(
        amount,
        `Cotisation ${payingRound.title}`,
        currentAssociation?.name
      )
      if (!res.success) {
        setPaymentFeedback({ type: 'error', message: res.error || 'Solde insuffisant' })
        setPaying(false)
        return
      }
    }

    try {
      // Record tontine contribution
      const newContrib = {
        round_id: payingRound.id,
        user_id: user.id,
        amount,
        status: 'success',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
      }

      await supabase.from('tontine_contributions').insert(newContrib)

      // Also record in association transactions
      if (currentAssociation) {
        await supabase.from('transactions').insert({
          association_id: currentAssociation.id,
          type: 'collection',
          amount,
          currency: 'XAF',
          status: 'success',
          description: `Cotisation ${payingRound.title} par ${user.email}`,
          created_at: new Date().toISOString(),
        })
      }

      setPaymentFeedback({
        type: 'success',
        message: `Votre cotisation de ${formatXAF(amount)} pour le ${payingRound.title} a été validée avec succès !`,
      })

      // Refresh data
      await loadTontineData()
      setTimeout(() => {
        setPayingRound(null)
        setPaymentFeedback(null)
      }, 1500)
    } catch (err) {
      console.error('Tontine pay error:', err)
      setPaymentFeedback({ type: 'error', message: 'Erreur lors de l\'enregistrement du versement' })
    } finally {
      setPaying(false)
    }
  }

  // Handle Create Main Levée
  const handleCreateLevee = async () => {
    if (!user || !currentAssociation || !leveeTitle || !leveeBeneficiary || !leveeTargetAmount || !leveeDeadline) return
    setCreatingLevee(true)
    try {
      const { error } = await supabase.from('main_levees').insert({
        association_id: currentAssociation.id,
        beneficiary_name: leveeBeneficiary,
        beneficiary_phone: leveeBeneficiaryPhone,
        title: leveeTitle,
        target_amount: parseFloat(leveeTargetAmount),
        deadline: new Date(leveeDeadline).toISOString(),
        mode: leveeMode,
        created_by: user.id,
        collected_amount: 0,
        status: 'active',
      })
      if (error) throw error
      setShowCreateLevee(false)
      setLeveeTitle('')
      setLeveeBeneficiary('')
      setLeveeBeneficiaryPhone('')
      setLeveeTargetAmount('')
      setLeveeDeadline('')
      await loadLevees()
    } catch (err) {
      console.error(err)
    } finally {
      setCreatingLevee(false)
    }
  }

  // Handle Contribute to Main Levée
  const handleContributeLevee = async () => {
    if (!user || !showContributeLevee || !leveeContribAmount) return
    const numAmount = parseFloat(leveeContribAmount)
    if (numAmount <= 0) return

    setContributingLevee(true)

    if (leveePaymentMethod === 'wallet') {
      const res = await payWithWallet(
        numAmount,
        `Contribution Main Levée: ${showContributeLevee.title}`,
        currentAssociation?.name
      )
      if (!res.success) {
        alert(res.error || 'Solde indicatif insuffisant')
        setContributingLevee(false)
        return
      }
    }

    try {
      await supabase.from('main_levee_contributions').insert({
        main_levee_id: showContributeLevee.id,
        contributor_id: user.id,
        amount: numAmount,
        status: 'success',
      })

      const newCollected = (showContributeLevee.collected_amount || 0) + numAmount
      await supabase
        .from('main_levees')
        .update({ collected_amount: newCollected })
        .eq('id', showContributeLevee.id)

      setShowContributeLevee(null)
      setLeveeContribAmount('')
      await loadLevees()
    } catch (err) {
      console.error(err)
    } finally {
      setContributingLevee(false)
    }
  }

  if (!currentAssociation) {
    return (
      <AppLayout>
        <EmptyState
          icon={<HandCoins size={48} />}
          title={t('dashboard.noAssociation')}
          description="Veuillez sélectionner ou rejoindre une association pour accéder aux tontines."
        />
      </AppLayout>
    )
  }

  // Active round is the one with status === 'active'
  const activeRound = rounds.find((r) => r.status === 'active') || rounds[0]
  const isMyContributionPaid = activeRound
    ? myContributions.some((c) => c.round_id === activeRound.id && c.status === 'success')
    : false

  const userIndicativeBalance = wallet?.cached_balance || 0

  return (
    <AppLayout>
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
        {/* Subtle repeating background Ndop pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url("${getNdopPatternSvg('var(--color-primary)')}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
          opacity: 0.015,
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Subtle static, abstract decoration pattern */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '150px',
          height: '150px',
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: `url("${getEkangPatternSvg('var(--color-primary)')}")`,
          backgroundSize: 'cover',
          borderRadius: '50%',
          border: '1.5px solid var(--color-primary)',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header & Context */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                Tontines & Cotisations
              </h1>
              <Badge variant="primary">{currentAssociation.name}</Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Gestion des cycles de cotisation rotatifs (ROSCA) et des collectes d'entraide.
            </p>
          </div>

          {/* User Indicative Wallet Quick Pill */}
          <div
            onClick={() => openWalletModal('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              background: 'var(--color-sand)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255, 115, 0, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-text)',
              }}
            >
              <Wallet size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                AS-WALLET
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {formatXAF(userIndicativeBalance)}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs between Tontines rotatives & Main Levée */}
        <div
          style={{
            display: 'flex',
            background: 'var(--color-sand)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            gap: '4px',
          }}
        >
          <button
            onClick={() => switchTab('tontine')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'tontine' ? 'var(--color-card)' : 'transparent',
              color: activeTab === 'tontine' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'tontine' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'tontine' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <HandCoins size={18} />
            Tours de Tontine (Cycles & Cotisations)
          </button>
          <button
            onClick={() => switchTab('main-levee')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: activeTab === 'main-levee' ? 'var(--color-card)' : 'transparent',
              color: activeTab === 'main-levee' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'main-levee' ? 700 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'main-levee' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <HeartHandshake size={18} />
            Main Levée (Solidarité & Cagnottes)
            {levees.length > 0 && (
              <Badge variant="primary" size="sm">
                {levees.length}
              </Badge>
            )}
          </button>
        </div>

        {/* AnimatePresence for Tab 1 & Tab 2 transitions */}
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'tontine' && (
            <motion.div
              key="tab-tontine"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
            {loadingTontine ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <Spinner size={32} />
              </div>
            ) : (
              <>
                {/* Active Round Highlight Card */}
                {activeRound && (
                  <Card
                    style={{
                      border: '1px solid rgba(200, 150, 62, 0.4)',
                      background: 'var(--color-card)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            background: 'var(--color-primary)',
                            color: '#FFFFFF',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          Tour Actuel • {activeRound.title}
                        </span>
                        <Badge variant="success">En cours</Badge>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        <Clock size={15} />
                        <span>Échéance : {activeRound.due_date}</span>
                      </div>
                    </div>

                    {/* Pot & Beneficiary Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '20px',
                      }}
                    >
                      <div
                        style={{
                          padding: '16px',
                          background: 'var(--color-sand)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Cagnotte Globale du Tour
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                          {formatXAF(activeRound.pot_amount)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Cotisation requise : <strong>{formatXAF(activeRound.contribution_amount)}</strong> / membre
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '16px',
                          background: 'var(--color-sand)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                          Bénéficiaire du Tour (Ramassage)
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Users size={20} color="var(--color-primary)" />
                          {activeRound.beneficiary_name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Ce membre empochera la cagnotte après la séance
                        </div>
                      </div>

                      {/* My Contribution Status Box */}
                      <div
                        style={{
                          padding: '16px',
                          background: isMyContributionPaid ? '#ECFDF5' : '#FFFBEB',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isMyContributionPaid ? '#A7F3D0' : '#FDE68A'}`,
                        }}
                      >
                        <div style={{ fontSize: '12px', color: isMyContributionPaid ? '#065F46' : '#92400E', marginBottom: '4px', fontWeight: 600 }}>
                          Ma Cotisation Personnelle
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {isMyContributionPaid ? (
                            <Badge variant="success">
                              <CheckCircle2 size={13} /> Réglée ({formatXAF(activeRound.contribution_amount)})
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock size={13} /> À régler ({formatXAF(activeRound.contribution_amount)})
                            </Badge>
                          )}
                        </div>
                        {!isMyContributionPaid ? (
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() => {
                              setPayingRound(activeRound)
                              setPaymentFeedback(null)
                            }}
                          >
                            <CreditCard size={15} /> Payer ma cotisation
                          </Button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#047857' }}>
                            Vous êtes à jour pour ce tour de tontine !
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar of round collection */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Recouvrement des cotisations du tour :</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>10 / 12 membres à jour (83%)</span>
                      </div>
                      <ProgressBar value={83} max={100} />
                    </div>
                  </Card>
                )}

                {/* Rotating Schedule / Ordre de Passage */}
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                        Calendrier & Ordre de Passage des Tours
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Chaque membre bénéficie de la cagnotte à tour de rôle selon l'ordre établi.
                      </p>
                    </div>
                    <Badge variant="accent">Cycle de 12 mois</Badge>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {rounds.map((round) => {
                      const isCurrent = round.status === 'active'
                      const isPast = round.status === 'completed'
                      const isMe = round.beneficiary_name.includes('Moi') || (user && round.beneficiary_id === user.id)

                      return (
                        <div
                          key={round.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: isCurrent
                              ? '2px solid var(--color-primary)'
                              : '1px solid var(--color-border)',
                            background: isCurrent
                              ? 'rgba(200, 150, 62, 0.05)'
                              : isPast
                              ? 'var(--color-sand)'
                              : 'var(--color-card)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '14px',
                                background: isCurrent
                                  ? 'var(--color-primary)'
                                  : isPast
                                  ? '#E5E7EB'
                                  : 'var(--color-sand)',
                                color: isCurrent ? '#FFFFFF' : 'var(--color-text)',
                              }}
                            >
                              #{round.round_number}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
                                  {round.title}
                                </span>
                                {isMe && (
                                  <Badge variant="primary" size="sm">
                                    Mon Tour !
                                  </Badge>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Bénéficiaire : <strong>{round.beneficiary_name}</strong></span>
                                <span>•</span>
                                <span>Date : {round.due_date}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-primary)' }}>
                                {formatXAF(round.pot_amount)}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                Cagnotte
                              </div>
                            </div>

                            {isPast && <Badge variant="default">Terminé</Badge>}
                            {isCurrent && <Badge variant="success">En cours</Badge>}
                            {round.status === 'upcoming' && <Badge variant="primary">À venir</Badge>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                {/* Banner to introduce Main-Levée */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'rgba(200, 150, 62, 0.05)',
                    border: '1px solid rgba(200,150,62,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HeartHandshake size={24} color="var(--color-primary)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
                        Besoin d'une collecte solidaire exceptionnelle ?
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Lancez une <strong>Main Levée</strong> pour les rentrées scolaires, soutiens de santé ou projets d'urgence.
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={() => switchTab('main-levee')}>
                    Voir les Main Levées <ArrowRight size={14} />
                  </Button>
                </div>
              </>
            )}
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MAIN LEVÉE (SOLIDARITÉ & CAGNOTTE EXCEPTIONNELLE) */}
          {/* ========================================================================= */}
          {activeTab === 'main-levee' && (
            <motion.div
              key="tab-main-levee"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>
                  Collectes Solidaires (Main Levée)
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Cagnottes ponctuelles pour soutenir un membre désigné (urgence médicale, mariage, scolarité).
                </p>
              </div>

              <Button size="sm" onClick={() => setShowCreateLevee(true)}>
                <Plus size={16} /> Lancer une Main Levée
              </Button>
            </div>

            {loadingLevees ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
                <Spinner size={32} />
              </div>
            ) : levees.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
                <HeartHandshake size={48} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Aucune Main Levée active pour le moment
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '440px', margin: '0 auto 16px' }}>
                  La Main Levée permet aux membres de lever des fonds exceptionnels pour une cause ou un membre précis.
                </p>
                <Button size="sm" onClick={() => setShowCreateLevee(true)}>
                  <Plus size={16} /> Lancer la première Main Levée
                </Button>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {levees.map((levee) => {
                  const pct = getProgressPercentage(levee.collected_amount, levee.target_amount)
                  const days = daysUntil(levee.deadline)

                  return (
                    <Card key={levee.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                            {levee.title}
                          </h3>
                          <Badge variant={levee.mode === 'flexible' ? 'primary' : 'warning'}>
                            {levee.mode === 'flexible' ? 'Flexible' : 'Tout ou rien'}
                          </Badge>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                          Bénéficiaire : <strong>{levee.beneficiary_name}</strong>
                          {levee.beneficiary_phone ? ` (${levee.beneficiary_phone})` : ''}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                              {formatXAF(levee.collected_amount)}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              sur {formatXAF(levee.target_amount)}
                            </span>
                          </div>
                          <ProgressBar value={pct} max={100} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                          <span>{pct}% collectés</span>
                          <span>{days > 0 ? `${days} jours restants` : 'Terminée'}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        onClick={() => {
                          setShowContributeLevee(levee)
                          setLeveeContribAmount('10000')
                        }}
                      >
                        Contribuer à la collecte
                      </Button>
                    </Card>
                  )
                })}
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* MODAL: PAY TONTINE ROUND CONTRIBUTION */}
        {/* ========================================================================= */}
        {payingRound && (
          <Modal
            open={!!payingRound}
            onClose={() => setPayingRound(null)}
            title={`Payer ma cotisation : ${payingRound.title}`}
            maxWidth={500}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px',
                  background: 'var(--color-sand)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Montant de la cotisation</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {formatXAF(payingRound.contribution_amount)}
                  </div>
                </div>
                <Badge variant="primary">Tour #{payingRound.round_number}</Badge>
              </div>

              {/* Choose payment method */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                  Choisissez le moyen de paiement :
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Option 1: User Indicative Wallet */}
                  <div
                    onClick={() => setPaymentMethod('wallet')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentMethod === 'wallet' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: paymentMethod === 'wallet' ? 'rgba(200, 150, 62, 0.08)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Wallet size={20} color="var(--color-primary)" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                          AS-WALLET (Recommandé)
                        </div>
                        <div style={{ fontSize: '12px', color: userIndicativeBalance >= payingRound.contribution_amount ? '#047857' : '#DC2626' }}>
                          Solde disponible : <strong>{formatXAF(userIndicativeBalance)}</strong>
                          {userIndicativeBalance < payingRound.contribution_amount ? ' (Insuffisant)' : ' (Prêt)'}
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && <CheckCircle2 size={18} color="var(--color-primary)" />}
                  </div>

                  {/* Option 2: MTN Mobile Money */}
                  <div
                    onClick={() => setPaymentMethod('mtn_momo')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentMethod === 'mtn_momo' ? '#F59E0B' : 'var(--color-border)'}`,
                      background: paymentMethod === 'mtn_momo' ? 'rgba(251, 191, 36, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Smartphone size={20} color="#D97706" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                          MTN Mobile Money
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Débit direct sur votre compte MTN
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'mtn_momo' && <CheckCircle2 size={18} color="#D97706" />}
                  </div>

                  {/* Option 3: Orange Money */}
                  <div
                    onClick={() => setPaymentMethod('orange_money')}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${paymentMethod === 'orange_money' ? '#F97316' : 'var(--color-border)'}`,
                      background: paymentMethod === 'orange_money' ? 'rgba(249, 115, 22, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Smartphone size={20} color="#EA580C" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                          Orange Money
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          Débit direct sur votre compte Orange
                        </div>
                      </div>
                    </div>
                    {paymentMethod === 'orange_money' && <CheckCircle2 size={18} color="#EA580C" />}
                  </div>
                </div>
              </div>

              {/* If Mobile Money chosen, input phone */}
              {paymentMethod !== 'wallet' && (
                <Input
                  label="Numéro de téléphone Mobile Money"
                  value={momoPhone}
                  onChange={setMomoPhone}
                  placeholder="+237 6..."
                />
              )}

              {/* Feedback */}
              {paymentFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '13px',
                    background: paymentFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                    color: paymentFeedback.type === 'success' ? '#065F46' : '#991B1B',
                  }}
                >
                  {paymentFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{paymentFeedback.message}</span>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                loading={paying}
                onClick={handlePayRound}
                disabled={paymentMethod === 'wallet' && userIndicativeBalance < payingRound.contribution_amount}
              >
                Confirmer le règlement de {formatXAF(payingRound.contribution_amount)}
              </Button>
            </div>
          </Modal>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CREATE MAIN LEVÉE */}
        {/* ========================================================================= */}
        {showCreateLevee && (
          <Modal
            open={showCreateLevee}
            onClose={() => setShowCreateLevee(false)}
            title="Lancer une Main Levée (Collecte Solidaire)"
            maxWidth={500}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Motif / Titre de la Main Levée"
                value={leveeTitle}
                onChange={setLeveeTitle}
                placeholder="Ex: Soutien Rentrée Scolaire, Urgence Médicale..."
              />

              <Input
                label="Nom du Bénéficiaire"
                value={leveeBeneficiary}
                onChange={setLeveeBeneficiary}
                placeholder="Nom complet du membre ou ayant-droit"
              />

              <Input
                label="Téléphone du Bénéficiaire"
                value={leveeBeneficiaryPhone}
                onChange={setLeveeBeneficiaryPhone}
                placeholder="+237 6..."
              />

              <Input
                label="Montant cible à collecter (XAF)"
                type="number"
                value={leveeTargetAmount}
                onChange={setLeveeTargetAmount}
                placeholder="Ex: 250000"
              />

              <Input
                label="Date d'échéance de la collecte"
                type="date"
                value={leveeDeadline}
                onChange={setLeveeDeadline}
              />

              <Select
                label="Mode de versement"
                value={leveeMode}
                onChange={(v) => setLeveeMode(v as 'flexible' | 'tout_ou_rien')}
                options={[
                  { value: 'flexible', label: 'Flexible (Fonds versés même si l\'objectif n\'est pas atteint)' },
                  { value: 'tout_ou_rien', label: 'Tout ou Rien (Objectif strict requis)' },
                ]}
              />

              <Button
                variant="primary"
                fullWidth
                loading={creatingLevee}
                onClick={handleCreateLevee}
              >
                Publier la Main Levée
              </Button>
            </div>
          </Modal>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CONTRIBUTE TO MAIN LEVÉE */}
        {/* ========================================================================= */}
        {showContributeLevee && (
          <Modal
            open={!!showContributeLevee}
            onClose={() => setShowContributeLevee(null)}
            title={`Contribuer à : ${showContributeLevee.title}`}
            maxWidth={500}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Bénéficiaire : <strong>{showContributeLevee.beneficiary_name}</strong>
              </div>

              <Input
                label="Montant de votre contribution (XAF)"
                type="number"
                value={leveeContribAmount}
                onChange={setLeveeContribAmount}
                placeholder="Ex: 10000"
              />

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
                  Payer avec :
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onClick={() => setLeveePaymentMethod('wallet')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${leveePaymentMethod === 'wallet' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: leveePaymentMethod === 'wallet' ? 'rgba(200, 150, 62, 0.08)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Wallet size={16} color="var(--color-primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Portefeuille Indicatif ({formatXAF(userIndicativeBalance)})</span>
                    </div>
                    {leveePaymentMethod === 'wallet' && <CheckCircle2 size={16} color="var(--color-primary)" />}
                  </div>

                  <div
                    onClick={() => setLeveePaymentMethod('mtn_momo')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${leveePaymentMethod === 'mtn_momo' ? '#F59E0B' : 'var(--color-border)'}`,
                      background: leveePaymentMethod === 'mtn_momo' ? 'rgba(251, 191, 36, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} color="#D97706" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>MTN Mobile Money</span>
                    </div>
                    {leveePaymentMethod === 'mtn_momo' && <CheckCircle2 size={16} color="#D97706" />}
                  </div>

                  <div
                    onClick={() => setLeveePaymentMethod('orange_money')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${leveePaymentMethod === 'orange_money' ? '#F97316' : 'var(--color-border)'}`,
                      background: leveePaymentMethod === 'orange_money' ? 'rgba(249, 115, 22, 0.15)' : 'var(--color-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} color="#EA580C" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Orange Money</span>
                    </div>
                    {leveePaymentMethod === 'orange_money' && <CheckCircle2 size={16} color="#EA580C" />}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                loading={contributingLevee}
                onClick={handleContributeLevee}
              >
                Confirmer la contribution
              </Button>
            </div>
          </Modal>
        )}
        </div>
      </div>
    </AppLayout>
  )
}
