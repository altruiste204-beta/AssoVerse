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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')

  // form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [platform, setPlatform] = useState('direct')

  // filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

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

  const handleEndMeeting = async (meetingId: string, chatTranscript?: Array<{ sender: string, text: string, time: string }>) => {
    try {
      const endedAt = new Date().toISOString()
      const { error } = await supabase.from('meetings')
        .update({ status: 'ended', ended_at: endedAt })
        .eq('id', meetingId)
      
      if (error) {
        // Fallback for PGRST204 (Columns missing in remote schema cache)
        if (error.code === 'PGRST204' || error.message?.includes('ended_at')) {
          console.warn('History columns not provisioned on remote database, falling back to delete.', error)
          const { error: delError } = await supabase.from('meetings').delete().eq('id', meetingId)
          if (delError) throw delError
        } else {
          throw error
        }
      }

      if (currentAssociation) {
        // Try to get or create conversation
        const { data: conv } = await supabase.from('conversations')
          .select('*').eq('association_id', currentAssociation.id).maybeSingle()
        let conversationId = conv?.id
        if (!conversationId) {
          const { data: created } = await supabase.from('conversations')
            .insert({ association_id: currentAssociation.id }).select().single()
          conversationId = created?.id
        }

        if (conversationId) {
          let transcriptText = '_Aucune discussion par message n\'a eu lieu durant cette session._'
          if (chatTranscript && chatTranscript.length > 0) {
            transcriptText = chatTranscript
              .map(m => `**[${m.time}] ${m.sender}** : ${m.text}`)
              .join('\n')
          }

          const recapContent = `📣 **Récapitulatif de réunion : "${activeLiveMeeting?.title}"**\n\n*La session s'est terminée le ${formatDateTime(endedAt)}.*\n\n--- 💬 **Discussions de la session :** ---\n\n${transcriptText}`

          await supabase.from('messages').insert({
            conversation_id: conversationId,
            content: recapContent,
            sender_id: user?.id
          })
        }
      }

      setActiveLiveMeeting(null)
      await loadMeetings()
    } catch (err) {
      console.error('Error ending meeting:', err)
      // Safety fallback to close the screen even if DB has errors
      setActiveLiveMeeting(null)
    }
  }

  const getFilteredMeetings = () => {
    return meetings.filter(m => {
      const matchTab = activeTab === 'upcoming' ? m.status !== 'ended' : m.status === 'ended'
      if (!matchTab) return false

      if (activeTab === 'history') {
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const titleMatch = m.title?.toLowerCase().includes(term)
          const descMatch = m.description?.toLowerCase().includes(term)
          if (!titleMatch && !descMatch) return false
        }

        if (filterType !== 'all') {
          if (m.platform !== filterType) return false
        }

        if (filterStartDate) {
          const start = new Date(filterStartDate)
          start.setHours(0, 0, 0, 0)
          const meetingDate = new Date(m.scheduled_at)
          if (meetingDate < start) return false
        }

        if (filterEndDate) {
          const end = new Date(filterEndDate)
          end.setHours(23, 59, 59, 999)
          const meetingDate = new Date(m.scheduled_at)
          if (meetingDate > end) return false
        }
      }

      return true
    })
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

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '4px' }}>
          <button 
            onClick={() => setActiveTab('upcoming')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'upcoming' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              color: activeTab === 'upcoming' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              padding: '8px 12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Réunions programmées
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'history' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              padding: '8px 12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Historique des sessions
          </button>
        </div>

        {activeTab === 'history' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'var(--color-bg-alt)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginTop: '8px',
            marginBottom: '4px'
          }} className="animate-fade-in">
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <Input
                  id="search-sessions-input"
                  label="Rechercher une réunion"
                  placeholder="Rechercher par titre, description..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                />
              </div>
              <div style={{ flex: '1 1 180px' }}>
                <Select
                  id="filter-type-select"
                  label="Type de réunion"
                  value={filterType}
                  onChange={setFilterType}
                  options={[
                    { value: 'all', label: 'Tous les types' },
                    { value: 'direct', label: 'Salon Vidéo (WebRTC)' },
                    { value: 'audio', label: 'Salon Audio' }
                  ]}
                />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 140px' }}>
                <Input
                  id="filter-start-date"
                  label="Depuis le"
                  type="date"
                  value={filterStartDate}
                  onChange={setFilterStartDate}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <Input
                  id="filter-end-date"
                  label="Jusqu'au"
                  type="date"
                  value={filterEndDate}
                  onChange={setFilterEndDate}
                />
              </div>
              {(searchTerm || filterType !== 'all' || filterStartDate || filterEndDate) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterType('all')
                    setFilterStartDate('')
                    setFilterEndDate('')
                  }}
                  style={{ height: '42px', display: 'flex', alignItems: 'center' }}
                  aria-label="Effacer les filtres"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : getFilteredMeetings().length === 0 ? (
          <EmptyState 
            icon={<Calendar size={48} />} 
            title={activeTab === 'upcoming' 
              ? t('meetings.noMeetings') 
              : (searchTerm || filterType !== 'all' || filterStartDate || filterEndDate) 
                ? "Aucune session ne correspond à vos filtres" 
                : "Aucun historique de session disponible"
            } 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {getFilteredMeetings()
              .map((mtg) => {
                const isUpcoming = new Date(mtg.scheduled_at) > new Date()
                const isEnded = mtg.status === 'ended'
                return (
                  <Card key={mtg.id} className="animate-slide-up">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                        background: isEnded ? 'var(--color-bg-alt)' : (isUpcoming ? 'var(--color-primary-light)' : 'var(--color-sand)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Video size={20} color={isEnded ? 'var(--color-text-muted)' : 'var(--color-primary)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span 
                              className={!isEnded && !isUpcoming ? "animate-pulse" : ""}
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: isEnded ? '#9CA3AF' : (isUpcoming ? '#3B82F6' : '#22C55E'),
                                display: 'inline-block',
                                flexShrink: 0,
                              }} 
                              title={isEnded ? "Terminée" : (isUpcoming ? "Planifiée" : "En cours")}
                            />
                            <h3 style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: 600 }}>{mtg.title}</h3>
                          </div>
                          {isEnded ? (
                            <Badge variant="default" size="sm">
                              Terminée
                            </Badge>
                          ) : !isUpcoming ? (
                            <Badge variant="success" size="sm">
                              <Radio size={12} className="animate-pulse" />
                              En cours
                            </Badge>
                          ) : (
                            <Badge variant="accent" size="sm">
                              Planifiée
                            </Badge>
                          )}
                        </div>
                        {mtg.description && <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>{mtg.description}</p>}
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} /> 
                          {isEnded 
                            ? `Terminée le : ${formatDateTime(mtg.ended_at || mtg.scheduled_at)}`
                            : `Planifiée le : ${formatDateTime(mtg.scheduled_at)}`
                          }
                        </div>
                        
                        {!isEnded && (
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
          onEndMeeting={(transcript) => handleEndMeeting(activeLiveMeeting.id, transcript)}
        />
      )}
    </AppLayout>
  )
}
