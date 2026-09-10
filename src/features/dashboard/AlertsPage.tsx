import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, Badge, Spinner, EmptyState, Button } from '@/components/ui'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { supabase } from '@/lib/supabase'
import { formatXAF, formatDate, daysUntil } from '@/lib/utils'
import { Bell, ShieldCheck, HandCoins, Heart, Calendar, Check, AlertTriangle, Send } from 'lucide-react'
import type { TransactionRequest, MainLevee, AssociationEvent, Meeting } from '@/types/database'

export function AlertsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { currentAssociation, userRole } = useAssociation()
  const [alerts, setAlerts] = useState<{ type: string; title: string; desc: string; action: () => void; variant: 'warning' | 'error' | 'primary' | 'accent' }[]>([])
  const [loading, setLoading] = useState(true)

  // Push notifications states
  const [pushSupported, setPushSupported] = useState(false)
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [swRegistered, setSwRegistered] = useState(false)

  useEffect(() => {
    // Check support
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setPushSupported(true)
      setPermission(Notification.permission)
      
      navigator.serviceWorker.ready.then(() => {
        setSwRegistered(true)
      })
    }
  }, [])

  const requestPushPermission = async () => {
    if (!pushSupported) return
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
    } catch (err) {
      console.error('Erreur demande de permission:', err)
    }
  }

  const triggerTestNotification = async (type: 'meeting' | 'message' | 'tontine') => {
    if (!pushSupported || permission !== 'granted') return
    
    try {
      const registration = await navigator.serviceWorker.ready
      
      let title = 'AssoMboa'
      let body = ''
      let path = '/alerts'

      if (type === 'meeting') {
        title = '📅 Nouvelle Réunion Planifiée'
        body = `La réunion mensuelle d'attribution de la tontine est fixée au dimanche prochain à 15h00 via Zoom.`
        path = '/meetings'
      } else if (type === 'message') {
        title = '💬 Message Urgent du Bureau'
        body = `Urgent (Président) : Veuillez finaliser vos cotisations AS-WALLET avant ce soir 20h.`
        path = '/messaging'
      } else if (type === 'tontine') {
        title = '💰 Gain de Tontine Attribué'
        body = `Félicitations ! Vos cotisations de cycle ont été approuvées. Un montant de 150 000 XAF est disponible.`
        path = '/tontines'
      }

      registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        tag: `test-push-${type}`,
        data: {
          url: path
        }
      } as any)
    } catch (err) {
      console.error('Erreur déclenchement notification:', err)
    }
  }

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
        
        {/* Top Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)', margin: 0 }}>{t('nav.alerts')}</h1>
          <Badge variant={swRegistered ? 'primary' : 'warning'}>
            {swRegistered ? 'PWA SW Actif' : 'En attente du SW'}
          </Badge>
        </div>

        {/* Interactive Push Notification controller card */}
        <Card style={{ padding: '20px', border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%',
              background: permission === 'granted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(200, 150, 62, 0.1)',
              color: permission === 'granted' ? 'var(--color-success)' : 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bell size={22} className={permission === 'default' ? 'animate-bounce' : ''} />
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Notifications Push AssoMboa
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                Restez alerté en temps réel lors de la planification de nouvelles réunions de tontine, d'appels à cotisation urgents ou de messages du bureau de l'association.
              </p>
            </div>
          </div>

          {/* Conditional state display */}
          {!pushSupported ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              Votre navigateur ou appareil ne supporte pas encore les notifications push. Veuillez l'ouvrir sur un navigateur mobile compatible (Safari iOS 16.4+ ou Chrome Android).
            </div>
          ) : permission === 'default' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', background: 'var(--color-sand)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text)', fontWeight: 600, flex: 1 }}>
                Le service est prêt à être activé sur votre appareil.
              </span>
              <Button size="sm" variant="primary" onClick={requestPushPermission}>
                Activer les notifications
              </Button>
            </div>
          ) : permission === 'denied' ? (
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Notifications bloquées.</strong> Pour recevoir les rappels de tontine, veuillez autoriser les notifications pour AssoMboa dans les paramètres de votre navigateur de téléphone.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Active Status Header */}
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={16} />
                Félicitations, le service de notifications push est activé de manière sécurisée via votre Service Worker.
              </div>

              {/* Push test simulator */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Simulateur de Notifications (Testez l'intégration réelle)
                </span>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => triggerTestNotification('meeting')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--color-card)', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--color-text)', cursor: 'pointer', transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                  >
                    <Send size={12} color="var(--color-primary)" /> Nouvelle Réunion
                  </button>

                  <button
                    onClick={() => triggerTestNotification('message')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--color-card)', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--color-text)', cursor: 'pointer', transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                  >
                    <Send size={12} color="var(--color-primary)" /> Message Important
                  </button>

                  <button
                    onClick={() => triggerTestNotification('tontine')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--color-card)', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '12px', fontWeight: 600,
                      color: 'var(--color-text)', cursor: 'pointer', transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                  >
                    <Send size={12} color="var(--color-primary)" /> Gain de Tontine
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : alerts.length === 0 ? (
          <EmptyState icon={<Bell size={48} />} title={t('nav.alerts')} description="Aucune alerte" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert, i) => (
              <Card key={i} onClick={alert.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
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
      </div>
    </AppLayout>
  )
}
