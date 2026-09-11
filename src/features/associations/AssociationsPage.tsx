import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateJoinCode } from '@/lib/utils'
import type { Association } from '@/types/database'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { Plus, Users, MapPin, Building2, UserPlus, FolderPlus, HelpCircle, ShieldAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Joyride } from 'react-joyride'

const TourStyles = () => (
  <style>{`
    @keyframes tourPing {
      0% { transform: scale(1); opacity: 1; }
      70%, 100% { transform: scale(2); opacity: 0; }
    }
    @keyframes tourPulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.25); opacity: 0.4; }
    }
    @keyframes tourBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `}</style>
)

const CustomBeacon = () => {
  return (
    <>
      <TourStyles />
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        width: '44px',
        height: '44px',
      }}>
        {/* Accent yellow ripple */}
        <span style={{
          position: 'absolute',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(244, 196, 48, 0.45)',
          animation: 'tourPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        }} />

        {/* Primary green concentric pulse */}
        <span style={{
          position: 'absolute',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: 'rgba(20, 83, 45, 0.2)',
          border: '2px solid var(--color-primary, #14532D)',
          animation: 'tourPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }} />
      </div>
    </>
  )
}

function formatAssociationCode(raw: string): string {
  let clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.startsWith('AS')) {
    clean = clean.substring(2)
  }
  clean = clean.substring(0, 10)
  
  let formatted = 'AS'
  if (clean.length > 0) {
    formatted += '-' + clean.substring(0, 3)
  }
  if (clean.length > 3) {
    formatted += '-' + clean.substring(3, 6)
  }
  if (clean.length > 6) {
    formatted += '-' + clean.substring(6, 10)
  }
  return formatted
}

function getCleanCodeLength(formatted: string): number {
  return formatted.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^AS/, '').length
}

