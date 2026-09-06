import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/auth-context'
import { Button, Input } from '@/components/ui'
import { Globe, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/features/dashboard/theme-context'

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useTranslation()
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignup) {
      const { error } = await signUp(email, password, fullName, phone)
      if (error) {
        setError(error)
        setLoading(false)
        return
      }
      navigate('/kyc')
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
        setLoading(false)
        return
      }
      navigate('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        display: 'flex',
        gap: '8px',
      }}>
        <button
          onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            cursor: 'pointer', color: 'var(--color-text-secondary)',
          }}
        >
          <Globe size={18} />
        </button>
        <button
          onClick={toggleTheme}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-card)', border: '1px solid var(--color-border)',
            cursor: 'pointer', color: 'var(--color-text-secondary)',
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        maxWidth: '440px',
        margin: '0 auto',
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }} className="animate-slide-up">
          <div className="fluorescent-logo" style={{
            width: '72px',
            height: '72px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #14532D 0%, #F4C430 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontFamily: 'var(--font-heading)',
            fontSize: '32px',
            fontWeight: 700,
            color: '#FFFFFF',
          }}>
            A
          </div>
          <h1 style={{ fontSize: '28px', color: 'var(--color-text)', marginBottom: '8px' }}>
            {t('auth.welcome')}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
            {t('auth.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-slide-up">
          {isSignup && (
            <>
              <Input
                label={t('auth.fullName')}
                value={fullName}
                onChange={setFullName}
                required
                placeholder="Jean Dupont"
              />
              <Input
                label={t('auth.phone')}
                value={phone}
                onChange={setPhone}
                required
                placeholder="+237 6XX XXX XXX"
              />
            </>
          )}
          <Input
            label={t('auth.email')}
            value={email}
            onChange={setEmail}
            type="email"
            required
            placeholder="jean@example.com"
          />
          <Input
            label={t('auth.password')}
            value={password}
            onChange={setPassword}
            type="password"
            required
            placeholder="••••••••"
          />

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-error)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              animation: 'shake 300ms ease',
            }}>
              {error}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" loading={loading}>
            {isSignup ? t('auth.signup') : t('auth.login')}
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
          {isSignup ? (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('auth.haveAccount')} </span>
              <button
                onClick={() => navigate('/login')}
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {t('auth.signInNow')}
              </button>
            </>
          ) : (
            <>
              <span style={{ color: 'var(--color-text-muted)' }}>{t('auth.noAccount')} </span>
              <button
                onClick={() => navigate('/signup')}
                style={{
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {t('auth.signUpNow')}
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '13px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ← {t('landing.title')}
          </button>
        </div>
      </div>
    </div>
  )
}
