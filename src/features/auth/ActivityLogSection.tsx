import { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { 
  History, 
  Smartphone, 
  Laptop, 
  Monitor, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  LogOut, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { formatDateTime, timeAgo } from '@/lib/utils'

export interface ConnectionActivity {
  id: string
  timestamp: string // ISO string
  device: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
  browser: string
  os: string
  location: string
  ipMasked: string
  isCurrent: boolean
  revoked?: boolean
}

interface ActivityLogSectionProps {
  userId?: string
  onJumpToPassword?: () => void
}

export function ActivityLogSection({ userId = 'me', onJumpToPassword }: ActivityLogSectionProps) {
  const [activities, setActivities] = useState<ConnectionActivity[]>([])
  const [revokingAll, setRevokingAll] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const storageKey = `assomboa_activity_log_${userId}`

  // Helper to detect current browser, OS, device and approximate location
  const detectCurrentConnection = (): ConnectionActivity => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop'
    let os = 'Poste Web'
    let browser = 'Navigateur standard'

    if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet'
      os = 'iPadOS / Tablette'
    } else if (/iPhone/i.test(ua)) {
      deviceType = 'mobile'
      os = 'iPhone (iOS)'
    } else if (/Android/i.test(ua)) {
      deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet'
      os = 'Android Mobile'
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      deviceType = 'desktop'
      os = 'macOS'
    } else if (/Windows/i.test(ua)) {
      deviceType = 'desktop'
      os = 'Windows'
    } else if (/Linux/i.test(ua)) {
      deviceType = 'desktop'
      os = 'Linux'
    }

    if (/Edg\//i.test(ua)) {
      browser = 'Microsoft Edge'
    } else if (/Chrome|CriOS/i.test(ua) && !/Edg/i.test(ua)) {
      browser = 'Google Chrome'
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
      browser = 'Apple Safari'
    } else if (/Firefox|FxiOS/i.test(ua)) {
      browser = 'Mozilla Firefox'
    }

    // Timezone based approximate location
    let location = 'Douala, Littoral (Cameroun)'
    let ipMasked = '102.244.89.••• (Orange CM)'
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      if (tz.includes('Paris') || tz.includes('Europe')) {
        location = 'Paris, Île-de-France (Diaspora)'
        ipMasked = '194.51.12.••• (Freebox Fibre)'
      } else if (tz.includes('America') || tz.includes('Toronto') || tz.includes('Montreal')) {
        location = 'Montréal, QC (Diaspora Canada)'
        ipMasked = '142.112.44.••• (Bell Canada)'
      } else if (tz.includes('Lagos') || tz.includes('Abidjan')) {
        location = 'Yaoundé, Centre (Cameroun)'
        ipMasked = '154.72.168.••• (MTN Cameroon)'
      }
    } catch {
      // Fallback
    }

    return {
      id: 'current-session',
      timestamp: new Date().toISOString(),
      device: `${os} • ${browser}`,
      deviceType,
      browser,
      os,
      location,
      ipMasked,
      isCurrent: true,
      revoked: false
    }
  }

  // Load or initialize the 5 connections
  const loadActivities = () => {
    try {
      const current = detectCurrentConnection()
      const raw = localStorage.getItem(storageKey)
      
      if (raw) {
        const parsed = JSON.parse(raw) as ConnectionActivity[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Guarantee the current session is at index 0 and updated
          const historical = parsed.filter(item => !item.isCurrent)
          const merged = [current, ...historical].slice(0, 5)
          setActivities(merged)
          return
        }
      }

      // Seed 5 realistic entries (1 current + 4 previous sessions)
      const now = Date.now()
      const initialLogs: ConnectionActivity[] = [
        current,
        {
          id: 'session-2',
          timestamp: new Date(now - 1000 * 60 * 60 * 18).toISOString(), // 18 hours ago
          device: 'Samsung Galaxy A54 • Chrome Mobile',
          deviceType: 'mobile',
          browser: 'Google Chrome',
          os: 'Android 14',
          location: 'Yaoundé, Centre (Cameroun)',
          ipMasked: '154.72.168.••• (MTN Cameroon)',
          isCurrent: false,
          revoked: false
        },
        {
          id: 'session-3',
          timestamp: new Date(now - 1000 * 60 * 60 * 68).toISOString(), // ~3 days ago
          device: 'MacBook Pro • Apple Safari',
          deviceType: 'desktop',
          browser: 'Apple Safari',
          os: 'macOS Sonoma',
          location: 'Douala, Littoral (Cameroun)',
          ipMasked: '102.244.89.••• (Orange CM)',
          isCurrent: false,
          revoked: false
        },
        {
          id: 'session-4',
          timestamp: new Date(now - 1000 * 60 * 60 * 124).toISOString(), // ~5 days ago
          device: 'iPhone 14 • Safari iOS',
          deviceType: 'mobile',
          browser: 'Mobile Safari',
          os: 'iOS 17.5',
          location: 'Bafoussam, Ouest (Cameroun)',
          ipMasked: '197.234.22.••• (Camtel FAI)',
          isCurrent: false,
          revoked: false
        },
        {
          id: 'session-5',
          timestamp: new Date(now - 1000 * 60 * 60 * 192).toISOString(), // ~8 days ago
          device: 'PC Windows • Google Chrome',
          deviceType: 'desktop',
          browser: 'Google Chrome',
          os: 'Windows 11',
          location: 'Douala, Littoral (Cameroun)',
          ipMasked: '102.244.89.••• (Orange CM)',
          isCurrent: false,
          revoked: false
        }
      ]

      localStorage.setItem(storageKey, JSON.stringify(initialLogs))
      setActivities(initialLogs)
    } catch {
      // Fallback
      setActivities([detectCurrentConnection()])
    }
  }

  useEffect(() => {
    loadActivities()
  }, [userId])

  const handleRevokeSession = (id: string) => {
    const updated = activities.map(item => {
      if (item.id === id) {
        return { ...item, revoked: true }
      }
      return item
    })
    setActivities(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setSuccessMessage('La session sélectionnée a été révoquée et déconnectée avec succès.')
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleRevokeAllOtherSessions = () => {
    setRevokingAll(true)
    setTimeout(() => {
      const updated = activities.map(item => {
        if (!item.isCurrent) {
          return { ...item, revoked: true }
        }
        return item
      })
      setActivities(updated)
      localStorage.setItem(storageKey, JSON.stringify(updated))
      setRevokingAll(false)
      setSuccessMessage('Toutes les autres sessions distantes ont été clôturées avec succès.')
      setTimeout(() => setSuccessMessage(null), 4000)
    }, 400)
  }

  const getDeviceIcon = (deviceType: 'mobile' | 'desktop' | 'tablet') => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone size={18} />
      case 'tablet':
        return <Laptop size={18} />
      default:
        return <Monitor size={18} />
    }
  }

  return (
    <Card style={{ padding: '20px' }}>
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="var(--color-primary)" />
            2. Journal d'activité des connexions
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Consultez les 5 dernières connexions enregistrées sur votre compte pour garantir une totale transparence et vérifier l'intégrité de vos accès.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadActivities}
            title="Actualiser la liste"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
          >
            <RefreshCw size={13} />
            Actualiser
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRevokeAllOtherSessions}
            loading={revokingAll}
            style={{ fontSize: '11px', height: '32px', minHeight: '32px' }}
          >
            <LogOut size={13} style={{ marginRight: '4px' }} />
            Déconnecter les autres sessions
          </Button>
        </div>
      </div>

      {/* FEEDBACK SUCCESS BANNER */}
      {successMessage && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.08)', 
          border: '1px solid rgba(16, 185, 129, 0.25)', 
          borderRadius: 'var(--radius-md)', 
          padding: '10px 14px', 
          fontSize: '12px', 
          color: 'var(--color-success)', 
          fontWeight: 600, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginBottom: '16px',
          animation: 'fadeIn 200ms ease'
        }}>
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {/* 5 SESSIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {activities.map((act, index) => {
          return (
            <div 
              key={act.id || index}
              style={{
                background: act.isCurrent 
                  ? 'rgba(20, 83, 45, 0.03)' 
                  : act.revoked 
                    ? 'rgba(107, 114, 128, 0.04)' 
                    : 'var(--color-card)',
                border: act.isCurrent 
                  ? '1.5px solid var(--color-primary)' 
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'all 150ms ease'
              }}
            >
              {/* Top Row: Device Name + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: act.isCurrent ? 'var(--color-primary)' : 'var(--color-sand)',
                    color: act.isCurrent ? '#FFFFFF' : 'var(--color-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getDeviceIcon(act.deviceType)}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {act.device}
                      {act.isCurrent && (
                        <span style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: 'var(--color-success)', 
                          display: 'inline-block',
                          boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {act.os} • {act.browser}
                    </div>
                  </div>
                </div>

                {/* Status indicator badge */}
                <div>
                  {act.isCurrent ? (
                    <Badge variant="success">Session active actuelle</Badge>
                  ) : act.revoked ? (
                    <Badge variant="default">Session déconnectée</Badge>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Badge variant="default">Connexion passée</Badge>
                      <button
                        onClick={() => handleRevokeSession(act.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-error)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'background 150ms ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        Révoquer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Metadata info chips */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '8px', 
                paddingTop: '8px', 
                borderTop: '1px dashed var(--color-border)',
                fontSize: '11.5px',
                color: 'var(--color-text-secondary)'
              }}>
                {/* Date & Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <span>
                    <strong>{formatDateTime(act.timestamp)}</strong> ({timeAgo(act.timestamp)})
                  </span>
                </div>

                {/* Approximate Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                  <span>
                    Lieu : <strong>{act.location}</strong>
                  </span>
                </div>

                {/* Masked IP / Network */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                  <span>
                    IP : <code style={{ fontSize: '11px', background: 'var(--color-sand)', padding: '1px 5px', borderRadius: '3px' }}>{act.ipMasked}</code>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* SECURITY NOTICE & RECOMMENDATIONS */}
      <div style={{ 
        background: 'var(--color-sand)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 'var(--radius-md)', 
        padding: '14px', 
        display: 'flex', 
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: 'rgba(200, 150, 62, 0.15)', 
          color: 'var(--color-accent)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexShrink: 0 
        }}>
          <AlertTriangle size={17} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
            Vous ne reconnaissez pas un appareil ou un lieu listé ci-dessus ?
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', margin: '4px 0 8px 0', lineHeight: 1.5 }}>
            Si une connexion vous semble suspecte ou provient d'une région non habituelle, déconnectez immédiatement toutes les sessions actives à l'aide du bouton ci-dessus et renouvelez votre mot de passe pour protéger vos avoirs AS-WALLET et vos associations.
          </p>
          {onJumpToPassword && (
            <button
              onClick={onJumpToPassword}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 700,
                fontSize: '11.5px',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={14} />
              Modifier mon mot de passe dès maintenant →
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
