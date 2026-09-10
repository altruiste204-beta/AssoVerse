import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { useAssociation } from '@/features/associations/association-context'
import { AppLayout } from '@/components/layout/AppLayout'
import { Spinner, EmptyState } from '@/components/ui'
import { getEkangPatternSvg, getNdopPatternSvg } from '@/components/ui/CameroonPattern'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/utils'
import type { Message, Conversation, Profile } from '@/types/database'
import { Send, Pin, Trash2, Edit2, Check } from 'lucide-react'

export function MessagingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { currentAssociation } = useAssociation()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<(Message & { sender?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase.from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
      
      if (error) throw error

      if (data && data.length > 0) {
        // Fetch profiles of all unique senders
        const senderIds = Array.from(new Set(data.map((m: Message) => m.sender_id)))
        const { data: profiles, error: pError } = await supabase.from('profiles')
          .select('*')
          .in('id', senderIds)
        
        if (!pError && profiles) {
          const profileMap = new Map<string, Profile>(profiles.map((p: Profile) => [p.id, p]))
          const messagesWithSender = data.map((m: Message) => ({
            ...m,
            sender: profileMap.get(m.sender_id)
          }))
          setMessages(messagesWithSender)
        } else {
          setMessages(data)
        }
      } else {
        setMessages([])
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function init() {
      if (!currentAssociation) {
        if (active) setLoading(false)
        return
      }
      if (active) setLoading(true)
      
      try {
        const { data: existing } = await supabase.from('conversations')
          .select('*')
          .eq('association_id', currentAssociation.id)
          .maybeSingle()
        
        let conv = existing
        if (!conv) {
          const { data: created } = await supabase.from('conversations')
            .insert({ association_id: currentAssociation.id })
            .select()
            .single()
          conv = created
        }
        
        if (active && conv) {
          setConversation(conv as Conversation)
          await loadMessages(conv.id)
        }
      } catch (err) {
        console.error('Error initializing messaging:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    
    init()
    return () => {
      active = false
    }
  }, [currentAssociation, loadMessages])

  // Realtime
  useEffect(() => {
    if (!conversation) return
    const channel = supabase.channel(`messages:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, () => { loadMessages(conversation.id) })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, () => { loadMessages(conversation.id) })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, () => { loadMessages(conversation.id) })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversation, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!user || !conversation || !input.trim()) return
    const text = input.trim()
    setInput('')
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversation.id, sender_id: user.id, content: text,
      })
      if (error) throw error
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      await loadMessages(conversation.id)
    }
  }

  const handleEdit = async (msgId: string) => {
    if (!editText.trim() || !conversation) return
    try {
      const { error } = await supabase.from('messages').update({
        content: editText, edited_at: new Date().toISOString(),
      }).eq('id', msgId)
      if (error) throw error
    } catch (err) {
      console.error('Error editing message:', err)
    } finally {
      setEditingId(null)
      setEditText('')
      await loadMessages(conversation.id)
    }
  }

  const handleDeleteForMe = async (msgId: string) => {
    if (!conversation) return
    try {
      const { error } = await supabase.from('messages').update({ deleted_for_me: true }).eq('id', msgId)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting message for me:', err)
    } finally {
      setMenuOpenId(null)
      await loadMessages(conversation.id)
    }
  }

  const handleDeleteForAll = async (msgId: string) => {
    if (!conversation) return
    try {
      const { error } = await supabase.from('messages').update({ deleted_for_all: true }).eq('id', msgId)
      if (error) throw error
    } catch (err) {
      console.error('Error deleting message for all:', err)
    } finally {
      setMenuOpenId(null)
      await loadMessages(conversation.id)
    }
  }

  const handlePin = async (msgId: string, pinned: boolean) => {
    if (!conversation) return
    try {
      const { error } = await supabase.from('messages').update({ pinned: !pinned }).eq('id', msgId)
      if (error) throw error
    } catch (err) {
      console.error('Error pinning message:', err)
    } finally {
      setMenuOpenId(null)
      await loadMessages(conversation.id)
    }
  }

  if (!currentAssociation) {
    return <AppLayout><EmptyState title={t('dashboard.noAssociation')} /></AppLayout>
  }

  const pinnedMessages = messages.filter(m => m.pinned && !m.deleted_for_all)
  const regularMessages = messages.filter(m => !m.pinned && !m.deleted_for_all)

  return (
    <AppLayout>
      <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
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

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--color-text)' }}>{currentAssociation.name}</h1>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={32} /></div>
        ) : messages.length === 0 ? (
          <EmptyState title={t('messaging.noMessages')} />
        ) : (
          <>
            {pinnedMessages.length > 0 && (
              <div style={{ background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Pin size={12} /> Messages epingles
                </div>
                {pinnedMessages.map((msg) => <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user?.id} t={t}
                  menuOpen={menuOpenId === msg.id} onMenuToggle={() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id)}
                  onEdit={() => { setEditingId(msg.id); setEditText(msg.content); setMenuOpenId(null) }}
                  onDeleteForMe={() => handleDeleteForMe(msg.id)}
                  onDeleteForAll={() => handleDeleteForAll(msg.id)}
                  onPin={() => handlePin(msg.id, msg.pinned)}
                />)}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {regularMessages.map((msg) => (
                editingId === msg.id ? (
                  <div key={msg.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2}
                      style={{ flex: 1, padding: '10px', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-md)', background: 'var(--color-card)', color: 'var(--color-text)', fontSize: '14px', outline: 'none', resize: 'none' }}
                      autoFocus />
                    <button onClick={() => handleEdit(msg.id)} style={{ padding: '10px', background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: '#FFFFFF' }}>
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <MessageBubble key={msg.id} msg={msg} isMine={msg.sender_id === user?.id} t={t}
                    menuOpen={menuOpenId === msg.id} onMenuToggle={() => setMenuOpenId(menuOpenId === msg.id ? null : msg.id)}
                    onEdit={() => { setEditingId(msg.id); setEditText(msg.content); setMenuOpenId(null) }}
                    onDeleteForMe={() => handleDeleteForMe(msg.id)}
                    onDeleteForAll={() => handleDeleteForAll(msg.id)}
                    onPin={() => handlePin(msg.id, msg.pinned)}
                  />
                )
              ))}
            </div>
          </>
        )}

        <div ref={messagesEndRef} />

        <div style={{ position: 'sticky', bottom: '80px', display: 'flex', gap: '8px', alignItems: 'flex-end', background: 'var(--color-card)', padding: '12px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={t('messaging.placeholder')} rows={1}
            style={{ flex: 1, padding: '10px 14px', border: '2px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '14px', outline: 'none', resize: 'none' }}
          />
          <button onClick={handleSend} disabled={!input.trim()} style={{
            width: '44px', height: '44px', borderRadius: '50%', background: 'var(--color-primary)', border: 'none', cursor: 'pointer', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: input.trim() ? 1 : 0.5,
          }}>
            <Send size={18} />
          </button>
        </div>
        </div>
      </div>
    </AppLayout>
  )
}

function MessageBubble({ msg, isMine, t, menuOpen: _menuOpen, onMenuToggle, onEdit, onDeleteForMe, onDeleteForAll, onPin }: {
  msg: Message & { sender?: Profile }; isMine: boolean; t: (k: string) => string;
  menuOpen: boolean; onMenuToggle: () => void; onEdit: () => void; onDeleteForMe: () => void; onDeleteForAll: () => void; onPin: () => void;
}) {
  if (msg.deleted_for_me && isMine) return null
  return (
    <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative' }}
      onMouseLeave={() => onMenuToggle()}>
      <div style={{
        maxWidth: '75%', padding: '10px 14px', borderRadius: isMine ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
        background: isMine ? 'var(--color-primary)' : 'var(--color-card)', color: isMine ? '#FFFFFF' : 'var(--color-text)',
        boxShadow: 'var(--shadow-sm)', cursor: 'pointer', position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.querySelector('.msg-menu')?.setAttribute('style', 'display: flex; position: absolute; top: -28px; right: 0; gap: 4px; background: var(--color-card); padding: 4px; border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 10;') }}
      onMouseLeave={(e) => { e.currentTarget.querySelector('.msg-menu')?.setAttribute('style', 'display: none;') }}
      >
        {!isMine && msg.sender && (
          <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '2px', color: 'var(--color-primary)' }}>{msg.sender.full_name}</div>
        )}
        <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{msg.content}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>{timeAgo(msg.created_at)}</span>
          {msg.edited_at && <span style={{ fontSize: '10px', opacity: 0.6 }}>· {t('messaging.edit')}</span>}
          {msg.pinned && <Pin size={10} style={{ opacity: 0.7 }} />}
        </div>
        {isMine && (
          <div className="msg-menu" style={{ display: 'none' }}>
            <button onClick={onEdit} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><Edit2 size={14} /></button>
            <button onClick={onPin} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><Pin size={14} /></button>
            <button onClick={onDeleteForMe} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><Trash2 size={14} /></button>
            <button onClick={onDeleteForAll} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}><Trash2 size={14} /></button>
          </div>
        )}
      </div>
    </div>
  )
}
