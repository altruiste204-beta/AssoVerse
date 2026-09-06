import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatXAF, formatDate } from '@/lib/utils'
import type { AssociationEvent, EventPayment } from '@/types/database'
import { Plus, Heart, CloudRain, CheckCircle2, Clock } from 'lucide-react'

export function EventsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation, userRole } = useAssociation()
  const [events, setEvents] = useState<AssociationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState<string | null>(null)

  // form
  const [eventType, setEventType] = useState('heureux')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mandatoryAmount, setMandatoryAmount] = useState('')
  const [beneficiary, setBeneficiary] = useState('')
  const [deadline, setDeadline] = useState('')

  const loadEvents = useCallback(async () => {
    if (!currentAssociation) { setLoading(false); return }
    const { data, error } = await supabase.from('association_events')
      .select('*, event_payments(*)')
      .eq('association_id', currentAssociation.id)
      .order('created_at', { ascending: false })
    if (error) { console.error(error); setLoading(false); return }
    setEvents((data || []) as AssociationEvent[])
    setLoading(false)
  }, [currentAssociation])

  useEffect(() => { loadEvents() }, [loadEvents])

  const handleCreate = async () => {
    if (!user || !currentAssociation || !title) return
    setCreating(true)
    try {
      const { error } = await supabase.from('association_events').insert({
        association_id: currentAssociation.id,
        event_type: eventType, title, description,
        mandatory_amount: parseFloat(mandatoryAmount) || 0,
        beneficiary_name: beneficiary,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        created_by: user.id,
      })
      if (error) throw error
      setShowCreate(false)
      setTitle(''); setDescription(''); setMandatoryAmount(''); setBeneficiary(''); setDeadline('')
      await loadEvents()
    } catch (err) { console.error(err) } finally { setCreating(false) }
  }

  const handlePay = async (event: AssociationEvent) => {
    if (!user) return
    setPaying(event.id)
    try {
      const { error } = await supabase.from('event_payments').insert({
        event_id: event.id, payer_id: user.id,
        amount: event.mandatory_amount, status: 'success',
      })
      if (error) throw error
      await loadEvents()
    } catch (err) { console.error(err) } finally { setPaying(null) }
  }

  if (!currentAssociation) {
    return <AppLayout><EmptyState icon={<Heart size={48} />} title={t('dashboard.noAssociation')} /></AppLayout>
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('events.title')}</h1>
          {userRole === 'proprio' && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> {t('events.create')}
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : events.length === 0 ? (
          <EmptyState icon={<Heart size={48} />} title={t('events.noEvents')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((event) => {
              const payments = event.payments || []
              const myPayment = payments.find((p: EventPayment) => p.payer_id === user?.id)
              return (
                <Card key={event.id} className="animate-slide-up">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: event.event_type === 'heureux' ? 'var(--color-success)' : 'var(--color-text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {event.event_type === 'heureux' ? <Heart size={20} color="#FFFFFF" /> : <CloudRain size={20} color="#FFFFFF" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', color: 'var(--color-text)' }}>{event.title}</h3>
                        <Badge variant={event.event_type === 'heureux' ? 'success' : 'default'} size="sm">
                          {t(`events.${event.event_type}`)}
                        </Badge>
                      </div>
                      {event.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{event.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          {formatXAF(event.mandatory_amount)}
                        </span>
                        {event.beneficiary_name && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{event.beneficiary_name}</span>}
                        {event.deadline && <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{formatDate(event.deadline)}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <Badge variant="default" size="sm">
                          {payments.filter((p: EventPayment) => p.status === 'success').length}/{payments.length} {t('events.paid')}
                        </Badge>
                      </div>
                      {event.status === 'active' && !myPayment && (
                        <Button size="sm" style={{ marginTop: '12px' }} loading={paying === event.id} onClick={() => handlePay(event)}>
                          {t('events.pay')} {formatXAF(event.mandatory_amount)}
                        </Button>
                      )}
                      {myPayment?.status === 'success' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--color-success)' }}>
                          <CheckCircle2 size={16} /><span style={{ fontSize: '13px', fontWeight: 500 }}>{t('events.paid')}</span>
                        </div>
                      )}
                      {myPayment?.status === 'pending' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--color-warning)' }}>
                          <Clock size={16} /><span style={{ fontSize: '13px' }}>{t('events.pending')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('events.create')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select label={t('events.eventType')} value={eventType} onChange={setEventType} options={[
            { value: 'heureux', label: t('events.heureux') },
            { value: 'malheureux', label: t('events.malheureux') },
          ]} />
          <Input label={t('events.title')} value={title} onChange={setTitle} required />
          <Input label={t('assoc.description')} value={description} onChange={setDescription} multiline rows={2} />
          <Input label={t('events.mandatoryAmount')} value={mandatoryAmount} onChange={setMandatoryAmount} type="number" required />
          <Input label={t('events.beneficiary')} value={beneficiary} onChange={setBeneficiary} />
          <Input label={t('events.deadline')} value={deadline} onChange={setDeadline} type="date" />
          <Button onClick={handleCreate} fullWidth loading={creating} disabled={!title}>
            {t('events.createButton')}
          </Button>
        </div>
      </Modal>
    </AppLayout>
  )
}
