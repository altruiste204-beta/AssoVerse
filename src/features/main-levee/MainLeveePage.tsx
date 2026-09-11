import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, ProgressBar, Spinner, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatXAF, formatDate, daysUntil } from '@/lib/utils'
import type { MainLevee } from '@/types/database'
import { Plus, HandCoins, Users, Clock, TrendingUp } from 'lucide-react'

export function MainLeveePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation } = useAssociation()
  const [levees, setLevees] = useState<MainLevee[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showContribute, setShowContribute] = useState<MainLevee | null>(null)
  const [creating, setCreating] = useState(false)
  const [contributing, setContributing] = useState(false)
  const [contribAmount, setContribAmount] = useState('')

  // form
  const [title, setTitle] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [mode, setMode] = useState('flexible')

  const loadLevees = useCallback(async () => {
    if (!currentAssociation) { setLoading(false); return }
    const { data, error } = await supabase.from('main_levees')
      .select('*, main_levee_contributions(*)')
      .eq('association_id', currentAssociation.id)
      .order('created_at', { ascending: false })
    if (error) { console.error(error); setLoading(false); return }
    setLevees((data || []) as MainLevee[])
    setLoading(false)
  }, [currentAssociation])

  useEffect(() => { loadLevees() }, [loadLevees])

  const handleCreate = async () => {
    if (!user || !currentAssociation || !title || !beneficiary || !targetAmount || !deadline) return
    setCreating(true)
    try {
      const { error } = await supabase.from('main_levees').insert({
        association_id: currentAssociation.id,
        beneficiary_name: beneficiary,
        beneficiary_phone: beneficiaryPhone,
        title, target_amount: parseFloat(targetAmount),
        deadline: new Date(deadline).toISOString(),
        mode, created_by: user.id,
      })
      if (error) throw error
      setShowCreate(false)
      setTitle(''); setBeneficiary(''); setBeneficiaryPhone(''); setTargetAmount(''); setDeadline('')
      await loadLevees()
    } catch (err) { console.error(err) } finally { setCreating(false) }
  }

  const handleContribute = async () => {
    if (!user || !showContribute || !contribAmount) return
    setContributing(true)
    try {
      const { error } = await supabase.from('main_levee_contributions').insert({
        main_levee_id: showContribute.id,
        contributor_id: user.id,
        amount: parseFloat(contribAmount),
        status: 'success',
      })
      if (error) throw error
      const newCollected = showContribute.collected_amount + parseFloat(contribAmount)
      await supabase.from('main_levees').update({ collected_amount: newCollected })
        .eq('id', showContribute.id)
      setShowContribute(null); setContribAmount('')
      await loadLevees()
    } catch (err) { console.error(err) } finally { setContributing(false) }
  }

  if (!currentAssociation) {
    return <AppLayout><EmptyState icon={<HandCoins size={48} />} title={t('dashboard.noAssociation')} /></AppLayout>
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('mainLevee.title')}</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> {t('mainLevee.create')}
          </Button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : levees.length === 0 ? (
          <EmptyState icon={<HandCoins size={48} />} title={t('mainLevee.noActive')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {levees.map((ml) => {
              const days = daysUntil(ml.deadline)
              const contributors = ml.contributions || []
              return (
                <Card key={ml.id} className="animate-slide-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', color: 'var(--color-text)' }}>{ml.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {ml.beneficiary_name}
                      </p>
                    </div>
                    <Badge variant={ml.status === 'succeeded' ? 'success' : ml.status === 'expired' ? 'error' : days < 0 ? 'error' : 'primary'}>
                      {ml.status === 'succeeded' ? t('mainLevee.succeeded') :
                       ml.status === 'expired' || days < 0 ? t('mainLevee.expired') :
                       t('mainLevee.daysLeft', { days: Math.max(0, days) })}
                    </Badge>
                  </div>

                  {ml.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>{ml.description}</p>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {t('mainLevee.collected')}: <strong>{formatXAF(ml.collected_amount)}</strong>
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {t('mainLevee.target')}: {formatXAF(ml.target_amount)}
                    </span>
                  </div>
                  <ProgressBar value={ml.collected_amount} max={ml.target_amount} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> {contributors.length} {t('mainLevee.contributors')}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {formatDate(ml.deadline)}
                    </span>
                    <Badge variant="default" size="sm">{t(`mainLevee.mode.${ml.mode}`)}</Badge>
                  </div>
                  {ml.status === 'active' && days >= 0 && (
                    <Button size="sm" fullWidth style={{ marginTop: '12px' }} onClick={() => setShowContribute(ml)}>
                      <TrendingUp size={16} /> {t('mainLevee.contribute')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('mainLevee.create')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label={t('mainLevee.title')} value={title} onChange={setTitle} required />
          <Input label={t('mainLevee.beneficiary')} value={beneficiary} onChange={setBeneficiary} required />
          <Input label={t('mainLevee.beneficiaryPhone')} value={beneficiaryPhone} onChange={setBeneficiaryPhone} placeholder="+237 6XX XXX XXX" />
          <Input label={t('mainLevee.targetAmount')} value={targetAmount} onChange={setTargetAmount} type="number" required />
          <Input label={t('mainLevee.deadline')} value={deadline} onChange={setDeadline} type="date" required />
          <Select label={t('mainLevee.mode')} value={mode} onChange={setMode} options={[
            { value: 'flexible', label: t('mainLevee.mode.flexible') },
            { value: 'tout_ou_rien', label: t('mainLevee.mode.tout_ou_rien') },
          ]} />
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 12px', background: 'var(--color-sand)', borderRadius: 'var(--radius-sm)' }}>
            {mode === 'flexible' ? t('mainLevee.mode.flexibleDesc') : t('mainLevee.mode.tout_ou_rienDesc')}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{t('mainLevee.commission')}</p>
          <Button onClick={handleCreate} fullWidth loading={creating}
            disabled={!title || !beneficiary || !targetAmount || !deadline}>
            {t('mainLevee.createButton')}
          </Button>
        </div>
      </Modal>

      <Modal open={!!showContribute} onClose={() => { setShowContribute(null); setContribAmount('') }} title={t('mainLevee.contribute')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {showContribute && (
            <Card style={{ background: 'var(--color-sand)' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{showContribute.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {t('mainLevee.target')}: {formatXAF(showContribute.target_amount)}
              </div>
            </Card>
          )}
          <Input label={t('mainLevee.contributionAmount')} value={contribAmount} onChange={setContribAmount} type="number" required />
          <Button onClick={handleContribute} fullWidth loading={contributing} disabled={!contribAmount}>
            {t('mainLevee.contribute')}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}
