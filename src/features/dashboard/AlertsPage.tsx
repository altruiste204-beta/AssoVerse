import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Badge, Spinner, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatXAF, formatDate, daysUntil } from '@/lib/utils'
import { Bell, ShieldCheck, HandCoins, Heart, Calendar } from 'lucide-react'
import type { TransactionRequest, MainLevee, AssociationEvent, Meeting } from '@/types/database'

export function AlertsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentAssociation, userRole } = useAssociation()
  const [alerts, setAlerts] = useState<{ type: string; title: string; desc: string; action: () => void; variant: 'warning' | 'error' | 'primary' | 'accent' }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      if (!currentAssociation) { setLoading(false); return }
      const items: { type: string; title: string; desc: string; action: () => void; variant: 'warning' | 'error' | 'primary' | 'accent' }[] = []

      const [txRes, mlRes, evRes, mtgRes] = await Promise.all([
        supabase.from('transaction_requests').select('*').eq('association_id', currentAssociation.id).eq('status', 'pending'),
        supabase.from('main_levees').select('*').eq('association_id', currentAssociation.id).eq('status', 'active'),
        supabase.from('association_events').select('*').eq('association_id', currentAssociation.id).eq('status', 'active'),
        supabase.from('meetings').select('*').eq('association_id', currentAssociation.id).gte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(3),
      ])

      if (userRole && txRes.data && txRes.data.length > 0) {
        txRes.data.forEach((req: TransactionRequest) => {
          items.push({
            type: 'tx', variant: 'warning',
            title: `${t('bureau.requestType.' + req.type)} — ${formatXAF(req.amount)}`,
            desc: t('bureau.approvalCount', { current: 0, required: req.required_approvals }),
            action: () => navigate('/bureau'),
          })
        })
      }

      if (mlRes.data) {
        mlRes.data.forEach((ml: MainLevee) => {
          const days = daysUntil(ml.deadline)
          if (days <= 3 && days >= 0) {
            items.push({
              type: 'ml', variant: days <= 1 ? 'error' : 'accent',
              title: ml.title,
              desc: t('mainLevee.daysLeft', { days }),
              action: () => navigate('/main-levee'),
            })
          }
        })
      }

      if (evRes.data) {
        evRes.data.forEach((ev: AssociationEvent) => {
          if (ev.deadline && daysUntil(ev.deadline) <= 3) {
            items.push({
              type: 'ev', variant: 'accent',
              title: ev.title,
              desc: `${t('events.' + ev.event_type)} — ${formatXAF(ev.mandatory_amount)}`,
              action: () => navigate('/events'),
            })
          }
        })
      }

      if (mtgRes.data) {
        mtgRes.data.forEach((mtg: Meeting) => {
          items.push({
            type: 'mtg', variant: 'primary',
            title: mtg.title,
            desc: formatDate(mtg.scheduled_at),
            action: () => navigate('/meetings'),
          })
        })
      }

      setAlerts(items)
      setLoading(false)
    }
    loadAlerts()
  }, [currentAssociation, userRole, navigate, t])

  const icons: Record<string, React.ReactNode> = {
    tx: <ShieldCheck size={20} />, ml: <HandCoins size={20} />,
    ev: <Heart size={20} />, mtg: <Calendar size={20} />,
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('nav.alerts')}</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={<Bell size={48} />} title={t('nav.alerts')} description="Aucune alerte" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert, i) => (
              <Card key={i} onClick={alert.action} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: `var(--color-${alert.variant === 'warning' ? 'warning' : alert.variant === 'error' ? 'error' : alert.variant === 'accent' ? 'accent' : 'primary'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FFFFFF',
                }}>
                  {icons[alert.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{alert.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{alert.desc}</div>
                </div>
                <Badge variant={alert.variant} size="sm">!</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
