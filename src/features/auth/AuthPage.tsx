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

  const handleDemoLogin = async () => {
    setError(null)
    setLoading(true)
    setEmail('altruiste2.0.4@gmail.com')
    setPassword('demo1234')
    const { error } = await signIn('altruiste2.0.4@gmail.com', 'demo1234')
    if (error) {
      setError(error)
      setLoading(false)
      return
    }
    navigate('/dashboard')
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
          <img 
            src="/logo.png" 
            alt="AssoMboa Logo" 
            style={{ 
              width: '76px', 
              height: '76px', 
              objectFit: 'contain',
              borderRadius: '12px',
              margin: '0 auto 16px'
            }}
            referrerPolicy="no-referrer"
          />
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

          {!isSignup && (
            <button
              type="button"
              onClick={handleDemoLogin}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-primary)',
                background: 'rgba(217, 119, 6, 0.08)',
                color: 'var(--color-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
            >
              <span>⚡</span> Connexion rapide (Alain Mboa - altruiste2.0.4@gmail.com)
            </button>
          )}

          {isSignup && (
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '-4px', lineHeight: 1.4 }}>
              En vous inscrivant, vous acceptez pleinement les{' '}
              <button
                type="button"
                onClick={() => navigate('/cgu')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                Conditions Générales (CGU)
              </button>{' '}
              et la{' '}
              <button
                type="button"
                onClick={() => navigate('/politique-confidentialite')}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', textDecoration: 'underline', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
              >
                Politique de confidentialité
              </button>{' '}
              d'AssoMboa.
            </p>
          )}
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