export function AssociationsPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { associations, refreshAssociations, setCurrentAssociation } = useAssociation()
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // Cast Joyride as any to prevent strict compiler errors with props/types
  const JoyrideComponent = Joyride as any

  // Guided Tour (Onboarding) State
  const [runTour, setRunTour] = useState(false)
  const [tourKey, setTourKey] = useState(0)

  const tourSteps: any[] = [
    {
      target: '#assoc-page-title',
      content: "Bienvenue sur l'espace Associations d'AssoMboa ! C'est ici que vous gérez vos tontines et vos groupes. Suivons ce guide rapide pour vous lancer !",
      disableBeacon: true,
    },
    {
      target: '#assoc-list-container',
      content: "Toutes vos associations actives s'afficheront dans cette zone. Vous pourrez y consulter vos tontines, vos cotisations, voter et échanger avec les membres.",
    },
    {
      target: '#assoc-fab-trigger',
      content: "Pour commencer, cliquez sur ce bouton d'action magique pour ouvrir le menu d'ajout d'association.",
    },
    {
      target: '#assoc-create-tour-btn',
      content: "Une fois le menu ouvert, cliquez sur 'Créer une association' pour configurer votre propre tontine avec son type, sa fréquence et son montant.",
      placement: 'left',
    },
    {
      target: '#assoc-join-tour-btn',
      content: "Ou cliquez sur 'Rejoindre une association' et entrez un code d'invitation unique fourni par votre président de tontine !",
      placement: 'left',
    }
  ]

  const handleJoyrideCallback = (data: any) => {
    const { index, type, status, action } = data
    
    // Core Fix: Pre-emptively trigger FAB menu expansion as soon as step 2 is successfully completed.
    // This allows the DOM elements to be fully mounted in React before Joyride attempts to measure them for step 3.
    if (type === 'step:after' && index === 2 && action === 'next') {
      setFabOpen(true)
    }

    if (type === 'step:before' && index >= 3) {
      setFabOpen(true)
    }
    if (type === 'step:before' && index < 3) {
      setFabOpen(false)
    }
    if (status === 'finished' || status === 'skipped') {
      setRunTour(false)
      setFabOpen(false)
      localStorage.setItem('assomboa_onboarding_completed', 'true')
    }
  }


  // form state
  const [name, setName] = useState('')
  const [type, setType] = useState('tontine')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [frequency, setFrequency] = useState('monthly')
  const [amount, setAmount] = useState('')
  const [cassationDate, setCassationDate] = useState('')
  const [description, setDescription] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')

  useEffect(() => {
    refreshAssociations().then(() => setLoading(false))
  }, [refreshAssociations])

  const handleCreate = async () => {
    if (!user || !name) return
    setCreating(true)
    setCreateError(null)
    try {
      const { data: assoc, error } = await supabase.from('associations').insert({
        name, owner_id: user.id, city, region,
        association_type: type, visibility,
        contribution_frequency: frequency,
        contribution_amount: parseFloat(amount) || 0,
        cassation_date: cassationDate || null,
        description,
        receipt_number: receiptNumber || null,
      }).select().single()
      if (error) throw error

      const assocData = assoc as Association

      await Promise.all([
        supabase.from('association_members').insert({
          association_id: assocData.id, user_id: user.id, status: 'active',
          joined_at: new Date().toISOString(),
        }),
        supabase.from('bureau_assignments').insert({
          association_id: assocData.id, user_id: user.id, role: 'proprio',
          assigned_by: user.id,
        }),
        supabase.from('wallets').insert({ association_id: assocData.id }),
        supabase.from('subscriptions').insert({ association_id: assocData.id, plan: 'free' }),
        supabase.from('join_codes').insert({
          code: generateJoinCode(), association_id: assocData.id, created_by: user.id,
        }),
      ])

      setShowCreate(false)
      setName(''); setCity(''); setRegion(''); setAmount(''); setCassationDate(''); setDescription(''); setReceiptNumber('')
      await refreshAssociations()
    } catch (err) {
      console.error('Create error:', err)
      setCreateError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!user || !joinCode) return
    setJoining(true)
    setJoinError(null)
    try {
      const { data: code, error: codeErr } = await supabase.from('join_codes')
        .select('association_id, is_active, expires_at')
        .eq('code', joinCode.toUpperCase())
        .eq('is_active', true).maybeSingle()
      if (codeErr) throw codeErr
      if (!code) { setJoinError(t('common.error')); setJoining(false); return }
      if (code.expires_at && new Date(code.expires_at) < new Date()) {
        setJoinError(t('common.error')); setJoining(false); return
      }
      const { error: memErr } = await supabase.from('association_members').insert({
        association_id: code.association_id, user_id: user.id, status: 'pending',
      })
      if (memErr) throw memErr
      setShowJoin(false)
      setJoinCode('')
      await refreshAssociations()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setJoining(false)
    }
  }

  const kycVerified = profile?.kyc_status === 'verified'

  return (
    <AppLayout>
      <JoyrideComponent
        key={tourKey}
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        beaconComponent={CustomBeacon}
        callback={handleJoyrideCallback}
        locale={{
          back: 'Retour',
          close: 'Fermer',
          last: 'Terminer',
          next: 'Suivant',
          skip: 'Passer',
        }}
        styles={{
          options: {
            arrowColor: 'var(--color-card)',
            backgroundColor: 'var(--color-card)',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: 'var(--color-primary)',
            textColor: 'var(--color-text)',
            zIndex: 10001,
          },
          buttonNext: {
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            borderRadius: '9999px',
            fontWeight: 600,
            outline: 'none',
            padding: '8px 16px',
            fontSize: '13px',
          },
          buttonBack: {
            color: 'var(--color-text-secondary)',
            marginRight: 10,
            fontSize: '13px',
          },
          buttonSkip: {
            color: 'var(--color-text-muted)',
            fontSize: '13px',
          }
        } as any}
      />
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
          animation: 'spin 30s linear infinite',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 id="assoc-page-title" style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('assoc.myAssociations')}</h1>
          <button
            id="restart-tour-button"
            onClick={() => {
              setFabOpen(false)
              setTourKey((prev) => prev + 1)
              setRunTour(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Démarrer la visite guidée"
          >
            <HelpCircle size={14} />
            Visite guidée
          </button>
        </div>

        {!kycVerified && (
          <Card style={{
            border: '1px solid rgba(217, 119, 6, 0.2)',
            background: 'rgba(217, 119, 6, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(217, 119, 6, 0.1)',
              color: '#B45309',
              flexShrink: 0,
            }}>
              <ShieldAlert size={16} />
            </div>
            <p style={{ color: '#92400E', fontSize: '13px', fontWeight: 500, margin: 0, lineHeight: '1.5', textAlign: 'left' }}>
              {t('kyc.subtitle')}
            </p>
          </Card>
        )}

        <div id="assoc-list-container">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
          ) : associations.length === 0 ? (
            <EmptyState icon={<Building2 size={48} />} title={t('assoc.empty')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '100px' }}>
              {associations.map((assoc) => (
                <AssocCard key={assoc.id} assoc={assoc} onOpen={() => setCurrentAssociation(assoc)} />
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Backdrop and FAB rendered via React Portal directly into body to completely bypass container scrolls/transforms */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop Blur overlay when FAB is active */}
          <AnimatePresence>
            {fabOpen && (
              <motion.div
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                onClick={() => setFabOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(18, 7, 6, 0.45)',
                  zIndex: 9999,
                  cursor: 'pointer',
                }}
              />
            )}
          </AnimatePresence>

          {/* Floating Action Button (FAB) Menu */}
          <div style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px',
            zIndex: 10000,
          }}>
            <AnimatePresence>
              {fabOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                  {/* Créer une association button */}
                  <motion.button
                    id="assoc-create-tour-btn"
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    disabled={!kycVerified}
                    onClick={() => {
                      setFabOpen(false)
                      setShowCreate(true)
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '30px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(16px)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      backgroundImage: 'linear-gradient(rgba(30, 15, 14, 0.8), rgba(30, 15, 14, 0.8))',
                      border: '2px solid var(--color-primary)',
                      backgroundClip: 'padding-box, border-box',
                      backgroundOrigin: 'border-box',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: kycVerified ? 'pointer' : 'not-allowed',
                      opacity: kycVerified ? 1 : 0.5,
                      whiteSpace: 'nowrap',
                    }}
                    whileHover={kycVerified ? { scale: 1.05 } : {}}
                    whileTap={kycVerified ? { scale: 0.95 } : {}}
                  >
                    <FolderPlus size={16} color="var(--color-accent)" />
                    <span>{t('assoc.create')}</span>
                  </motion.button>

                  {/* Rejoindre une association button */}
                  <motion.button
                    id="assoc-join-tour-btn"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    disabled={!kycVerified}
                    onClick={() => {
                      setFabOpen(false)
                      setShowJoin(true)
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '30px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(16px)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      backgroundImage: 'linear-gradient(rgba(30, 15, 14, 0.8), rgba(30, 15, 14, 0.8))',
                      border: '2px solid var(--color-primary)',
                      backgroundClip: 'padding-box, border-box',
                      backgroundOrigin: 'border-box',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: kycVerified ? 'pointer' : 'not-allowed',
                      opacity: kycVerified ? 1 : 0.5,
                      whiteSpace: 'nowrap',
                    }}
                    whileHover={kycVerified ? { scale: 1.05 } : {}}
                    whileTap={kycVerified ? { scale: 0.95 } : {}}
                  >
                    <UserPlus size={16} color="var(--color-accent)" />
                    <span>{t('assoc.join')}</span>
                  </motion.button>
                </div>
              )}
            </AnimatePresence>

            {/* Master "+" button */}
            <motion.button
              id="assoc-fab-trigger"
              onClick={() => setFabOpen(!fabOpen)}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(255, 115, 0, 0.35)',
                cursor: 'pointer',
                border: 'none',
              }}
              animate={{ rotate: fabOpen ? 135 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </motion.button>
          </div>
        </>,
        document.body
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('assoc.create')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input id="assoc-name-input" label={t('assoc.name')} value={name} onChange={setName} required aria-label="Nom de l'association" />
          <Select id="assoc-type-select" label={t('assoc.type')} value={type} onChange={setType} options={[
            { value: 'tontine', label: t('assoc.type.tontine') },
            { value: 'gic', label: t('assoc.type.gic') },
            { value: 'ong', label: t('assoc.type.ong') },
            { value: 'association', label: t('assoc.type.association') },
          ]} aria-label="Type d'association" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input id="assoc-city-input" label={t('assoc.city')} value={city} onChange={setCity} aria-label="Ville" />
            <Input id="assoc-region-input" label={t('assoc.region')} value={region} onChange={setRegion} aria-label="Région" />
          </div>
          <Select id="assoc-visibility-select" label={t('assoc.visibility')} value={visibility} onChange={setVisibility} options={[
            { value: 'private', label: t('assoc.visibility.private') },
            { value: 'public', label: t('assoc.visibility.public') },
          ]} aria-label="Visibilité" />
          <Select id="assoc-frequency-select" label={t('assoc.frequency')} value={frequency} onChange={setFrequency} options={[
            { value: 'daily', label: t('assoc.frequency.daily') },
            { value: 'weekly', label: t('assoc.frequency.weekly') },
            { value: 'monthly', label: t('assoc.frequency.monthly') },
            { value: 'quarterly', label: t('assoc.frequency.quarterly') },
            { value: 'yearly', label: t('assoc.frequency.yearly') },
          ]} aria-label="Fréquence des cotisations" />
          <Input id="assoc-amount-input" label={t('assoc.amount')} value={amount} onChange={setAmount} type="number" placeholder="0" aria-label="Montant de la cotisation en XAF" />
          <Input id="assoc-cassation-input" label={t('assoc.cassationDate')} value={cassationDate} onChange={setCassationDate} type="date" aria-label="Date de cassation" />
          <Input id="assoc-receipt-input" label="Numéro de récépissé (Optionnel)" value={receiptNumber} onChange={setReceiptNumber} type="text" placeholder="Ex: Réf/MinaT/123-A" aria-label="Numéro de récépissé officiel de déclaration de l'association" />
          <Input id="assoc-description-input" label={t('assoc.description')} value={description} onChange={setDescription} multiline rows={2} aria-label="Description de l'association" />
          {createError && <div style={{ color: 'var(--color-error)', fontSize: '13px' }} role="alert">{createError}</div>}
          <Button onClick={handleCreate} fullWidth loading={creating} disabled={!name} aria-label="Soumettre la création de l'association">
            {t('assoc.createButton')}
          </Button>
        </div>
      </Modal>

      <Modal open={showJoin} onClose={() => setShowJoin(false)} title={t('assoc.join')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            id="assoc-join-code-input"
            label={t('assoc.joinCode')} 
            value={joinCode} 
            onChange={(v) => setJoinCode(formatAssociationCode(v))}
            placeholder="AS-a1b-2c3-d4e5" 
            required 
            aria-label="Code de jonction à 10 caractères"
          />
          {joinError && <div style={{ color: 'var(--color-error)', fontSize: '13px' }} role="alert">{joinError}</div>}
          <Button 
            onClick={handleJoin} 
            fullWidth 
            loading={joining} 
            disabled={getCleanCodeLength(joinCode) !== 10}
            aria-label="Rejoindre l'association avec ce code"
          >
            {t('assoc.joinButton')}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}

function AssocCard({ assoc, onOpen }: { assoc: Association; onOpen: () => void }) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  useEffect(() => {
    supabase.from('association_members').select('id', { count: 'exact', head: true })
      .eq('association_id', assoc.id).eq('status', 'active')
      .then(({ count }: { count?: number | null }) => setCount(count || 0))
  }, [assoc.id])

  return (
    <Card onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
        background: 'var(--color-primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Building2 size={24} color="var(--color-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {assoc.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {assoc.city}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} /> {t('assoc.membersCount', { count })}
          </span>
          {assoc.receipt_number && (
            <span style={{ fontSize: '11px', color: 'var(--color-accent-text)', background: 'var(--color-accent)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
              Récépissé: {assoc.receipt_number}
            </span>
          )}
        </div>
      </div>
      <Badge variant={assoc.is_premium ? 'accent' : 'default'}>
        {t(`assoc.type.${assoc.association_type}`)}
      </Badge>
    </Card>
  )
}
