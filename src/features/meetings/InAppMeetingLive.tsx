import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { CameroonAvatar } from '@/components/ui/CameroonPattern'
import { Button, Badge } from '@/components/ui'
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Send, MessageSquare, Users, 
  Hand, Share2, Shield, Volume2 
} from 'lucide-react'

interface InAppMeetingLiveProps {
  meeting: {
    id: string
    title: string
    description?: string | null
  }
  onLeave: () => void
}

export function InAppMeetingLive({ meeting, onLeave }: InAppMeetingLiveProps) {
  const { profile } = useAuth()
  const { currentAssociation } = useAssociation()
  
  // Controls state
  const [micActive, setMicActive] = useState(true)
  const [camActive, setCamActive] = useState(true)
  const [handRaised, setHandRaised] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat')
  
  // Real-time Chat state
  const [messages, setMessages] = useState<Array<{ sender: string, text: string, time: string, isMe?: boolean }>>([
    { sender: 'Amadou Ousmanou', text: 'Bonjour les mboas ! Prêt pour l\'ordre du jour ?', time: '10:00' },
    { sender: 'Fabiola Ngo', text: 'Oui, on doit finaliser la tontine de ce mois.', time: '10:01' },
    { sender: 'Jean-Pierre Kamga', text: 'Est-ce que le trésorier a reçu tous les virements AS-WALLET ?', time: '10:02' }
  ])
  const [newMessage, setNewMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Simulation of audio/video levels and other participants
  const [participants, setParticipants] = useState([
    { id: '1', name: 'Amadou Ousmanou', role: 'Président', hand: false, mic: true, avatar: 'CAM-AMADOU' },
    { id: '2', name: 'Fabiola Ngo', role: 'Trésorier', hand: false, mic: true, avatar: 'CAM-FABIOLA' },
    { id: '3', name: 'Jean-Pierre Kamga', role: 'Commissaire', hand: false, mic: false, avatar: 'CAM-KAMGA' },
    { id: '4', name: 'Dr. Suzanne Bella', role: 'Secrétaire', hand: false, mic: true, avatar: 'CAM-SUZANNE' },
  ])

  // Automatically scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulate messages arriving
  useEffect(() => {
    const chatSim = setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'Dr. Suzanne Bella',
        text: 'Je vais projeter le rapport de la caisse de secours d\'AssoMboa.',
        time: '10:04'
      }])
    }, 8000)

    const raiseSim = setTimeout(() => {
      setParticipants(prev => prev.map(p => p.id === '3' ? { ...p, hand: true } : p))
    }, 12000)

    return () => {
      clearTimeout(chatSim)
      clearTimeout(raiseSim)
    }
  }, [])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setMessages(prev => [...prev, {
      sender: profile?.full_name || 'Moi',
      text: newMessage,
      time: timeStr,
      isMe: true
    }])
    setNewMessage('')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#121214',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      color: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        background: '#1A1A1E',
        borderBottom: '1px solid #2A2A30'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700,
            animation: 'pulse 1.5s infinite',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', background: '#FFFFFF', borderRadius: '50%' }} />
            LIVE
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{meeting.title}</h2>
            <p style={{ fontSize: '11px', color: '#A1A1AA', margin: 0 }}>
              Association: {currentAssociation?.name} • Salon sécurisé
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge variant="accent" size="sm">
            <Shield size={12} style={{ marginRight: '4px' }} />
            Chiffrement WebRTC de bout en bout
          </Badge>
          <button 
            onClick={onLeave}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#DC2626'}
            onMouseOut={(e) => e.currentTarget.style.background = '#EF4444'}
          >
            <PhoneOff size={15} />
            Quitter
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left: Video Grid */}
        <div style={{
          flex: 1,
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          background: '#0F0F11',
          overflowY: 'auto',
          alignContent: 'center'
        }}>
          {/* Local User stream simulation */}
          <div style={{
            background: '#1E1E22',
            borderRadius: '12px',
            border: '2px solid var(--color-primary)',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {camActive ? (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#16161a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Simulated video frame */}
                <CameroonAvatar seed={profile?.avatar_url || 'local-me'} size={96} style={{ border: '4px solid var(--color-primary)' }} />
                <div style={{
                  position: 'absolute',
                  top: '12px', right: '12px',
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 8px', borderRadius: '4px',
                  fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <Volume2 size={12} color="var(--color-primary)" /> HD 1080p
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <CameroonAvatar seed={profile?.avatar_url || 'local-me'} size={72} />
                <span style={{ fontSize: '12px', color: '#A1A1AA' }}>Caméra désactivée</span>
              </div>
            )}
            
            <div style={{
              position: 'absolute',
              bottom: '12px', left: '12px',
              background: 'rgba(0,0,0,0.7)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {micActive ? <Mic size={12} color="#10B981" /> : <MicOff size={12} color="#EF4444" />}
              {profile?.full_name || 'Vous'} (Moi)
              {handRaised && <span style={{ fontSize: '14px' }}>✋</span>}
            </div>
          </div>

          {/* Participant video simulation */}
          {participants.map((p) => (
            <div key={p.id} style={{
              background: '#1A1A1E',
              borderRadius: '12px',
              border: '1px solid #2A2A30',
              position: 'relative',
              overflow: 'hidden',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                background: '#101a16',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <CameroonAvatar seed={p.avatar} size={72} />
                
                {p.hand && (
                  <div style={{
                    position: 'absolute',
                    top: '12px', right: '12px',
                    background: 'var(--color-primary)',
                    color: '#FFFFFF',
                    padding: '4px 8px', borderRadius: '4px',
                    fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Hand size={12} /> Demande parole
                  </div>
                )}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '12px', left: '12px',
                background: 'rgba(0,0,0,0.7)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {p.mic ? <Mic size={12} color="#10B981" /> : <MicOff size={12} color="#EF4444" />}
                {p.name}
                <Badge variant="default" size="sm">{p.role}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Panel (Chat / Participants) */}
        <div style={{
          width: '320px',
          background: '#1A1A1E',
          borderLeft: '1px solid #2A2A30',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Tabs header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#121214' }}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                padding: '14px',
                border: 'none',
                background: activeTab === 'chat' ? '#1A1A1E' : 'transparent',
                color: activeTab === 'chat' ? 'var(--color-primary)' : '#A1A1AA',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('participants')}
              style={{
                padding: '14px',
                border: 'none',
                background: activeTab === 'participants' ? '#1A1A1E' : 'transparent',
                color: activeTab === 'participants' ? 'var(--color-primary)' : '#A1A1AA',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: activeTab === 'participants' ? '2px solid var(--color-primary)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              Membres ({participants.length + 1})
            </button>
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeTab === 'chat' ? (
              <>
                {/* Chat message list */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  overflowY: 'auto'
                }}>
                  {messages.map((m, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        alignSelf: m.isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <span style={{ fontSize: '10px', color: '#A1A1AA', marginBottom: '2px', textAlign: m.isMe ? 'right' : 'left' }}>
                        {m.sender} • {m.time}
                      </span>
                      <div style={{
                        background: m.isMe ? 'var(--color-primary)' : '#2A2A30',
                        color: '#FFFFFF',
                        padding: '10px 14px',
                        borderRadius: m.isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '12.5px',
                        lineHeight: 1.4,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input box */}
                <div style={{ padding: '12px', borderTop: '1px solid #2A2A30', background: '#121214', display: 'flex', gap: '8px' }}>
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Écrire un message..."
                    style={{
                      flex: 1,
                      background: '#1A1A1E',
                      border: '1px solid #2A2A30',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSendMessage}
                    style={{ minHeight: '34px', width: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={15} />
                  </Button>
                </div>
              </>
            ) : (
              /* Participant list */
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                  <CameroonAvatar seed={profile?.avatar_url || 'local-me'} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{profile?.full_name || 'Vous'}</div>
                    <div style={{ fontSize: '11px', color: '#10B981' }}>Moi (Participant)</div>
                  </div>
                  {handRaised && <span title="Main levée">✋</span>}
                </div>

                {participants.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderTop: '1px solid #2A2A30' }}>
                    <CameroonAvatar seed={p.avatar} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#A1A1AA' }}>{p.role}</div>
                    </div>
                    {p.hand && <span title="Main levée">✋</span>}
                    {p.mic ? <Mic size={14} color="#10B981" /> : <MicOff size={14} color="#EF4444" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div style={{
        background: '#1A1A1E',
        borderTop: '1px solid #2A2A30',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Mic trigger */}
          <button
            onClick={() => setMicActive(!micActive)}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: micActive ? '#2A2A30' : '#EF4444',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={micActive ? 'Couper le micro' : 'Activer le micro'}
          >
            {micActive ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Camera trigger */}
          <button
            onClick={() => setCamActive(!camActive)}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: camActive ? '#2A2A30' : '#EF4444',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={camActive ? 'Couper la caméra' : 'Activer la caméra'}
          >
            {camActive ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {/* Raise Hand trigger */}
          <button
            onClick={() => setHandRaised(!handRaised)}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: handRaised ? 'var(--color-primary)' : '#2A2A30',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title={handRaised ? 'Baisser la main' : 'Demander la parole'}
          >
            <Hand size={18} />
          </button>

          {/* Screen Share trigger */}
          <button
            onClick={() => setScreenSharing(!screenSharing)}
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: screenSharing ? '#10B981' : '#2A2A30',
              color: '#FFFFFF', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Partager mon écran"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Info indicators at the right corner of control bar */}
        <div style={{ position: 'absolute', right: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#A1A1AA' }}>
            Qualité réseau : Excellente
          </span>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
        </div>
      </div>
    </div>
  )
}
