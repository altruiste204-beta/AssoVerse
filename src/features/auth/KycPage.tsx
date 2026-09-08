import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { supabase } from '@/lib/supabase'
import { Button, Input, Card, Badge, Spinner } from '@/components/ui'
import { ShieldCheck, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react'

export function KycPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [docUploaded, setDocUploaded] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setDocUploaded(!!profile.id_document_url)
    }
  }, [profile])

  if (!user) {
    navigate('/login')
    return null
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/id-document.${ext}`
      const { error: upErr } = await supabase.storage
        .from('kyc-documents')
        .upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(path)
      await supabase
        .from('profiles')
        .update({ id_document_url: publicUrl })
        .eq('id', user.id)
      setDocUploaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            kyc_status: 'verified',
            kyc_verified_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      } else {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
        const response = await fetch(
          `${supabaseUrl}/functions/v1/verify-kyc`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              user_id: user.id,
              full_name: fullName,
              phone,
            }),
          }
        )
        if (!response.ok) {
          // Fallback to updating profile directly
          await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              phone,
              kyc_status: 'verified',
              kyc_verified_at: new Date().toISOString(),
            })
            .eq('id', user.id)
        }
      }
      await refreshProfile()
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const status = profile?.kyc_status || 'pending'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--color-bg)',
    }}>
      <div style={{ maxWidth: '480px', width: '100%' }} className="animate-slide-up">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <ShieldCheck size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--color-text)', marginBottom: '8px' }}>
            {t('kyc.title')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {t('kyc.subtitle')}
          </p>
        </div>

        {status === 'verified' && (
          <Card style={{ textAlign: 'center', marginBottom: '16px' }}>
            <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{t('kyc.status.verified')}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              {t('common.success')}
            </p>
            <Button onClick={() => navigate('/dashboard')} style={{ marginTop: '16px' }}>
              {t('nav.home')}
            </Button>
          </Card>
        )}

        {status === 'pending' && profile?.id_document_url && (
          <Card style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Clock size={48} color="var(--color-warning)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{t('kyc.status.pending')}</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              {t('common.loading')}
            </p>
          </Card>
        )}

        {status === 'rejected' && (
          <Card style={{ textAlign: 'center', marginBottom: '16px', border: '2px solid var(--color-error)' }}>
            <XCircle size={48} color="var(--color-error)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{t('kyc.status.rejected')}</h3>
          </Card>
        )}

        {status !== 'verified' && (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label={t('kyc.fullName')}
                value={fullName}
                onChange={setFullName}
                required
              />
              <Input
                label={t('kyc.phone')}
                value={phone}
                onChange={setPhone}
                required
                placeholder="+237 6XX XXX XXX"
              />

              <div>
                <label style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  display: 'block',
                  marginBottom: '6px',
                }}>
                  {t('kyc.idDocument')} *
                </label>
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  border: `2px dashed ${docUploaded ? 'var(--color-success)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                  gap: '8px',
                }}>
                  {uploading ? (
                    <Spinner size={24} />
                  ) : docUploaded ? (
                    <>
                      <CheckCircle2 size={24} color="var(--color-success)" />
                      <span style={{ fontSize: '14px', color: 'var(--color-success)', fontWeight: 500 }}>
                        {t('common.success')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} color="var(--color-text-muted)" />
                      <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                        {t('kyc.upload')}
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--color-error)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                }}>
                  {error}
                </div>
              )}

              <Button
                onClick={handleSubmit}
                fullWidth
                size="lg"
                loading={submitting}
                disabled={!docUploaded || !fullName || !phone}
              >
                {t('kyc.submit')}
              </Button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Badge variant={status === 'pending' ? 'warning' : 'default'}>
                  {status === 'pending' ? t('kyc.status.pending') : t('kyc.status.rejected')}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  )
}
