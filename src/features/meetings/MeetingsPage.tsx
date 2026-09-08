import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button, Card, Input, Select, Modal, Badge, Spinner, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/utils'
import type { Meeting, MeetingPlatform } from '@/types/database'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { Plus, Calendar, Video, Radio } from 'lucide-react'
import { InAppMeetingLive } from './InAppMeetingLive'

export function MeetingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation, userRole } = useAssociation()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [activeLiveMeeting, setActiveLiveMeeting] = useState<Meeting | null>(null)

  // form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [platform, setPlatform] = useState('direct')

  const loadMeetings = useCallback(async () => {
    if (!currentAssociation) { setLoading(false); return }
    const cacheKey = `assomboa_offline_meetings_${currentAssociation.id}`
    try {
      const { data, error } = await supabase.from('meetings')
        .select('*').eq('association_id', currentAssociation.id)
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      const fetchedMeetings = (data || []) as Meeting[]
      setMeetings(fetchedMeetings)
      localStorage.setItem(cacheKey, JSON.stringify(fetchedMeetings))
    } catch (err) {
      console.warn('Offline or error loading meetings, using cached backup:', err)
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setMeetings(JSON.parse(cached) as Meeting[])
        } catch (e) {
          console.error('Error parsing cached meetings:', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [currentAssociation])

  useEffect(() => { loadMeetings() }, [loadMeetings])

  const canCreate = !!userRole

  const handleCreate = async () => {
    if (!user || !currentAssociation || !title || !scheduledAt) return
    setCreating(true)
    try {
      const { error } = await supabase.from('meetings').insert({
        association_id: currentAssociation.id,
        title, description,
        scheduled_at: new Date(scheduledAt).toISOString(),
        external_link: 'in-app-live-webrtc',
        platform: platform as MeetingPlatform,
        created_by: user.id,
      })
      if (error) throw error
      setShowCreate(false)
      setTitle(''); setDescription(''); setScheduledAt('')
      await loadMeetings()
    } catch (err) { console.error(err) } finally { setCreating(false) }
  }

  if (!currentAssociation) {
    return <AppLayout><EmptyState icon={<Calendar size={48} />} title={t('dashboard.noAssociation')} /></AppLayout>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{t('meetings.title')}</h1>
          {canCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> {t('meetings.create')}
            </Button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : meetings.length === 0 ? (
          <EmptyState icon={<Calendar size={48} />} title={t('meetings.noMeetings')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {meetings.map((mtg) => {
              const isUpcoming = new Date(mtg.scheduled_at) > new Date()
              const isLiveOrUpcoming = true // Let users test and join anytime!
              return (
                <Card key={mtg.id} className="animate-slide-up">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                      background: isUpcoming ? 'var(--color-primary-light)' : 'var(--color-sand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Video size={20} color="var(--color-primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 600 }}>{mtg.title}</h3>
                        <Badge variant="success" size="sm">
                          <Radio size={12} className="animate-pulse" />
                          Direct In-App
                        </Badge>
                      </div>
                      {mtg.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{mtg.description}</p>}
                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} /> {formatDateTime(mtg.scheduled_at)}
                      </div>
                      
                      {isLiveOrUpcoming && (
                        <Button 
                          onClick={() => setActiveLiveMeeting(mtg)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '6px 16px', background: 'var(--color-primary)', color: '#FFFFFF', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500 }}
                          aria-label={`Rejoindre la réunion en direct dans l'application : ${mtg.title}`}
                        >
                          <Video size={14} /> Rejoindre la réunion en direct (In-App)
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('meetings.create')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input id="meeting-title-input" label={t('meetings.title_field')} value={title} onChange={setTitle} required aria-label="Titre de la réunion" />
          <Input id="meeting-desc-input" label={t('assoc.description')} value={description} onChange={setDescription} multiline rows={2} aria-label="Description de la réunion" />
          <Input id="meeting-date-input" label={t('meetings.scheduledAt')} value={scheduledAt} onChange={setScheduledAt} type="datetime-local" required aria-label="Date de planification" />
          <Select id="meeting-platform-select" label="Mode de réunion" value={platform} onChange={setPlatform} options={[
            { value: 'direct', label: 'Salon Vidéo en direct (AssoMboa Live WebRTC)' },
            { value: 'audio', label: 'Salon Audio uniquement (Discussion Directe)' },
          ]} aria-label="Mode ou type de la réunion" />
          <Button onClick={handleCreate} fullWidth loading={creating} disabled={!title || !scheduledAt} aria-label="Créer et enregistrer la réunion">
            {t('meetings.createButton')}
          </Button>
        </div>
      </Modal>

      {activeLiveMeeting && (
        <InAppMeetingLive 
          meeting={activeLiveMeeting} 
          onLeave={() => setActiveLiveMeeting(null)} 
        />
      )}
    </AppLayout>
  )
}
